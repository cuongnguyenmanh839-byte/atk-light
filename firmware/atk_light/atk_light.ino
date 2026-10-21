#include <Arduino.h>

// ============================================================================
// HỆ THỐNG CHIẾU SÁNG ATK ĐỊNH HÓA - THÁI NGUYÊN
// FIRMWARE ESP8266 / ESP32 ĐIỀU KHIỂN RELAY 4 KÊNH ĐỒNG BỘ WEB & ANDROID APK
// Hỗ trợ tự động:
// - Bo mạch ESP8266 (NodeMCU 1.0, WeMos D1, ESP-12E/F) qua LittleFS
// - Bo mạch ESP32 (Dev Module, WROOM) qua Preferences NVS
// ============================================================================

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
  #include <ESP8266mDNS.h>
  #include <LittleFS.h>
  #include <time.h>
  #include <sys/time.h>
  using WebServerType = ESP8266WebServer;
#else
  #include <WiFi.h>
  #include <WebServer.h>
  #include <ESPmDNS.h>
  #include <Preferences.h>
  #include <time.h>
  #include <sys/time.h>
  using WebServerType = WebServer;
#endif

#include <ArduinoJson.h>
#include "config.h"

WebServerType server(80);

#if !defined(ESP8266)
Preferences preferences;
#endif

// Danh mục 4 khu di tích
const char* AREA_IDS[] = {"khau-ty", "tin-keo", "memorial", "square"};
const char* AREA_NAMES[] = {"Đồi Khau Tý", "Lán Tỉn Keo", "Nhà tưởng niệm", "Quảng trường"};
const char* MODE_NAMES[] = {"Tham quan", "Lễ tưởng niệm", "An ninh", "Tiết kiệm"};
const unsigned MODE_BRIGHTNESS[] = {70, 50, 100, 35};
const unsigned MODE_TEMPERATURE[] = {4000, 3000, 6000, 3000};

// Trạng thái 4 kênh Relay
bool areaOn[4] = {false, false, false, false};
unsigned brightness = 70;
unsigned temperature = 4000;
unsigned lightingMode = 0;
bool hardwareReady = true;
bool schedulesEnabled = true;
bool autoLightEnabled = true;
int luxThreshold = DEFAULT_LUX_THRESHOLD;
int currentLux = 350;
bool isDark = false;
uint32_t lastSensorCheck = 0;
bool dirty = false;
uint32_t dirtyAt = 0;
uint32_t lastWifiAttempt = 0;
uint32_t lastMinute = 0;

String apiToken;
String apPassword;

struct ScheduleItem {
  String id;
  unsigned minute; // Phút trong ngày (0 - 1439)
  unsigned mode;   // 0: Tham quan, 1: Lễ tưởng niệm, 2: An ninh, 3: Tiết kiệm
  bool power;
};

ScheduleItem schedules[MAX_SCHEDULES];
unsigned scheduleCount = 0;

struct EventLog {
  String time;
  String title;
  String detail;
};

EventLog events[24];
unsigned eventCount = 0;

// ── Hỗ trợ thời gian tiếng Việt ──────────────────────────────────────────────
String timeText() {
  const time_t now = time(nullptr);
  if (now < 1704067200) return "--:--";
  tm local;
  localtime_r(&now, &local);
  char out[6];
  snprintf(out, sizeof(out), "%02d:%02d", local.tm_hour, local.tm_min);
  return String(out);
}

void addEvent(const String& title, const String& detail) {
  for (unsigned i = min(eventCount, 23U); i > 0; --i) {
    events[i] = events[i - 1];
  }
  events[0] = {timeText(), title, detail};
  eventCount = min(eventCount + 1, 24U);
}

void markDirty() {
  dirty = true;
  dirtyAt = millis();
}

// ── Áp dụng ngõ ra phần cứng Relay ──────────────────────────────────────────
void applyOutputs() {
  for (unsigned i = 0; i < 4; ++i) {
    const bool shouldBeOn = areaOn[i] && hardwareReady;
    // Xuất tín hiệu điều khiển relay
    if (RELAY_ACTIVE_LOW) {
      digitalWrite(RELAY_PINS[i], shouldBeOn ? LOW : HIGH);
    } else {
      digitalWrite(RELAY_PINS[i], shouldBeOn ? HIGH : LOW);
    }
  }
}

