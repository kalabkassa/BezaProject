#include "BLEDevice.h"
#include <WiFi.h>
#include <WebSocketClient.h>

#include "time.h"
#include "sntp.h"

#define REV(x) ( ((x&0xff000000)>>24) | (((x&0x00ff0000)<<8)>>16) | (((x&0x0000ff00)>>8)<<16) | ((x&0x000000ff) << 24) )

typedef std::function<void(BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify)> notify_callback;

const char* ssid     = "mi";
const char* password = "pipipipi";
char path[] = "/update/temp/";
char host[] = "192.168.43.189";
uint16_t port = 8000;

WebSocketClient webSocketClient;

// Use WiFiClient class to create TCP connections
WiFiClient client;


// The remote service we wish to connect to.
static BLEUUID tempServiceUUID("00001809-0000-1000-8000-00805f9b34fb");
static BLEUUID heartrateServiceUUID("0000180d-0000-1000-8000-00805f9b34fb");
// The characteristic of the remote service we are interested in.
static BLEUUID tempCharUUID("00002a1c-0000-1000-8000-00805f9b34fb");
static BLEUUID heartrateCharUUID("00002a37-0000-1000-8000-00805f9b34fb");

static boolean doConnect = false;
static boolean connected = false;
static boolean doScan = false;
static BLERemoteCharacteristic* pRemoteCharacteristic;
static BLEAdvertisedDevice* tempDevice;
static BLEAdvertisedDevice* heartrateDevice;

std::string tempData;
std::string heartrateData;

const char* ntpServer1 = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

const char* time_zone = "CET-1CEST,M3.5.0,M10.5.0/3";  // TimeZone rule for Europe/Rome including daylight adjustment rules (optional)

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

static void nonninnotifyCallback(
  BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
  uint16_t data = pData[2] - 0xf0;
  data = data << 8;
  data += pData[1];
  Serial.print("SpO2: ");
  Serial.print(data/10);
  Serial.println(".00%");
  Serial.print("Heart Beat: ");
  Serial.print(pData[7]);
  Serial.println(" BPM");
  std::string str = std::to_string(data/10) + "," + std::to_string(pData[7]); 
}

static void tempNotifyCallback(
  BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
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
}
static void heartrateNotifyCallback(
  BLERemoteCharacteristic* pBLERemoteCharacteristic, uint8_t* pData, size_t length, bool isNotify) {
    Serial.println(pData[1]);
    heartrateData = std::to_string(pData[1]);
    std::string data = heartrateData + "," + tempData + "," + LocalTime();
    serverUpdate(data.c_str());
}

class MyClientCallback : public BLEClientCallbacks {
  void onConnect(BLEClient* pclient) {
  }

  void onDisconnect(BLEClient* pclient) {
    connected = false;
    Serial.println("onDisconnect");
  }
};

bool connectToServer(BLEAdvertisedDevice* device, BLEUUID serviceUUID, BLEUUID charUUID, notify_callback callback) {
    Serial.print("Forming a connection to ");
    Serial.println(device->getAddress().toString().c_str());

    BLEClient*  pClient  = BLEDevice::createClient();
    Serial.println(" - Created client");

    pClient->setClientCallbacks(new MyClientCallback());

    // Connect to the remove BLE Server.
    pClient->connect(device);  // if you pass BLEAdvertisedDevice instead of address, it will be recognized type of peer device address (public or private)
    Serial.println(" - Connected to server");
    pClient->setMTU(517); //set client to request maximum MTU from server (default is 23 otherwise)

    // Obtain a reference to the service we are after in the remote BLE server.
    BLERemoteService* pRemoteService = pClient->getService(serviceUUID);
    if (pRemoteService == nullptr) {
      Serial.print("Failed to find our service UUID: ");
      Serial.println(serviceUUID.toString().c_str());
      pClient->disconnect();
      return false;
    }
    Serial.println(" - Found our service");


    // Obtain a reference to the characteristic in the service of the remote BLE server.
    pRemoteCharacteristic = pRemoteService->getCharacteristic(charUUID);
    if (pRemoteCharacteristic == nullptr) {
      Serial.print("Failed to find our characteristic UUID: ");
      Serial.println(charUUID.toString().c_str());
      pClient->disconnect();
      return false;
    }
    Serial.println(" - Found our characteristic");

    // Read the value of the characteristic.
    if(pRemoteCharacteristic->canRead()) {
      std::string value = pRemoteCharacteristic->readValue();
      Serial.print("The characteristic value was: ");
      // Serial.println(value.c_str());
    }

    if(pRemoteCharacteristic->canNotify())
      pRemoteCharacteristic->registerForNotify(callback);

    connected = true;
    return true;
}
/**
 * Scan for BLE servers and find the first one that advertises the service we are looking for.
 */
