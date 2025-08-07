#include <BLEDevice.h>

#include <WiFi.h>
#include <ArduinoWebsockets.h>


#include "time.h"
#include "sntp.h"

#define REV(x) ( ((x&0xff000000)>>24) | (((x&0x00ff0000)<<8)>>16) | (((x&0x0000ff00)>>8)<<16) | ((x&0x000000ff) << 24) )

// BLE Scan parameters
#define SCAN_TIME_SECONDS 10

// BLE UUIDs
#define DEVICE_COUNT 2
// #define DEVICE_COUNT 1

const char my_ssl_ca_cert[] PROGMEM = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIDcTCCAlmgAwIBAgIUU06jlgs0DKseZ2yhBaAiblofkKUwDQYJKoZIhvcNAQEL\n" \
"BQAwSDELMAkGA1UEBhMCRVQxFDASBgNVBAgMC0FERElTLUFCQUJBMRQwEgYDVQQH\n" \
"DAtBRERJUy1BQkFCQTENMAsGA1UECgwERUhNUzAeFw0yNTA4MDQwMjA3MjFaFw0y\n" \
"NjA4MDQwMjA3MjFaMEgxCzAJBgNVBAYTAkVUMRQwEgYDVQQIDAtBRERJUy1BQkFC\n" \
"QTEUMBIGA1UEBwwLQURESVMtQUJBQkExDTALBgNVBAoMBEVITVMwggEiMA0GCSqG\n" \
"SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC8VGTU7BAEE3sOC1e+7wbDzOXg5OdbLreY\n" \
"7GOPXajmAz3neT5UMcRvUL49K7l5Lgtdo57gF55b6MBR/zWYXR2iRBlT7RxEio0K\n" \
"fIg+S7ks9fTMeI+CHHILGWXWfmr5TL/hg/+6W4iEoJhC6F2wQMV7RtlL7u8d7EAR\n" \
"mNKClrE2jgajciWvmYSwQKPYVH3EyX429ob+/T3uElSfVZbxSOKz1pMiU2jAQR3w\n" \
"OZHRHIMLsaGyDb2Q3aSM/uVAvKBetZ4E9jkUzFe7oGWNpQLkRW2qRqbiVugbSsOp\n" \
"QqCwo5+PkUfqrnGi183FWY9zoMQXF/jfzcYcUVyZj60jj9agJu0fAgMBAAGjUzBR\n" \
"MB0GA1UdDgQWBBQygSKnHUJGKWR9Jr5P7ZevpseXljAfBgNVHSMEGDAWgBQygSKn\n" \
"HUJGKWR9Jr5P7ZevpseXljAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUA\n" \
"A4IBAQBDSFiFMpBrfh2U/iJZP8mqFWr59FQ1t8AXbCwYJcYDD4UVia9Be+UNDdh7\n" \
"d0Og0sMSAfNW6vXP4s2ud9QyAaDK/F5hL2BvulujTnvpxLqC4IBgBCHJwA2BFHzY\n" \
"TAgHn+dTePVsvHVLdeuPZhGa6SGL3Ri8HcZx4ceLqAtlxLLtGLHZyLawhKrcmWEa\n" \
"VbFCPCEkyqlGT4ObaFS1c+ZBcqzblYJkN6cc8IhQkdheN/NuJtXo4zVP0xO636mG\n" \
"W+kDRnd0K892Bbpej6AZjd+U5qv5l4KgdABQZ+cXmxs7wEJqIUBpZJTtj24juHjP\n" \
"X/qCK+ZmFhOUVc+O/jlBRwultISr\n" \
"-----END CERTIFICATE-----\n";


// Global variables1
//wifi and websocket server setup
const char* ssid     = "Vamos";
const char* password = "987654321";
char path[] = "/update/temp/";
const char* websocketPath = "ws://10.250.145.204:8000/update/temp/"; //Enter server adress
char host[] = "10.250.145.203";
uint16_t port = 8000;

//NTP server setup
const char* ntpServer1 = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

const char* time_zone = "CET-1CEST,M3.5.0,M10.5.0/3";  // TimeZone rule for Europe/Rome including daylight adjustment rules (optional)
//const char* tme_zone="EAT-3";
const char* SERVICE_UUIDS[DEVICE_COUNT] = {
  "00001809-0000-1000-8000-00805f9b34fb", //temp
  "0000180d-0000-1000-8000-00805f9b34fb", //heart rate
};
const char* NOTIFY_CHARACTERISTIC_UUIDS[DEVICE_COUNT] = {
  "00002a1c-0000-1000-8000-00805f9b34fb", //temp
  "00002a37-0000-1000-8000-00805f9b34fb", //heart rate
};
const char* READ_CHARACTERISTIC_UUIDS[DEVICE_COUNT] = {
  "00002a37-0000-1000-8000-00805f9b34fb",
  "00002a1c-0000-1000-8000-00805f9b34fb",
};

