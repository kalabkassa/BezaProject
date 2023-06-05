#include <BLEDevice.h>

#include <WiFi.h>
#include <WebSocketClient.h>

#include "time.h"
#include "sntp.h"

#define REV(x) ( ((x&0xff000000)>>24) | (((x&0x00ff0000)<<8)>>16) | (((x&0x0000ff00)>>8)<<16) | ((x&0x000000ff) << 24) )

// BLE Scan parameters
#define SCAN_TIME_SECONDS 10

// BLE UUIDs
#define DEVICE_COUNT 2

// Global variables
//wifi and websocket server setup
const char* ssid     = "mi";
const char* password = "pipipipi";
char path[] = "/update/temp/";
char host[] = "192.168.43.189";
uint16_t port = 8000;

//NTP server setup 
const char* ntpServer1 = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

const char* time_zone = "CET-1CEST,M3.5.0,M10.5.0/3";  // TimeZone rule for Europe/Rome including daylight adjustment rules (optional)

const char* SERVICE_UUIDS[DEVICE_COUNT] = {
  "00001809-0000-1000-8000-00805f9b34fb", //temp
  "0000180f-0000-1000-8000-00805f9b34fb" //heart rate
};
const char* NOTIFY_CHARACTERISTIC_UUIDS[DEVICE_COUNT] = {
  "00002a1c-0000-1000-8000-00805f9b34fb" //temp
  "00002a37-0000-1000-8000-00805f9b34fb", //heart rate
};
const char* READ_CHARACTERISTIC_UUIDS[DEVICE_COUNT] = {
  "00002a37-0000-1000-8000-00805f9b34fb",
  "00002a1c-0000-1000-8000-00805f9b34fb"
};

bool deviceFound[DEVICE_COUNT] = { false };
BLEAdvertisedDevice* advertisedDevices[DEVICE_COUNT];
BLEClient* pClients[DEVICE_COUNT];
BLERemoteCharacteristic* pNotifyCharacteristics[DEVICE_COUNT];
BLERemoteCharacteristic* pReadCharacteristics[DEVICE_COUNT];

WebSocketClient webSocketClient;
// Use WiFiClient class to create TCP connections
WiFiClient client;

std::string tempData;
std::string heartrateData;

std::string LocalTime()
{
  struct tm timeinfo;
  if(!getLocalTime(&timeinfo)){
    Serial.println("No time available (yet)");
    return "NAN";
  }
  char timestamp[21];
  strftime(timestamp, 21,"%B %d %Y %H:%M:%S", &timeinfo);
  return timestamp;
}

// Callback function (get's called when time adjusts via NTP)
void timeavailable(struct timeval *t)
{
  Serial.println("Got time adjustment from NTP!");
  LocalTime();
}

void serverUpdate(const char* data){
  if (client.connected())
    webSocketClient.sendData(data);
  else{
    Serial.println("websocket disconnected");
    websocket_setup();
  }
}

void wifi_setup(){
    // We start by connecting to a WiFi network
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");  
  delay(5000);
}

void websocket_setup(){
  // Connect to the websocket server
  if (client.connect(host, port)) {
    Serial.println("Connected");
  } else {
    Serial.println("Connection failed.");
  }

  // Handshake with the server
  webSocketClient.path = path;
  webSocketClient.host = host;
  if (webSocketClient.handshake(client)) {
    Serial.println("Handshake successful");
  } else {
    Serial.println("Handshake failed."); 
  }
}

// Callback functions for each device's notify characteristic
void deviceNotifyCallback(uint8_t deviceIndex, BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
  Serial.print("Notification received from Device ");
  Serial.print(deviceIndex);
  Serial.print(": ");
  if(deviceIndex==0)
  {
    uint32_t data = pData[3];
    data = data << 16;
    data += pData[2];
    data = data << 8;
    data += pData[1];
    float temp = (float)data;
    int expo = (int)pData[4];
    expo -= 256;
    temp = temp*pow(10,expo);
    Serial.println(temp);

    tempData = std::to_string(temp);
    std::string sdata = heartrateData + "," + tempData + "," + LocalTime();
    serverUpdate(sdata.c_str());
  }
  else
  {
    Serial.println(pData[1]);
    heartrateData = std::to_string(pData[1]);
  }
  Serial.println();
}

