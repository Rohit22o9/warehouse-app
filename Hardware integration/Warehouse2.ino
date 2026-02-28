#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ================= WIFI =================
#define WIFI_SSID "vivo T2x 5G"
#define WIFI_PASSWORD "234567890"

// ================= FIREBASE =================
#define API_KEY "AIzaSyCpBh1GMXQVLI-634MW2txQlyOogyxFLko"
#define DATABASE_URL "https://smart-warehouse-777c2-default-rtdb.asia-southeast1.firebasedatabase.app/"

// ===== DHT11 =====
#define DHTPIN 12
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ===== MQ2 =====
#define MQ2_PIN A0

// ===== LCD =====
LiquidCrystal_I2C lcd(0x3F,16,2);

// ===== FIREBASE =====
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;

// ===== THRESHOLDS =====
float TEMP_ALERT = 30;
float HUM_ALERT  = 40;
int SMOKE_ALERT  = 200;

void setup() {

  Serial.begin(115200);

  Wire.begin(4,2);   // SDA=GPIO4 SCL=GPIO2

  lcd.init();
  lcd.backlight();

  dht.begin();

  Serial.println("ESP RUNNING PERFECT");

  // ===== WIFI CONNECT =====
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected");

  // ===== FIREBASE =====
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase Ready");
}

void loop() {

  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  int smoke  = analogRead(MQ2_PIN);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT ERROR");
    return;
  }

  // ===== LCD DISPLAY =====
  lcd.setCursor(0,0);
  lcd.print("Temperature:");
  lcd.print(temp,1);
  lcd.print("C ");
  
  lcd.setCursor(0,1);
  lcd.print("Humidity:");
  lcd.print(hum,0);
  lcd.print("% ");

  // ===== ALERT LOGIC =====
  bool alert = false;

  if(temp > TEMP_ALERT) alert = true;
  if(hum > HUM_ALERT) alert = true;
  if(smoke > SMOKE_ALERT) alert = true;

  if(alert)
    Serial.println("⚠ ALERT CONDITION");
  else
    Serial.println("SAFE");

 if(Firebase.ready() && millis() - sendDataPrevMillis > 3000){

  sendDataPrevMillis = millis();

  Serial.println("Sending to Firebase...");

  if(Firebase.RTDB.setFloat(&fbdo, "/warehouse/temperature", temp))
      Serial.println("Temp sent OK");
  else
      Serial.println(fbdo.errorReason());

  if(Firebase.RTDB.setFloat(&fbdo, "/warehouse/humidity", hum))
      Serial.println("Humidity sent OK");
  else
      Serial.println(fbdo.errorReason());
}
  Serial.print("Temp: ");
  Serial.print(temp);
  Serial.print(" Hum: ");
  Serial.print(hum);
  Serial.print(" Smoke: ");
  Serial.println(smoke);

  delay(2000);
}