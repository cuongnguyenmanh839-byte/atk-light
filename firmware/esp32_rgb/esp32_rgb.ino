#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <WiFiManager.h>
#include <Adafruit_NeoPixel.h>
#include <Preferences.h>

/*
 * ==============================================================================
 * ĐỒ ÁN TỐT NGHIỆP: ĐIỀU KHIỂN RGB QUA ESP32 (WIFIMANAGER + ĐA CẢM BIẾN + 12 HIỆU ỨNG)
 * HỆ THỐNG ATK LIGHT - TRẠM 2: LED NGHỆ THUẬT & ÂM THANH
 * ==============================================================================
 * - Chân LED WS2812B (DIN): GPIO 4 (Điều khiển số 100%, KHÔNG DÙNG RELAY)
 * - Cảm biến Ánh Sáng (DO): GPIO 18 (Module Quang Trở LM393)
 * - Cảm biến Âm Thanh (DO): GPIO 19 (Module Microphone LM393)
 * - Kết nối mạng: WiFiManager tự động bắt WiFi mọi lúc mọi nơi
 * - Tên miền cục bộ: http://den-rgb.local
 * - IP dự phòng cố định: http://192.168.4.1 (Chạy song song AP_STA)
 * - Hỗ trợ đến 600 bóng LED, 12 hiệu ứng màu sắc động cực đẹp + 16 màu tĩnh
 * ==============================================================================
 */

// ======================= CẤU HÌNH PHẦN CỨNG =======================
#define LED_PIN           4     // GPIO 4 nối chân DIN của dải LED WS2812B
#define LIGHT_SENSOR_PIN  18    // GPIO 18 nối chân DO cảm biến ánh sáng
#define SOUND_SENSOR_PIN  19    // GPIO 19 nối chân DO cảm biến âm thanh

#define MAX_LEDS          600   // Hỗ trợ tối đa 600 bóng LED

// ======================= CẤU HÌNH KẾT NỐI WI-FI =======================
#define WIFI_SSID         "ESP-TEST"  // Tên Wi-Fi / Hotspot phát ra
#define WIFI_PASSWORD     "88888888"  // Mật khẩu Wi-Fi