void setupOutputs() {
  for (unsigned i = 0; i < 4; ++i) {
    pinMode(RELAY_PINS[i], OUTPUT);
    // Khởi động an toàn: TẮT toàn bộ relay khi mới cắm nguồn
    digitalWrite(RELAY_PINS[i], RELAY_ACTIVE_LOW ? HIGH : LOW);
  }
  applyOutputs();
}

// ── Đọc cảm biến ánh sáng & Tự động bật/tắt theo môi trường ─────────────
int readAmbientLightLux() {
  int raw = analogRead(LIGHT_SENSOR_PIN);
  // ESP8266 ADC: 0-1023 (0V-1.0V)
  // Quy đổi về dải Lux 0 - 1000 Lux
  int lux = map(raw, 0, 1023, 0, 1000);
  if (lux < 0) lux = 0;
  if (lux > 1000) lux = 1000;
  return lux;
}

void checkAutoLightSensor() {
  if (millis() - lastSensorCheck < 3000) return;
  lastSensorCheck = millis();

  currentLux = readAmbientLightLux();
  const bool nowDark = (currentLux < luxThreshold);

  if (autoLightEnabled) {
    bool anyOn = areaOn[0] || areaOn[1] || areaOn[2] || areaOn[3];
    if (nowDark && !anyOn) {
      for (int i = 0; i < 4; ++i) areaOn[i] = true;
      applyOutputs();
      isDark = true;
      markDirty();
      addEvent("Cảm biến quang", "Trời tối (" + String(currentLux) + " Lux) - Tự động BẬT 4 khu");
    } else if (!nowDark && currentLux > (luxThreshold + 50) && anyOn) {
      for (int i = 0; i < 4; ++i) areaOn[i] = false;
      applyOutputs();
      isDark = false;
      markDirty();
      addEvent("Cảm biến quang", "Trời sáng (" + String(currentLux) + " Lux) - Tự động TẮT đèn");
    } else {
      isDark = nowDark;
    }
  } else {
    isDark = nowDark;
  }
}

// ── Xử lý CORS & Xác thực ──────────────────────────────────────────────────
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
  server.sendHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  server.sendHeader("Connection", "close");
}

void errorResponse(unsigned status, const char* message) {
  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  StaticJsonDocument<256> doc;
  #endif
  doc["error"] = message;
  doc["status"] = status;
  String body;
  serializeJson(doc, body);
  setCorsHeaders();
  server.send(status, "application/json; charset=utf-8", body);
}

bool isAuthorized() {
  // 1. Kiểm tra header Authorization: Bearer <token>
  const String authHeader = server.header("Authorization");
  if (authHeader.startsWith("Bearer ")) {
    const String token = authHeader.substring(7);
    if (token == apiToken || token == DEFAULT_API_TOKEN) return true;
  }

  // 2. Kiểm tra qua URL param ?token=<token>
  if (server.hasArg("token")) {
    const String token = server.arg("token");
    if (token == apiToken || token == DEFAULT_API_TOKEN) return true;
  }

  errorResponse(401, "Sai khóa API Token. Token mặc định: atk2026");
  return false;
}

#if ARDUINOJSON_VERSION_MAJOR >= 7
bool parseJsonBody(JsonDocument& doc) {
  if (server.arg("plain").length() > 4096) {
    errorResponse(413, "Nội dung quá lớn");
    return false;
  }
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err || !doc.is<JsonObject>()) {
    errorResponse(400, "Dữ liệu JSON không hợp lệ");
    return false;
  }
  return true;
}
#else
bool parseJsonBody(DynamicJsonDocument& doc) {
  if (server.arg("plain").length() > 4096) {
    errorResponse(413, "Nội dung quá lớn");
    return false;
  }
  DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err || !doc.is<JsonObject>()) {
    errorResponse(400, "Dữ liệu JSON không hợp lệ");
    return false;
  }
  return true;
}
#endif

