#include <ESP8266WebServer.h>
#include <ESP8266HTTPClient.h>

const char* SSID = "********";
const char* PASSWORD = "********";

HTTPClient http;
ESP8266WebServer server(80);

const int relay = 0;

String getStatusJSON() {
  String json = "{ \"status\": 0, \"data\": { \"status\": ";
  json += digitalRead(relay);
  json += " } }";
  return json;
}

void connectWiFi(const char *ssid, const char *password) {
  WiFi.begin(ssid, password);
  Serial.printf("connecting to %s\n", SSID);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nconnected to %s\n", ssid);
  Serial.print("ip address is: ");
  Serial.println(WiFi.localIP());
}

void registerDevice() {
  http.begin("remote.hungtcs.top", 80, "/register?ipAddress=" + WiFi.localIP().toString() + "&macAddress="+ WiFi.macAddress() + "&type=esp01sRelay");
  int httpCode = http.GET();
  if(httpCode == HTTP_CODE_OK) {
    Serial.println("send ip address to master success");
  } else {
    Serial.printf("send ip address to master faild: %d\n", httpCode);
  }
  http.end();
}

void setup(void){
  Serial.begin(115200);

  pinMode(relay, OUTPUT);
  digitalWrite(relay, 1);

  WiFi.mode(WIFI_STA);
  connectWiFi(SSID, PASSWORD);
  registerDevice();

  server.on("/on", []() {
    digitalWrite(relay, LOW);
    server.send(200, "text/json", getStatusJSON());
  });

  server.on("/off", []() {
    digitalWrite(relay, HIGH);
    server.send(200, "text/json", getStatusJSON());
  });

  server.on("/status", []() {
    server.send(200, "text/json", getStatusJSON());
  });

  server.onNotFound([]() {
    server.send(404, "text/plain", "Not Found");
  });

  server.begin();
  Serial.println("HTTP server started");
}

void loop(void){
  while (WiFi.status() == WL_CONNECT_FAILED || WiFi.status() == WL_CONNECTION_LOST || WiFi.status() == WL_DISCONNECTED) {
    Serial.printf("reconnect to %s\n", SSID);
    connectWiFi(SSID, PASSWORD);
    registerDevice();
  }
  server.handleClient();
}