// Khởi tạo các đối tượng
Adafruit_NeoPixel led(MAX_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
WebServer server(80);
Preferences pref;

// ======================= CÁC CHẾ ĐỘ HOẠT ĐỘNG =======================
enum LedMode { 
  MODE_SOLID,        // Màu tĩnh
  MODE_AUTO_LIGHT,   // Chuyên Cảm Biến Ánh Sáng (Tối bật, Sáng tắt)
  MODE_SOUND,        // Chuyên Cảm Biến Âm Thanh (Có tiếng ồn bật 5s, Yên tĩnh tắt)
  MODE_SMART_COMBO,  // Kết Hợp: Đêm tối + Có tiếng ồn mới bật
  MODE_RAINBOW,      // 1. Cầu vồng cuộn mượt
  MODE_CHASE,        // 2. Sao băng đuôi sáng
  MODE_FIRE,         // 3. Ngọn lửa bập bùng
  MODE_OCEAN,        // 4. Sóng biển đại dương
  MODE_AURORA,       // 5. Cực quang huyền ảo
  MODE_BREATHE,      // 6. Nhịp thở thư giãn
  MODE_RANDOM,       // 7. Đom đóm ngân hà
  MODE_SCANNER,      // 8. Quét laser mắt thần
  MODE_THEATER,      // 9. Sân khấu rạp hát
  MODE_WIPE,         // 10. Thác màu nối tiếp
  MODE_STROBE,       // 11. Chớp vũ trường disco
  MODE_EQUALIZER,    // 12. Sóng nhạc lan tỏa từ tâm
  MODE_OFF           // Tắt dải LED
};

LedMode currentMode = MODE_AUTO_LIGHT;

// Cấu hình LED
int numLeds = 120;                                     // Số bóng LED thực tế
uint8_t currentR = 255, currentG = 130, currentB = 10; // Màu mặc định
uint8_t currentBrightness = 180;
int effectSpeedLevel = 3;                              // Tốc độ: 1 (rất chậm) -> 5 (cực nhanh)

// Trạng thái hiển thị dải LED (tránh gọi led.show() liên tục làm nghẽn CPU)
bool stripIsOn = false;
uint32_t lastAppliedColor = 0;

// Logic cảm biến (Có thể đảo chiều ngay trên Web App)
bool lightActiveLow = true;   // true: Đọc được LOW (0) là Trời Tối
bool soundActiveLow = true;   // true: Đọc được LOW (0) là Có Âm Thanh

int rawLightVal = 1;
int rawSoundVal = 1;
bool isDarkDetected = false;
bool isSoundDetected = false;

// Thời gian duy trì sáng khi có tiếng ồn
unsigned long soundTriggerTimestamp = 0;
const unsigned long SOUND_HOLD_TIME = 5000; // 5 giây

// Quản lý thời gian thực
int currentHour = 18;
int currentMinute = 0;
int currentSecond = 0;
unsigned long lastTimeTick = 0;

// Cài đặt Hẹn Giờ (Schedule)
bool scheduleEnabled = false;
int onHour = 18, onMinute = 0;
int offHour = 23, offMinute = 30;
int countdownSeconds = 0;

// Biến hiệu ứng động
uint16_t animHue = 0;
int animStep = 0;
bool animDirection = true;
unsigned long lastEffectTime = 0;

// ======================= HÀM XỬ LÝ DẢI LED =======================
void updateStripColor(uint32_t color) {
  for (int i = 0; i < numLeds; i++) {
    led.setPixelColor(i, color);
  }
  for (int i = numLeds; i < MAX_LEDS; i++) {
    led.setPixelColor(i, 0);
  }
  led.show();
  stripIsOn = (color != 0);
  lastAppliedColor = color;
}

void turnOffStrip() {
  if (stripIsOn) {
    led.clear();
    led.show();
    stripIsOn = false;
    lastAppliedColor = 0;
  }
}

// Lấy độ trễ khung hình dựa trên mức tốc độ (1..5)
int getSpeedDelay(int baseDelay) {
  switch(effectSpeedLevel) {
    case 1: return (int)(baseDelay * 2.2);
    case 2: return (int)(baseDelay * 1.5);
    case 3: return baseDelay;
    case 4: { int d = (int)(baseDelay * 0.65); return (d < 8) ? 8 : d; }
    case 5: { int d = (int)(baseDelay * 0.35); return (d < 5) ? 5 : d; }
    default: return baseDelay;
  }
}

// Hàm gửi phản hồi có header CORS
void sendCorsResponse(int code, const String& type, const String& content) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(code, type, content);
}

// ======================= XỬ LÝ HTTP REQUEST =======================
void handleOptions() {
  sendCorsResponse(204, "text/plain", "");
}

void handleRoot() {
  sendCorsResponse(200, "text/html", "<h2>ATK LIGHT - TRAM 2: ESP32 RGB WS2812B & DA CAM BIEN</h2><p>Truy cap giao dien Web tren may chu hoac <a href='/status'>/status</a></p>");
}

void handleSetColor() {
  if (server.hasArg("r") && server.hasArg("g") && server.hasArg("b")) {
    currentR = server.arg("r").toInt();
    currentG = server.arg("g").toInt();
    currentB = server.arg("b").toInt();
    currentMode = MODE_SOLID;
    updateStripColor(led.Color(currentR, currentG, currentB));
    sendCorsResponse(200, "text/plain", "OK");
  } else {
    sendCorsResponse(400, "text/plain", "Thieu tham so");
  }
}

void handleBrightness() {
  if (server.hasArg("val")) {
    currentBrightness = server.arg("val").toInt();
    led.setBrightness(currentBrightness);
    led.show();
    sendCorsResponse(200, "text/plain", "OK");
  } else {
    sendCorsResponse(400, "text/plain", "Thieu tham so");
  }
}

void handleSpeed() {
  if (server.hasArg("val")) {
    effectSpeedLevel = server.arg("val").toInt();
    if (effectSpeedLevel < 1) effectSpeedLevel = 1;
    if (effectSpeedLevel > 5) effectSpeedLevel = 5;
    sendCorsResponse(200, "text/plain", "OK");
  } else {
    sendCorsResponse(400, "text/plain", "Thieu tham so");
  }
}