// ── Trả về JSON State đồng bộ với Web & APK ────────────────────────────────
void sendState() {
  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(3072);
  #endif

  doc["apiVersion"] = 1;
  #if defined(ESP8266)
  doc["device"] = "ATK-ESP8266-Relay";
  #else
  doc["device"] = "ATK-ESP32-Relay";
  #endif
  doc["driver"] = "relay";
  doc["hardwareReady"] = hardwareReady;
  doc["brightness"] = brightness;
  doc["temperature"] = temperature;
  doc["mode"] = lightingMode;
  doc["uptimeSeconds"] = millis() / 1000;
  doc["timeSynced"] = time(nullptr) >= 1704067200;
  doc["schedulesEnabled"] = schedulesEnabled;
  doc["ip"] = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  doc["wifiConnected"] = (WiFi.status() == WL_CONNECTED);
  doc["energyKwh"] = nullptr;

  JsonObject cap = doc["capabilities"].to<JsonObject>();
  cap["brightness"] = false; // Module relay bật/tắt
  cap["temperature"] = false;
  cap["energy"] = false;

  JsonObject sensor = doc["lightSensor"].to<JsonObject>();
  sensor["lux"] = currentLux;
  sensor["isDark"] = isDark;
  sensor["autoEnabled"] = autoLightEnabled;
  sensor["threshold"] = luxThreshold;

  JsonArray areas = doc["areas"].to<JsonArray>();
  for (unsigned i = 0; i < 4; ++i) {
    JsonObject area = areas.add<JsonObject>();
    area["id"] = AREA_IDS[i];
    area["name"] = AREA_NAMES[i];
    area["on"] = areaOn[i];
    area["lamps"] = LAMP_COUNTS[i];
    area["lit"] = areaOn[i] ? LAMP_COUNTS[i] : 0;
  }

  JsonArray schedArray = doc["schedules"].to<JsonArray>();
  for (unsigned i = 0; i < scheduleCount; ++i) {
    JsonObject row = schedArray.add<JsonObject>();
    row["id"] = schedules[i].id;
    char clockText[6];
    snprintf(clockText, sizeof(clockText), "%02u:%02u", schedules[i].minute / 60, schedules[i].minute % 60);
    row["time"] = clockText;
    row["mode"] = MODE_NAMES[schedules[i].mode];
    row["power"] = schedules[i].power;
  }

  JsonArray logs = doc["alerts"].to<JsonArray>();
  for (unsigned i = 0; i < eventCount; ++i) {
    JsonObject event = logs.add<JsonObject>();
    event["time"] = events[i].time;
    event["title"] = events[i].title;
    event["detail"] = events[i].detail;
  }

  String body;
  serializeJson(doc, body);
  setCorsHeaders();
  server.send(200, "application/json; charset=utf-8", body);
}