// Callback functions for each device's read characteristic
void deviceReadCallback(uint8_t deviceIndex, BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length) {
  Serial.print("Read response received from Device ");
  Serial.print(deviceIndex);
  Serial.print(": ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)pData[i]);
  }
  Serial.println();
}

class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    Serial.print("BLE Advertised Device found: ");
    Serial.println(advertisedDevice.toString().c_str());
    for (int i = 0; i < DEVICE_COUNT; i++) {
      if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(BLEUUID(SERVICE_UUIDS[i]))) {
        // Found one of the desired devices
        deviceFound[i] = true;
        advertisedDevices[i] = new BLEAdvertisedDevice(advertisedDevice);;
        break;
      }
    }
  }
};

bool connectToDevice(uint8_t deviceIndex) {
  pClients[deviceIndex] = BLEDevice::createClient();

  Serial.print("Connecting to Device ");
  Serial.println(deviceIndex);

  if (!pClients[deviceIndex]->connect(advertisedDevices[deviceIndex])) {
    Serial.println("Failed to connect.");
    return false;
  }

  BLERemoteService* pRemoteService = pClients[deviceIndex]->getService(BLEUUID(SERVICE_UUIDS[deviceIndex]));
  if (pRemoteService == nullptr) {
    Serial.println("Failed to find service.");
    pClients[deviceIndex]->disconnect();
    return false;
  }

  pNotifyCharacteristics[deviceIndex] = pRemoteService->getCharacteristic(BLEUUID(NOTIFY_CHARACTERISTIC_UUIDS[deviceIndex]));
  pReadCharacteristics[deviceIndex] = pRemoteService->getCharacteristic(BLEUUID(READ_CHARACTERISTIC_UUIDS[deviceIndex]));

  if (pNotifyCharacteristics[deviceIndex] == nullptr || pReadCharacteristics[deviceIndex] == nullptr) {
    Serial.println("Failed to find characteristics.");
    pClients[deviceIndex]->disconnect();
    return false;
  }
  
  pNotifyCharacteristics[deviceIndex]->registerForNotify(std::bind(deviceNotifyCallback, deviceIndex, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3, std::placeholders::_4));
  pReadCharacteristics[deviceIndex]->registerForNotify(std::bind(deviceReadCallback, deviceIndex, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));

  return true;
}

void reconnectToDevice(uint8_t deviceIndex) {
  Serial.print("Reconnecting to Device ");
  Serial.println(deviceIndex);

  // Disconnect and clear the client
  if (pClients[deviceIndex] != nullptr) {
    pClients[deviceIndex]->disconnect();
    delete pClients[deviceIndex];
    pClients[deviceIndex] = nullptr;
  }

  // Clear the notify and read characteristics
  pNotifyCharacteristics[deviceIndex] = nullptr;
  pReadCharacteristics[deviceIndex] = nullptr;

  // Attempt to reconnect
  while (!connectToDevice(deviceIndex)) {
    Serial.println("Failed to reconnect, retrying...");
    delay(1000);
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000); // Delay for serial monitor

  sntp_set_time_sync_notification_cb(timeavailable);
  sntp_servermode_dhcp(1);
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer1, ntpServer2);


  BLEDevice::init("");
  BLEScan* pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->start(SCAN_TIME_SECONDS);

  // while (true) {
  //   bool allDevicesFound = true;
  //   for (int i = 0; i < DEVICE_COUNT; i++) {
  //     if (!deviceFound[i]) {
  //       allDevicesFound = false;
  //       break;
  //     }
  //   }
  //   if (allDevicesFound) {
  //     break;
  //   }
  //   delay(1000);
  // }

  for (int i = 0; i < DEVICE_COUNT; i++) {
    if (!connectToDevice(i)) {
      // Handle failed connection and reconnect
      Serial.println("Failed to connect to Device, reconnecting...");
      reconnectToDevice(i);
    }
  }
  wifi_setup();
  websocket_setup();
}

void loop() {
  // Do nothing in the loop

}