void handleMode() {
  if (server.hasArg("val")) {
    String m = server.arg("val");
    if (m == "auto_light")   currentMode = MODE_AUTO_LIGHT;
    else if (m == "sound") {
      currentMode = MODE_SOUND;
      soundTriggerTimestamp = 0;
    }
    else if (m == "smart_combo") {
      currentMode = MODE_SMART_COMBO;
      soundTriggerTimestamp = 0;
    }
    else if (m == "rainbow")   currentMode = MODE_RAINBOW;
    else if (m == "chase")     currentMode = MODE_CHASE;
    else if (m == "fire")      currentMode = MODE_FIRE;
    else if (m == "ocean")     currentMode = MODE_OCEAN;
    else if (m == "aurora")    currentMode = MODE_AURORA;
    else if (m == "breathe")   currentMode = MODE_BREATHE;
    else if (m == "random")    currentMode = MODE_RANDOM;
    else if (m == "scanner")   currentMode = MODE_SCANNER;
    else if (m == "theater")   currentMode = MODE_THEATER;
    else if (m == "wipe")      currentMode = MODE_WIPE;
    else if (m == "strobe")    currentMode = MODE_STROBE;
    else if (m == "equalizer") currentMode = MODE_EQUALIZER;
    else if (m == "solid") {
      currentMode = MODE_SOLID;
      updateStripColor(led.Color(currentR, currentG, currentB));
    }
    else if (m == "off") {
      currentMode = MODE_OFF;
      turnOffStrip();
    }
    sendCorsResponse(200, "text/plain", "OK");
  } else {
    sendCorsResponse(400, "text/plain", "Thieu tham so");
  }
}

void handleSetLeds() {
  if (server.hasArg("count")) {
    int c = server.arg("count").toInt();
    if (c > 0 && c <= MAX_LEDS) {
      numLeds = c;
      pref.putInt("numLeds", numLeds);
      turnOffStrip();
      if (currentMode == MODE_SOLID) {
        updateStripColor(led.Color(currentR, currentG, currentB));
      }
      sendCorsResponse(200, "text/plain", "OK");
      return;
    }
  }
  sendCorsResponse(400, "text/plain", "Sai so luong");
}

void handleInvert() {
  if (server.hasArg("type")) {
    String t = server.arg("type");
    if (t == "light") {
      lightActiveLow = !lightActiveLow;
      pref.putBool("lActLow", lightActiveLow);
    } else if (t == "sound") {
      soundActiveLow = !soundActiveLow;
      pref.putBool("sActLow", soundActiveLow);
    }
    sendCorsResponse(200, "text/plain", "OK");
    return;
  }
  sendCorsResponse(400, "text/plain", "Thieu tham so");
}

void handleResetWifi() {
  sendCorsResponse(200, "text/plain", "OK");
  delay(500);
  WiFiManager wm;
  wm.resetSettings();
  ESP.restart();
}

void handleSyncTime() {
  if (server.hasArg("h") && server.hasArg("m")) {
    currentHour = server.arg("h").toInt();
    currentMinute = server.arg("m").toInt();
    if (server.hasArg("s")) currentSecond = server.arg("s").toInt();
    lastTimeTick = millis();
    sendCorsResponse(200, "text/plain", "OK");
    return;
  }
  sendCorsResponse(400, "text/plain", "Sai gio");
}

void handleSchedule() {
  if (server.hasArg("en") && server.hasArg("onH") && server.hasArg("offH")) {
    scheduleEnabled = (server.arg("en").toInt() == 1);
    onHour = server.arg("onH").toInt();
    onMinute = server.arg("onM").toInt();
    offHour = server.arg("offH").toInt();
    offMinute = server.arg("offM").toInt();

    pref.putBool("schEn", scheduleEnabled);
    pref.putInt("onH", onHour);
    pref.putInt("onM", onMinute);
    pref.putInt("offH", offHour);
    pref.putInt("offM", offMinute);

    sendCorsResponse(200, "text/plain", "OK");
    return;
  }
  sendCorsResponse(400, "text/plain", "Thieu tham so");
}