// ── Xử lý lệnh điều khiển POST /api/control ─────────────────────────────────
void handleControl() {
  if (!isAuthorized()) return;

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(1024);
  #endif

  if (!parseJsonBody(doc)) return;

  // 1. Lệnh bật/tắt toàn bộ: {"systemOn": true/false}
  if (doc["systemOn"].is<bool>()) {
    const bool on = doc["systemOn"].as<bool>();
    for (bool& state : areaOn) state = on;
    applyOutputs();
    markDirty();
    addEvent(on ? "Đã bật toàn bộ đèn" : "Đã tắt toàn bộ đèn", "Điều khiển từ Web / APK");
    sendState();
    return;
  }

  // 2. Lệnh bật/tắt từng khu vực: {"area": {"id": "khau-ty", "on": true}}
  if (doc["area"].is<JsonObject>()) {
    const char* id = doc["area"]["id"] | "";
    if (doc["area"]["on"].is<bool>()) {
      const bool on = doc["area"]["on"].as<bool>();
      for (unsigned i = 0; i < 4; ++i) {
        if (String(id) == AREA_IDS[i]) {
          areaOn[i] = on;
          applyOutputs();
          markDirty();
          addEvent(String("Đã ") + (on ? "bật" : "tắt") + " " + AREA_NAMES[i], "Điều khiển phân khu");
          sendState();
          return;
        }
      }
    }
  }

  // 3. Lệnh đổi chế độ: {"mode": 0..3}
  if (doc["mode"].is<unsigned>()) {
    const unsigned m = doc["mode"].as<unsigned>();
    if (m < 4) {
      lightingMode = m;
      brightness = MODE_BRIGHTNESS[m];
      temperature = MODE_TEMPERATURE[m];
      markDirty();
      addEvent(String("Chế độ ") + MODE_NAMES[m], "Áp dụng chế độ chiếu sáng");
      sendState();
      return;
    }
  }

  // 4. Lệnh điều khiển cảm biến ánh sáng: {"autoLight": true/false, "luxThreshold": 150}
  bool handledAuto = false;
  if (doc["autoLight"].is<bool>()) {
    autoLightEnabled = doc["autoLight"].as<bool>();
    addEvent("Cảm biến quang", autoLightEnabled ? "Đã BẬT tự động theo ánh sáng" : "Đã TẮT tự động theo ánh sáng");
    handledAuto = true;
  }
  if (doc["luxThreshold"].is<int>()) {
    luxThreshold = doc["luxThreshold"].as<int>();
    handledAuto = true;
  }
  if (handledAuto) {
    markDirty();
    sendState();
    return;
  }

  errorResponse(400, "Lệnh điều khiển không hợp lệ");
}

// ── Cấu hình lịch tự động PUT /api/schedules ───────────────────────────────
void handleSchedules() {
  if (!isAuthorized()) return;

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(2048);
  #endif

  if (!parseJsonBody(doc)) return;

  if (doc["enabled"].is<bool>()) {
    schedulesEnabled = doc["enabled"].as<bool>();
  }

  if (doc["schedules"].is<JsonArray>()) {
    scheduleCount = 0;
    for (JsonObject row : doc["schedules"].as<JsonArray>()) {
      if (scheduleCount >= MAX_SCHEDULES) break;
      const char* id = row["id"] | "";
      const char* timeStr = row["time"] | "18:00";
      const char* modeStr = row["mode"] | "Tham quan";

      unsigned hour = 18, minute = 0;
      if (strlen(timeStr) >= 5) {
        hour = (timeStr[0] - '0') * 10 + (timeStr[1] - '0');
        minute = (timeStr[3] - '0') * 10 + (timeStr[4] - '0');
      }

      int modeIdx = 0;
      for (unsigned i = 0; i < 4; ++i) {
        if (String(modeStr) == MODE_NAMES[i]) modeIdx = i;
      }

      schedules[scheduleCount++] = {
        String(id),
        hour * 60 + minute,
        (unsigned)modeIdx,
        true
      };
    }
  }

  markDirty();
  addEvent("Đã cập nhật lịch hoạt động", "Lưu cấu hình thành công");
  sendState();
}

// ── Đồng bộ thời gian thực POST /api/time ──────────────────────────────────
void handleTimeSync() {
  if (!isAuthorized()) return;

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  StaticJsonDocument<256> doc;
  #endif

  if (!parseJsonBody(doc)) return;

  const uint32_t epoch = doc["epoch"] | 0U;
  if (epoch >= 1704067200) {
    timeval tv = {(time_t)epoch, 0};
    settimeofday(&tv, nullptr);
    addEvent("Đồng bộ thời gian thành công", timeText());
    sendState();
  } else {
    errorResponse(400, "Giá trị epoch không hợp lệ");
  }
}