bool deviceFound[DEVICE_COUNT] = { false };
BLEAdvertisedDevice* advertisedDevices[DEVICE_COUNT];
BLEClient* pClients[DEVICE_COUNT];
BLERemoteCharacteristic* pNotifyCharacteristics[DEVICE_COUNT];
BLERemoteCharacteristic* pReadCharacteristics[DEVICE_COUNT];

using namespace websockets;

WebsocketsClient websocketClient;
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
  if (client.connected() && websocketClient.send(data))
    Serial.println("data sent");
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
    return;
  }

  // Handshake with the server
  // webSocketClient.path = path;
  // webSocketClient.host = host;
  // websocketClient.setCACert(my_ssl_ca_cert);
  websocketClient.setInsecure();
  if (websocketClient.connect(websocketPath)) {
    Serial.println("Handshake successful");
  } else {
    Serial.println("Handshake failed.");
  }
}

void onEventsCallback(WebsocketsEvent event, String data) {
    if(event == WebsocketsEvent::ConnectionOpened) {
        Serial.println("Connnection Opened");
    } else if(event == WebsocketsEvent::ConnectionClosed) {
        Serial.println("Connnection Closed");
    } else if(event == WebsocketsEvent::GotPing) {
        Serial.println("Got a Ping!");
    } else if(event == WebsocketsEvent::GotPong) {
        Serial.println("Got a Pong!");
    }
}

// Static context provider: returns ESP32 device ID
std::string getStaticContext() {
    uint64_t chipid = ESP.getEfuseMac(); // unique chip ID
    char idStr[20];
    sprintf(idStr, "%04X", (uint16_t)(chipid >> 32));
    return std::string(idStr);
}

// Dynamic context provider
std::string getDynamicContext(uint8_t deviceIndex, uint8_t* pData, size_t length) {
  if (deviceIndex == 0) {
    uint32_t data = pData[3];
    data = data << 16;
    data += pData[2];
    data = data << 8;
    data += pData[1];

    float temp = static_cast<float>(data);
    int expo = static_cast<int>(pData[4]) - 256;
    temp = temp * pow(10, expo);

    Serial.println(temp);
    tempData = std::to_string(temp);
    return tempData;
  } else {
    Serial.println(pData[1]);
    heartrateData = std::to_string(pData[1]);
    return "";
  }
}

// Context parser
std::string contextParser(const std::string& tempData, const std::string& deviceId) {
  if (tempData.empty() || heartrateData.empty()) return "";

  std::string json = "{";
  json += "\"device_id\": \"" + deviceId + "\", ";
  json += "\"heartrate\": \"" + heartrateData + "\", ";
  json += "\"tempdata\": " + tempData + ", ";
  json += "\"localtime\": \"" + LocalTime() + "\"";
  json += "}";
  return json;
}


// Callback functions for each device's notify characteristic
void deviceNotifyCallback(uint8_t deviceIndex, BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
  Serial.print("Notification received from Device ");
  Serial.print(deviceIndex);
  Serial.print(": ");
 std::string dynamic = getDynamicContext(deviceIndex, pData, length);

  // Only combine when we have all needed values
  if (deviceIndex == 0 && !heartrateData.empty()) {
    std::string deviceId = getStaticContext();
    std::string jsonPayload = contextParser(dynamic, deviceId);
    if (!jsonPayload.empty()) {
      serverUpdate(jsonPayload.c_str());
    }
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
  // pReadCharacteristics[deviceIndex] = pRemoteService->getCharacteristic(BLEUUID(READ_CHARACTERISTIC_UUIDS[deviceIndex]));

  if (pNotifyCharacteristics[deviceIndex] == nullptr){ //|| pReadCharacteristics[deviceIndex] == nullptr) {
    Serial.println("Failed to find characteristics.");
    pClients[deviceIndex]->disconnect();
    return false;
  }

  pNotifyCharacteristics[deviceIndex]->registerForNotify(std::bind(deviceNotifyCallback, deviceIndex, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3, std::placeholders::_4));
  // pReadCharacteristics[deviceIndex]->registerForNotify(std::bind(deviceReadCallback, deviceIndex, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3));

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