void handleTimer() {
  if (server.hasArg("min")) {
    int m = server.arg("min").toInt();
    countdownSeconds = m * 60;
    sendCorsResponse(200, "text/plain", "OK");
    return;
  }
  sendCorsResponse(400, "text/plain", "Thieu tham so");
}

void handleStatus() {
  String modeStr = "auto_light";
  switch (currentMode) {
    case MODE_AUTO_LIGHT:  modeStr = "auto_light"; break;
    case MODE_SOUND:       modeStr = "sound"; break;
    case MODE_SMART_COMBO: modeStr = "smart_combo"; break;
    case MODE_RAINBOW:     modeStr = "rainbow"; break;
    case MODE_CHASE:       modeStr = "chase"; break;
    case MODE_FIRE:        modeStr = "fire"; break;
    case MODE_OCEAN:       modeStr = "ocean"; break;
    case MODE_AURORA:      modeStr = "aurora"; break;
    case MODE_BREATHE:     modeStr = "breathe"; break;
    case MODE_RANDOM:      modeStr = "random"; break;
    case MODE_SCANNER:     modeStr = "scanner"; break;
    case MODE_THEATER:     modeStr = "theater"; break;
    case MODE_WIPE:        modeStr = "wipe"; break;
    case MODE_STROBE:      modeStr = "strobe"; break;
    case MODE_EQUALIZER:   modeStr = "equalizer"; break;
    case MODE_SOLID:       modeStr = "solid"; break;
    case MODE_OFF:         modeStr = "off"; break;
  }

  String json = "{";
  json += "\"device\":\"ATK-ESP32-RGB-WS2812B\",";
  json += "\"mode\":\"" + modeStr + "\",";
  json += "\"numLeds\":" + String(numLeds) + ",";
  json += "\"r\":" + String(currentR) + ",";
  json += "\"g\":" + String(currentG) + ",";
  json += "\"b\":" + String(currentB) + ",";
  json += "\"bri\":" + String(currentBrightness) + ",";
  json += "\"speed\":" + String(effectSpeedLevel) + ",";
  json += "\"rawLight\":" + String(rawLightVal) + ",";
  json += "\"rawSound\":" + String(rawSoundVal) + ",";
  json += "\"isDark\":" + String(isDarkDetected ? "true" : "false") + ",";
  json += "\"soundDetected\":" + String(isSoundDetected ? "true" : "false") + ",";
  json += "\"lightActLow\":" + String(lightActiveLow ? "true" : "false") + ",";
  json += "\"soundActLow\":" + String(soundActiveLow ? "true" : "false") + ",";
  json += "\"hour\":" + String(currentHour) + ",";
  json += "\"min\":" + String(currentMinute) + ",";
  json += "\"sec\":" + String(currentSecond) + ",";
  json += "\"schedEn\":" + String(scheduleEnabled ? "true" : "false") + ",";
  json += "\"countdown\":" + String(countdownSeconds) + ",";
  json += "\"wifiSsid\":\"" + String(WiFi.status() == WL_CONNECTED ? "Da ket noi" : "Chua ket noi") + "\",";
  json += "\"wifiIp\":\"" + String(WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "192.168.4.1") + "\"";
  json += "}";

  sendCorsResponse(200, "application/json", json);
}