// ── Lưu trữ cấu hình ────────────────────────────────────────────────────────
void saveSettings() {
  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(2048);
  #endif

  doc["brightness"] = brightness;
  doc["temperature"] = temperature;
  doc["mode"] = lightingMode;
  doc["schedulesEnabled"] = schedulesEnabled;

  JsonArray schedArr = doc["schedules"].to<JsonArray>();
  for (unsigned i = 0; i < scheduleCount; ++i) {
    JsonObject row = schedArr.add<JsonObject>();
    row["id"] = schedules[i].id;
    char clockText[6];
    snprintf(clockText, sizeof(clockText), "%02u:%02u", schedules[i].minute / 60, schedules[i].minute % 60);
    row["time"] = clockText;
    row["mode"] = MODE_NAMES[schedules[i].mode];
    row["power"] = schedules[i].power;
  }

  String data;
  serializeJson(doc, data);

  #if defined(ESP8266)
  File f = LittleFS.open("/settings.json", "w");
  if (f) {
    f.print(data);
    f.close();
  }
  #else
  preferences.putString("settings", data);
  #endif

  dirty = false;
}

void loadSettings() {
  String data = "";

  #if defined(ESP8266)
  if (LittleFS.exists("/settings.json")) {
    File f = LittleFS.open("/settings.json", "r");
    if (f) {
      data = f.readString();
      f.close();
    }
  }
  #else
  data = preferences.getString("settings", "");
  #endif

  if (data.length() == 0) return;

  #if ARDUINOJSON_VERSION_MAJOR >= 7
  JsonDocument doc;
  #else
  DynamicJsonDocument doc(2048);
  #endif

  if (deserializeJson(doc, data)) return;

  brightness = doc["brightness"] | 70U;
  temperature = doc["temperature"] | 4000U;
  lightingMode = doc["mode"] | 0U;
  schedulesEnabled = doc["schedulesEnabled"] | true;

  if (doc["schedules"].is<JsonArray>()) {
    scheduleCount = 0;
    for (JsonObject row : doc["schedules"].as<JsonArray>()) {
      if (scheduleCount >= MAX_SCHEDULES) break;
      const char* id = row["id"] | "";
      const char* timeStr = row["time"] | "18:00";
      const char* modeStr = row["mode"] | "Tham quan";

      unsigned hour = 18, minute = 0;
      if (strlen(timeStr) >= 5) {
        hour = (timeStr[0] - '0') * 10 + (timeStr[1] - '0');
        minute = (timeStr[3] - '0') * 10 + (timeStr[4] - '0');
      }

      int modeIdx = 0;
      for (unsigned i = 0; i < 4; ++i) {
        if (String(modeStr) == MODE_NAMES[i]) modeIdx = i;
      }

      schedules[scheduleCount++] = {
        String(id),
        hour * 60 + minute,
        (unsigned)modeIdx,
        true
      };
    }
  }
}

// ── Tự động chạy lịch cron ─────────────────────────────────────────────────
void runScheduler() {
  const time_t now = time(nullptr);
  if (!schedulesEnabled || !hardwareReady || now < 1704067200) return;

  tm local;
  localtime_r(&now, &local);
  const uint32_t currentMinuteKey = local.tm_hour * 60 + local.tm_min;

  if (currentMinuteKey == lastMinute) return;
  lastMinute = currentMinuteKey;

  for (unsigned i = 0; i < scheduleCount; ++i) {
    if (schedules[i].minute == currentMinuteKey) {
      lightingMode = schedules[i].mode;
      brightness = MODE_BRIGHTNESS[lightingMode];
      temperature = MODE_TEMPERATURE[lightingMode];
      for (bool& state : areaOn) state = true;
      applyOutputs();
      addEvent(String("Chạy lịch tự động: ") + MODE_NAMES[lightingMode], "Đã bật chiếu sáng theo lịch");
    }
  }
}