class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
 /**
   * Called for each advertising BLE server.
   */
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    Serial.print("BLE Advertised Device found: ");
    Serial.println(advertisedDevice.toString().c_str());

    //We have found a device, let us now see if it contains the service we are looking for.
    if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(heartrateServiceUUID)) {
      // BLEDevice::getScan()->stop();
      heartrateDevice = new BLEAdvertisedDevice(advertisedDevice);
      

    } // Found our server
    else if (advertisedDevice.haveServiceUUID() && advertisedDevice.isAdvertisingService(tempServiceUUID)){
      // BLEDevice::getScan()->stop();
      tempDevice = new BLEAdvertisedDevice(advertisedDevice);
    }
  } // onResult
}; // MyAdvertisedDeviceCallbacks

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

void setup() {
  Serial.begin(115200);
   sntp_set_time_sync_notification_cb( timeavailable );

  /**
   * NTP server address could be aquired via DHCP,
   *
   * NOTE: This call should be made BEFORE esp32 aquires IP address via DHCP,
   * otherwise SNTP option 42 would be rejected by default.
   * NOTE: configTime() function call if made AFTER DHCP-client run
   * will OVERRIDE aquired NTP server address
   */
  sntp_servermode_dhcp(1);    // (optional)

  /**
   * This will set configured ntp servers and constant TimeZone/daylightOffset
   * should be OK if your time zone does not need to adjust daylightOffset twice a year,
   * in such a case time adjustment won't be handled automagicaly.
   */
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer1, ntpServer2);

  Serial.println("Starting Arduino BLE Client application...");
  BLEDevice::init("");

  // Retrieve a Scanner and set the callback we want to use to be informed when we
  // have detected a new device.  Specify that we want active scanning and start the
  // scan to run for 5 seconds.
  BLEScan* pTempBLEScan = BLEDevice::getScan();
  pTempBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pTempBLEScan->setInterval(1349);
  pTempBLEScan->setWindow(449);
  pTempBLEScan->setActiveScan(true);
  pTempBLEScan->start(5, false);


  j
} // End of setup.


// This is the Arduino main loop function.
void loop() {

  // If the flag "doConnect" is true then we have scanned for and found the desired
  // BLE Server with which we wish to connect.  Now we connect to it.  Once we are 
  // connected we set the connected flag to be true.
    // if (connectToServer()) {
    //   Serial.println("We are now connected to the BLE Server.");
    // }else {
    //   Serial.println("We have failed to connect to the server; there is nothin more we will do.");
    // }
    // doConnect = false;

  LocalTime();     // it will take some time to sync time :)

  BLEDevice::getScan()->stop();
  if(connectToServer(tempDevice, tempServiceUUID, tempCharUUID, tempNotifyCallback))
    connected = true;
  if(connectToServer(heartrateDevice, heartrateServiceUUID, heartrateCharUUID, heartrateNotifyCallback))
    connected = true;
  // If we are connected to a peer BLE Server, update the characteristic each time we are reached
  // with the current time since boot.
  if (connected) {
    String newValue = "Time since boot: " + String(millis()/1000);
    // Serial.println("Setting new characteristic value to \"" + newValue + "\"");
    
    // Set the characteristic's value to be the array of bytes that is actually a string.
    pRemoteCharacteristic->writeValue(newValue.c_str(), newValue.length());
  }else if(doScan){
    BLEDevice::getScan()->start(0);  // this is just example to start scan after disconnect, most likely there is better way to do it in arduino
  }
  delay(1000); // Delay a second between loops.
} // End of loop