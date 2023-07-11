#include <WiFi.h>
#include <WebSocketClient.h>

#include "time.h"
#include "sntp.h"

const char* ssid     = "KASA";
const char* password = "ks3510bn";
char path[] = "/update/temp/";
char host[] = "192.168.1.8";
uint16_t port = 8000;

const char* ntpServer1 = "pool.ntp.org";
const char* ntpServer2 = "time.nist.gov";
const long  gmtOffset_sec = 3600;
const int   daylightOffset_sec = 3600;

const char* time_zone = "CET-1CEST,M3.5.0,M10.5.0/3";  // TimeZone rule for Europe/Rome including daylight adjustment rules (optional)

WebSocketClient webSocketClient;

// Use WiFiClient class to create TCP connections
WiFiClient client;

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

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  wifi_setup();
  websocket_setup();
  sntp_set_time_sync_notification_cb( timeavailable );
  sntp_servermode_dhcp(1);    // (optional)
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer1, ntpServer2);

}

void loop() {
  // put your main code here, to run repeatedly:
  LocalTime();     // it will take some time to sync time :)
  std::string data = "57,38," + LocalTime();
  serverUpdate(data.c_str());
}