// ── Trang Web điều khiển tích hợp sẵn trong bo mạch ────────────────────────
void handleRoot() {
  setCorsHeaders();
  String html = "<!DOCTYPE html><html lang='vi'><head><meta charset='utf-8'>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  #if defined(ESP8266)
  html += "<title>ATK LIGHT ESP8266</title>";
  #else
  html += "<title>ATK LIGHT ESP32</title>";
  #endif
  html += "<style>body{background:#210a09;color:#ecd18a;font-family:sans-serif;padding:20px;text-align:center}";
  html += "h1{font-size:18px;color:#f3dd9b}p{font-size:13px;color:#b4a08c}";
  html += ".btn{display:block;width:100%;max-width:300px;margin:10px auto;padding:12px;background:#b58b42;color:#220b0a;border:none;border-radius:6px;font-weight:bold;cursor:pointer}";
  html += ".card{background:#351613;border:1px solid #734c2d;border-radius:8px;padding:16px;max-width:400px;margin:15px auto}";
  html += "</style></head><body>";
  html += "<h1>TRUNG TÂM CHIẾU SÁNG ATK ĐỊNH HÓA</h1>";
  #if defined(ESP8266)
  html += "<p>Hệ thống Relay ESP8266 (NodeMCU / WeMos D1) - Sẵn sàng kết nối Web & APK</p>";
  #else
  html += "<p>Hệ thống Relay ESP32 - Sẵn sàng kết nối Web Dashboard & APK</p>";
  #endif
  html += "<div class='card'>";
  html += "<p><strong>Địa chỉ IP:</strong> " + (WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : WiFi.softAPIP().toString()) + "</p>";
  html += "<p><strong>Khóa API:</strong> " + apiToken + "</p>";
  html += "<p><strong>Trạng thái:</strong> 4 kênh Relay hoạt động tốt</p>";
  html += "<button class='btn' onclick=\"fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer " + apiToken + "'},body:JSON.stringify({systemOn:true})}).then(()=>location.reload())\">BẬT TOÀN BỘ ĐÈN</button>";
  html += "<button class='btn' style='background:#5a1311;color:#fff' onclick=\"fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer " + apiToken + "'},body:JSON.stringify({systemOn:false})}).then(()=>location.reload())\">TẮT TOÀN BỘ ĐÈN</button>";
  html += "</div>";
  html += "<p style='font-size:11px;color:#775039'>Đồng bộ thời gian thực với Web Dashboard & APK</p>";
  html += "</body></html>";
  server.send(200, "text/html; charset=utf-8", html);
}