// ======================= HÀM SETUP =======================
void setup() {
  Serial.begin(115200);
  delay(500);

  // Khôi phục cài đặt từ bộ nhớ Flash
  pref.begin("vip_cfg", false);
  numLeds = pref.getInt("numLeds", 120);
  if (numLeds <= 0 || numLeds > MAX_LEDS) numLeds = 120;
  lightActiveLow = pref.getBool("lActLow", true);
  soundActiveLow = pref.getBool("sActLow", true);
  scheduleEnabled = pref.getBool("schEn", false);
  onHour = pref.getInt("onH", 18);
  onMinute = pref.getInt("onM", 0);
  offHour = pref.getInt("offH", 23);
  offMinute = pref.getInt("offM", 30);

  // Cấu hình chân cảm biến
  pinMode(LIGHT_SENSOR_PIN, INPUT_PULLUP);
  pinMode(SOUND_SENSOR_PIN, INPUT_PULLUP);

  // Khởi tạo LED NeoPixel
  led.begin();
  led.setBrightness(currentBrightness);
  turnOffStrip();

  Serial.println("\n=======================================================");
  Serial.println("  ATK LIGHT - TRAM 2: DIEU KHIEN RGB QUA ESP32");
  Serial.println("=======================================================");

  WiFi.mode(WIFI_AP_STA);

  IPAddress apIP(192, 168, 4, 1);
  IPAddress apGateway(192, 168, 4, 1);
  IPAddress apSubnet(255, 255, 255, 0);
  WiFi.softAPConfig(apIP, apGateway, apSubnet);
  WiFi.softAP("ESP-RGB-FIXED", "12345678");

  WiFi.begin("ESP-TEST", "88888888");

  unsigned long startT = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startT < 6000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("-> DA KET NOI VAO WIFI THANH CONG!");
    Serial.print("   IP: http://");
    Serial.println(WiFi.localIP());
  }

  // Khởi tạo mDNS tên miền: http://den-rgb.local
  if (MDNS.begin("den-rgb")) {
    Serial.println("-> mDNS: http://den-rgb.local");
  }

  // Đăng ký Web Router
  server.on("/", HTTP_OPTIONS, handleOptions);
  server.on("/set", HTTP_OPTIONS, handleOptions);
  server.on("/bri", HTTP_OPTIONS, handleOptions);
  server.on("/speed", HTTP_OPTIONS, handleOptions);
  server.on("/mode", HTTP_OPTIONS, handleOptions);
  server.on("/leds", HTTP_OPTIONS, handleOptions);
  server.on("/invert", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_OPTIONS, handleOptions);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/set", HTTP_GET, handleSetColor);
  server.on("/bri", HTTP_GET, handleBrightness);
  server.on("/speed", HTTP_GET, handleSpeed);
  server.on("/mode", HTTP_GET, handleMode);
  server.on("/leds", HTTP_GET, handleSetLeds);
  server.on("/invert", HTTP_GET, handleInvert);
  server.on("/resetwifi", HTTP_GET, handleResetWifi);
  server.on("/settime", HTTP_GET, handleSyncTime);
  server.on("/sched", HTTP_GET, handleSchedule);
  server.on("/timer", HTTP_GET, handleTimer);
  server.on("/status", HTTP_GET, handleStatus);

  server.begin();
  Serial.println("-> Web Server ESP32 RGB da san sang!");
}

