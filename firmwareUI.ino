#include "WiFi.h"
#include "ESPAsyncWebServer.h"
#include "SPIFFS.h"
#include "ArduinoJson.h"
#include "esp_attr.h"
#include "soc/timer_group_struct.h"
#include "soc/timer_group_reg.h"

#define pulseToL 0.0033
#define pulseToCuM 0.0000033

const char* APSSID = "Water Tracker";
const String RESIDENCE = "Landicho";
bool VALVE_STATUS = 0;

volatile long flowFreq = 0;
unsigned long lastFlowFreq = 0;
unsigned long lastMillis;
unsigned long boardTimeOffset=0;
float flowRate= 0;
unsigned long LIMIT=1000;
AsyncWebServer server(80);
bool LIMSTAT=true;
void IRAM_ATTR flowPulse(){
    flowFreq++;
}
void setup(){
  Serial.begin(115200);
  pinMode(21,INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(21),flowPulse,FALLING);
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
  pinMode(18,OUTPUT);
  WiFi.softAP(APSSID, "auth35223");
  Serial.println(WiFi.softAPIP());
  delay(300);
  server.on("/bg.jpg", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/bg.jpg", "image/jpg");
  });
  server.on("/refresh.png", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/refresh.png", "image/png");
  });
  server.on("/restart.png", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/restart.png", "image/png");
  });
  server.on("/check.png", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/check.png", "image/png");
  });
  server.on("/x.png", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/x.png", "image/png");
  });
  server.on("/jquery-3.4.1.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/jquery-3.4.1.js", "script/javascript");
  });
  server.on("/chart.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/chart.js", "script/javascript");
  });
  server.on("/script.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/script.js", "script/javascript");
  });
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/style.css", "text/css");
  });
  server.on("/Chart.min.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/Chart.min.js", "script/javascript");
  });
  server.on("/Lato-Regular.ttf", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/Lato-Regular.ttf", "font/ttf");
  });
  server.on("/Montserrat-Regular.ttf", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/Montserrat-Regular.ttf", "font/ttf");
  });
  server.on("/Oxygen-Bold.ttf", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/Oxygen-Bold.ttf", "font/ttf");
  });
  server.on("/favicon.ico", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/favicon.ico", "image/x-icon");
  });
  server.on("/updateOutput", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200,"text/plain",updateOutput().c_str());
  });
  server.on("/valveOn", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200,"text/plain",valveOn().c_str());
  });
  server.on("/valveOff", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200,"text/plain",valveOff().c_str());
  });
  server.on("/setLimit", HTTP_GET, [](AsyncWebServerRequest *request){
    LIMIT = request->getParam("LIM")->value().toInt()/pulseToL;
    Serial.print("Set limit to: ");
    Serial.println(LIMIT);
    request->send(200,"text/plain","SUCCESS");
  });
  server.on("/setLimStat", HTTP_GET, [](AsyncWebServerRequest *request){
    LIMSTAT = request->getParam("LIMSTAT")->value().toInt();
    Serial.print("Set limit status to: ");
    Serial.println(LIMSTAT);
    request->send(200,"text/plain","SUCCESS");
  });
  server.on("/restartBoard", HTTP_GET, [](AsyncWebServerRequest *request){
    ESP.restart();
  });
  
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html","text/html",false,processor);
  });
  // Start server
  server.begin();
  VALVE_STATUS = 1;
  digitalWrite(18, LOW);
}

bool first=false;
void loop(){
  if(flowFreq >= LIMIT &&LIMSTAT){
    VALVE_STATUS = 0;
    digitalWrite(18,HIGH);
  }
  if(millis()-lastMillis >= 5000){
    unsigned long currentFlowFreq = flowFreq-lastFlowFreq;
    lastFlowFreq = flowFreq;
    lastMillis = millis();
    flowRate = float((currentFlowFreq*pulseToL)/(5/60.0));
  }
  TIMERG0.wdt_wprotect=TIMG_WDT_WKEY_VALUE;
  TIMERG0.wdt_feed=1;
  TIMERG0.wdt_wprotect=0;
}
String readMillis() {
  return String(millis());
}

String processor(const String& var){
  if(var=="VALVE") return (VALVE_STATUS)?String("ON"):String("OFF");
  else if(var=="RESIDENCE") return String(RESIDENCE);
  else if(var=="IP") return WiFi.softAPIP().toString();
  else if(var=="SSID") return String(APSSID);
  else if(var=="RATE") return String(flowRate);
  else if(var=="FREQ") return String(flowFreq*pulseToL);
  else if(var=="LIMIT") return String(LIMIT*pulseToL);
  else return String();
}
String valveOn(){
  VALVE_STATUS=1;
  digitalWrite(18,LOW);
  return String("ON");
}
String valveOff(){
  VALVE_STATUS=0;
  digitalWrite(18,HIGH);
  return String("OFF");
}
String updateOutput(){ 
  DynamicJsonDocument doc(1024);
  JsonObject obj = doc.to<JsonObject>();
  String json;
  obj["MILLIS"] = readMillis();
  obj["VALVE"] = (VALVE_STATUS)?"ON":"OFF";
  obj["RESIDENCE"]= String(RESIDENCE);
  obj["IP"]= WiFi.softAPIP().toString();
  obj["SSID"]= String(APSSID);
  obj["RATE"] = String(flowRate);
  obj["FREQ"] = String(flowFreq*pulseToL);
  serializeJson(obj,json);
  return json;
  }