// ── SETUP ──────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(200);

  Serial.println("\n\n================================================");
  Serial.println("  TRUNG TÂM ĐIỀU KHIỂN CHIẾU SÁNG ATK ĐỊNH HÓA  ");
  #if defined(ESP8266)
  Serial.println("  FIRMWARE ESP8266 RELAY 4 KÊNH (NodeMCU/D1)   ");
  #else
  Serial.println("  FIRMWARE ESP32 RELAY 4 KÊNH                   ");
  #endif
  Serial.println("================================================");

  // Khởi tạo phần cứng relay
  setupOutputs();

  // Khởi tạo bộ nhớ lưu trữ
  #if defined(ESP8266)
  LittleFS.begin();
  loadSettings();
  if (LittleFS.exists("/token.txt")) {
    File f = LittleFS.open("/token.txt", "r");
    if (f) {
      apiToken = f.readString();
      apiToken.trim();
      f.close();
    }
  }
  if (apiToken.length() == 0) {
    apiToken = DEFAULT_API_TOKEN;
    File f = LittleFS.open("/token.txt", "w");
    if (f) {
      f.print(apiToken);
      f.close();
    }
  }
  apPassword = AP_PASSWORD;
  #else
  preferences.begin("atk-light", false);
  loadSettings();
  apiToken = preferences.getString("apiToken", DEFAULT_API_TOKEN);
  if (apiToken.length() == 0) {
    apiToken = DEFAULT_API_TOKEN;
    preferences.putString("apiToken", apiToken);
  }
  apPassword = preferences.getString("apPass", AP_PASSWORD);
  #endif

  // Khởi động Wi-Fi SoftAP phát sóng
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, apPassword.c_str());

  // Kết nối Wi-Fi ngoài nếu có cấu hình
  if (strlen(WIFI_SSID) > 0) {
    Serial.printf("Đang kết nối Wi-Fi: %s ...\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 25) {
      delay(400);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n[OK] Đã kết nối Wi-Fi Router thành công!");
      Serial.printf("=> Địa chỉ IP LAN: http://%s\n", WiFi.localIP().toString().c_str());
    } else {
      Serial.println("\n[!] Chưa bắt được Wi-Fi Router. Vui lòng kết nối vào Wi-Fi AP: ATK-LIGHT-ESP8266");
    }
  }

  // Đồng bộ thời gian NTP (Múi giờ Việt Nam GMT+7)
  configTime(7 * 3600, 0, "pool.ntp.org", "time.google.com");

  // Khởi tạo tên miền cục bộ mDNS
  if (MDNS.begin(MDNS_NAME)) {
    MDNS.addService("http", "tcp", 80);
    Serial.printf("mDNS sẵn sàng: http://%s.local\n", MDNS_NAME);
  }

  // Cấu hình các Endpoint WebServer
  #if defined(ESP8266)
  server.collectHeaders("Authorization");
  #else
  const char* headers[] = {"Authorization"};
  server.collectHeaders(headers, 1);
  #endif

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/state", HTTP_GET, []() {
    if (isAuthorized()) sendState();
  });
  server.on("/api/control", HTTP_POST, handleControl);
  server.on("/api/schedules", HTTP_GET, []() {
    if (isAuthorized()) sendState();
  });
  server.on("/api/schedules", HTTP_PUT, handleSchedules);
  server.on("/api/time", HTTP_POST, handleTimeSync);

  // Endpoint tiện ích test bật/tắt nhanh bằng trình duyệt
  server.on("/api/relay", HTTP_GET, []() {
    if (!isAuthorized()) return;
    if (server.hasArg("zone") && server.hasArg("on")) {
      int zone = server.arg("zone").toInt();
      bool on = server.arg("on").toInt() > 0;
      if (zone >= 0 && zone < 4) {
        areaOn[zone] = on;
        applyOutputs();
        markDirty();
        sendState();
        return;
      }
    }
    errorResponse(400, "Cần tham số ?zone=0..3&on=0..1");
  });

  // Xử lý OPTIONS cho CORS
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      setCorsHeaders();
      server.send(204);
    } else {
      errorResponse(404, "Endpoint không tồn tại trên thiết bị");
    }
  });

  server.begin();

  #if defined(ESP8266)
  addEvent("ESP8266 đã khởi động", "4 kênh relay sẵn sàng (D5, D6, D7, D8 - Kích Dương)");
  #else
  addEvent("ESP32 đã khởi động", "4 kênh relay sẵn sàng tại mức an toàn (TẮT)");
  #endif

  Serial.println("\n--- THÔNG TIN KẾT NỐI ---");
  Serial.printf("1. Wi-Fi Access Point: %s (Pass: %s)\n", AP_SSID, apPassword.c_str());
  Serial.printf("2. Địa chỉ IP Access Point: http://%s\n", WiFi.softAPIP().toString().c_str());
  Serial.printf("3. Khóa API Token: %s\n", apiToken.c_str());
  Serial.println("================================================\n");
}

// ── LOOP ───────────────────────────────────────────────────────────────────
void loop() {
  server.handleClient();
  runScheduler();
  checkAutoLightSensor();

  #if defined(ESP8266)
  MDNS.update();
  #endif

  // Tự động lưu cấu hình sau 2 giây nếu có thay đổi
  if (dirty && millis() - dirtyAt >= 2000) {
    saveSettings();
  }

  // Tự động kết nối lại Wi-Fi nếu rớt mạng
  if (strlen(WIFI_SSID) > 0 && WiFi.status() != WL_CONNECTED && millis() - lastWifiAttempt >= 15000) {
    lastWifiAttempt = millis();
    WiFi.reconnect();
  }

  static bool announced = false;
  if (WiFi.status() == WL_CONNECTED && !announced) {
    Serial.printf("Đã kết nối Wi-Fi Router! Địa chỉ IP LAN: http://%s\n", WiFi.localIP().toString().c_str());
    announced = true;
  }
  if (WiFi.status() != WL_CONNECTED) {
    announced = false;
  }

  delay(2);
}