// ======================= VÒNG LẶP CHÍNH =======================
void loop() {
  server.handleClient();

  unsigned long now = millis();

  // 1. CẬP NHẬT ĐỒNG HỒ & BỘ ĐẾM THỜI GIAN
  if (now - lastTimeTick >= 1000) {
    lastTimeTick = now;
    currentSecond++;
    if (currentSecond >= 60) {
      currentSecond = 0;
      currentMinute++;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour = (currentHour + 1) % 24;
      }
    }

    // Sleep Timer
    if (countdownSeconds > 0) {
      countdownSeconds--;
      if (countdownSeconds == 0) {
        currentMode = MODE_OFF;
        turnOffStrip();
      }
    }

    // Lịch Hẹn Giờ
    if (scheduleEnabled) {
      if (currentHour == onHour && currentMinute == onMinute && currentSecond == 0) {
        currentMode = MODE_AUTO_LIGHT;
      }
      if (currentHour == offHour && currentMinute == offMinute && currentSecond == 0) {
        currentMode = MODE_OFF;
        turnOffStrip();
      }
    }
  }

  // 2. ĐỌC TÍN HIỆU CẢM BIẾN
  rawLightVal = digitalRead(LIGHT_SENSOR_PIN);
  rawSoundVal = digitalRead(SOUND_SENSOR_PIN);

  isDarkDetected = (lightActiveLow) ? (rawLightVal == LOW) : (rawLightVal == HIGH);
  bool soundInstantTrigger = (soundActiveLow) ? (rawSoundVal == LOW) : (rawSoundVal == HIGH);

  if (soundInstantTrigger) {
    soundTriggerTimestamp = now;
    isSoundDetected = true;
  } else {
    if (now - soundTriggerTimestamp > 300) {
      isSoundDetected = false;
    }
  }

  // 3. THỰC THI CÁC CHẾ ĐỘ ĐỘC LẬP
  switch (currentMode) {

    case MODE_AUTO_LIGHT:
      if (isDarkDetected) {
        uint32_t targetColor = led.Color(currentR, currentG, currentB);
        if (!stripIsOn || lastAppliedColor != targetColor) {
          updateStripColor(targetColor);
        }
      } else {
        turnOffStrip();
      }
      break;

    case MODE_SOUND:
      if (now - soundTriggerTimestamp <= SOUND_HOLD_TIME && soundTriggerTimestamp > 0) {
        uint32_t targetColor = led.Color(currentR, currentG, currentB);
        if (!stripIsOn || lastAppliedColor != targetColor) {
          updateStripColor(targetColor);
        }
      } else {
        turnOffStrip();
      }
      break;

    case MODE_SMART_COMBO:
      if (isDarkDetected) {
        if (now - soundTriggerTimestamp <= SOUND_HOLD_TIME && soundTriggerTimestamp > 0) {
          uint32_t targetColor = led.Color(currentR, currentG, currentB);
          if (!stripIsOn || lastAppliedColor != targetColor) {
            updateStripColor(targetColor);
          }
        } else {
          turnOffStrip();
        }
      } else {
        turnOffStrip();
      }
      break;

    case MODE_RAINBOW:
      if (now - lastEffectTime >= getSpeedDelay(20)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          uint16_t pixelHue = animHue + (i * 65536L / (numLeds > 0 ? numLeds : 1));
          led.setPixelColor(i, led.gamma32(led.ColorHSV(pixelHue)));
        }
        led.show();
        animHue += 450;
        stripIsOn = true;
      }
      break;

    case MODE_CHASE:
      if (now - lastEffectTime >= getSpeedDelay(30)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          uint32_t c = led.getPixelColor(i);
          uint8_t r = (uint8_t)(c >> 16);
          uint8_t g = (uint8_t)(c >> 8);
          uint8_t b = (uint8_t)c;
          led.setPixelColor(i, led.Color(r * 0.72, g * 0.72, b * 0.72));
        }
        led.setPixelColor(animStep, led.Color(currentR, currentG, currentB));
        led.show();
        animStep = (animStep + 1) % (numLeds > 0 ? numLeds : 1);
        stripIsOn = true;
      }
      break;

    case MODE_FIRE:
      if (now - lastEffectTime >= getSpeedDelay(40)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          int flicker = (int)random(0, 55);
          int r = 255 - flicker;
          if (r < 0) r = 0;
          int g = 100 - flicker - (int)random(0, 40);
          if (g < 0) g = 0;
          int b = 20 - flicker;
          if (b < 0) b = 0;
          led.setPixelColor(i, led.Color(r, g, b));
        }
        led.show();
        stripIsOn = true;
      }
      break;

    case MODE_OCEAN:
      if (now - lastEffectTime >= getSpeedDelay(35)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          float wave = sin((i * 0.15) + (animStep * 0.08));
          uint8_t b = 150 + (uint8_t)(wave * 90);
          uint8_t g = 40 + (uint8_t)(wave * 50);
          led.setPixelColor(i, led.Color(0, g, b));
        }
        led.show();
        animStep++;
        stripIsOn = true;
      }
      break;

    case MODE_AURORA:
      if (now - lastEffectTime >= getSpeedDelay(30)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          float wave = sin((i * 0.12) + (animStep * 0.06));
          uint8_t r = (uint8_t)((wave + 1.0) * 60);
          uint8_t g = (uint8_t)((sin((i * 0.08) - (animStep * 0.05)) + 1.0) * 110);
          uint8_t b = (uint8_t)((cos((i * 0.1) + (animStep * 0.07)) + 1.0) * 120);
          led.setPixelColor(i, led.Color(r, g, b));
        }
        led.show();
        animStep++;
        stripIsOn = true;
      }
      break;

    case MODE_BREATHE:
      if (now - lastEffectTime >= getSpeedDelay(18)) {
        lastEffectTime = now;
        static float angle = 0;
        angle += 0.05;
        if (angle > 6.28) angle = 0;
        float factor = (sin(angle) + 1.0) / 2.0;
        uint8_t r = currentR * factor;
        uint8_t g = currentG * factor;
        uint8_t b = currentB * factor;
        for (int i = 0; i < numLeds; i++) {
          led.setPixelColor(i, led.Color(r, g, b));
        }
        led.show();
        stripIsOn = true;
      }
      break;

    case MODE_RANDOM:
      if (now - lastEffectTime >= getSpeedDelay(60)) {
        lastEffectTime = now;
        int randIdx = random(0, numLeds);
        uint16_t randHue = random(0, 65535);
        led.setPixelColor(randIdx, led.gamma32(led.ColorHSV(randHue, 255, 255)));
        int fadeIdx = random(0, numLeds);
        uint32_t c = led.getPixelColor(fadeIdx);
        led.setPixelColor(fadeIdx, led.Color(((c>>16)&0xFF)*0.6, ((c>>8)&0xFF)*0.6, (c&0xFF)*0.6));
        led.show();
        stripIsOn = true;
      }
      break;

    case MODE_SCANNER:
      if (now - lastEffectTime >= getSpeedDelay(25)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          uint32_t c = led.getPixelColor(i);
          led.setPixelColor(i, led.Color(((c>>16)&0xFF)*0.65, ((c>>8)&0xFF)*0.65, (c&0xFF)*0.65));
        }
        led.setPixelColor(animStep, led.Color(currentR, currentG, currentB));
        led.show();
        if (animDirection) {
          animStep++;
          if (animStep >= numLeds - 1) animDirection = false;
        } else {
          animStep--;
          if (animStep <= 0) animDirection = true;
        }
        stripIsOn = true;
      }
      break;

    case MODE_THEATER:
      if (now - lastEffectTime >= getSpeedDelay(60)) {
        lastEffectTime = now;
        for (int i = 0; i < numLeds; i++) {
          if ((i + animStep) % 3 == 0) {
            led.setPixelColor(i, led.Color(currentR, currentG, currentB));
          } else {
            led.setPixelColor(i, 0);
          }
        }
        led.show();
        animStep = (animStep + 1) % 3;
        stripIsOn = true;
      }
      break;

    case MODE_WIPE:
      if (now - lastEffectTime >= getSpeedDelay(20)) {
        lastEffectTime = now;
        led.setPixelColor(animStep, led.gamma32(led.ColorHSV(animHue)));
        led.show();
        animStep++;
        if (animStep >= numLeds) {
          animStep = 0;
          animHue += 8000;
        }
        stripIsOn = true;
      }
      break;

    case MODE_STROBE:
      if (now - lastEffectTime >= getSpeedDelay(50)) {
        lastEffectTime = now;
        static bool strobeOn = false;
        strobeOn = !strobeOn;
        if (strobeOn) {
          uint16_t strobeHue = random(0, 65535);
          for (int i = 0; i < numLeds; i++) {
            led.setPixelColor(i, led.gamma32(led.ColorHSV(strobeHue, 255, 255)));
          }
        } else {
          for (int i = 0; i < numLeds; i++) led.setPixelColor(i, 0);
        }
        led.show();
        stripIsOn = true;
      }
      break;

    case MODE_EQUALIZER:
      if (now - lastEffectTime >= getSpeedDelay(30)) {
        lastEffectTime = now;
        int center = numLeds / 2;
        int radius = (animStep % (center > 0 ? center : 1));
        for (int i = 0; i < numLeds; i++) {
          int dist = abs(i - center);
          if (dist <= radius) {
            uint16_t eqHue = animHue + (dist * 400);
            led.setPixelColor(i, led.gamma32(led.ColorHSV(eqHue, 255, 255)));
          } else {
            led.setPixelColor(i, 0);
          }
        }
        led.show();
        animStep++;
        animHue += 300;
        stripIsOn = true;
      }
      break;

    case MODE_SOLID:
      // Giữ nguyên màu
      break;

    case MODE_OFF:
      turnOffStrip();
      break;
  }
}
