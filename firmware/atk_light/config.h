#pragma once

// ============================================================================
// HỆ THỐNG CHIẾU SÁNG ATK ĐỊNH HÓA - THÁI NGUYÊN
// CẤU HÌNH FIRMWARE ESP8266 / ESP32 ĐIỀU KHIỂN RELAY 4 KÊNH
// Hỗ trợ cả ESP8266 (NodeMCU v1.0, WeMos D1 Mini, ESP-12E/F) và ESP32
// ============================================================================

// 1. Cấu hình Wi-Fi kết nối Router (để trống nếu chỉ dùng Access Point)
constexpr char WIFI_SSID[] = "ESP-TEST";          // Tên Wi-Fi Hotspot
constexpr char WIFI_PASSWORD[] = "88888888";      // Mật khẩu Wi-Fi Hotspot

// 2. Cấu hình Access Point phát từ bo mạch (Khi không có mạng Wi-Fi ngoài)
#if defined(ESP8266)
constexpr char AP_SSID[] = "ATK-LIGHT-ESP8266";
#else
constexpr char AP_SSID[] = "ATK-LIGHT-ESP32";
#endif
constexpr char AP_PASSWORD[] = "12345678"; // Tối thiểu 8 ký tự

// 3. Khóa bảo mật API Token (Dùng chung cho Web Dashboard và Android APK)
constexpr char DEFAULT_API_TOKEN[] = "atk2026";

// 4. Chế độ điều khiển phần cứng
enum class DriverMode { Relay, CctPwm };
constexpr DriverMode DRIVER_MODE = DriverMode::Relay;

// Mức kích hoạt Relay:
// true: Xuất LOW để BẬT relay, HIGH để TẮT relay (Module Kích mức Âm - Active LOW)
// false: Xuất HIGH để BẬT relay, LOW để TẮT relay (Module Kích mức Dương - Active HIGH)
constexpr bool RELAY_ACTIVE_LOW = false;

// 5. Chân GPIO kết nối Module Relay 4 Kênh (Tương ứng 4 Khu di tích)
#if defined(ESP8266)
// ============================================================================
// CẤU HÌNH CHÂN CHO ESP8266 (NodeMCU 1.0, WeMos D1 Mini) theo yêu cầu:
// D5 (GPIO 14) -> Relay 1 (Đồi Khau Tý)
// D6 (GPIO 12) -> Relay 2 (Lán Tỉn Keo)
// D7 (GPIO 13) -> Relay 3 (Nhà tưởng niệm)
// D8 (GPIO 15) -> Relay 4 (Quảng trường)
// ============================================================================
constexpr int RELAY_PINS[4] = {14, 12, 13, 15}; // {D5, D6, D7, D8}
#else
// Cấu hình chân mặc định cho ESP32 DevKit:
constexpr int RELAY_PINS[4] = {16, 17, 18, 19};
#endif

// Số lượng đèn thực tế theo thiết kế tại 4 khu di tích
constexpr unsigned LAMP_COUNTS[4] = {38, 32, 56, 42};

// 6. Cảm biến ánh sáng LDR (Quang trở) & Tự động bật/tắt theo môi trường
#if defined(ESP8266)
constexpr int LIGHT_SENSOR_PIN = A0; // Chân analog A0 trên ESP8266
#else
constexpr int LIGHT_SENSOR_PIN = 36; // Chân VP / GPIO 36 trên ESP32
#endif
constexpr int DEFAULT_LUX_THRESHOLD = 150; // Dưới 150 Lux coi là trời tối -> tự kích hoạt

// 7. Cấu hình hệ thống khác
constexpr unsigned SERIAL_BAUD = 115200;
constexpr unsigned MAX_SCHEDULES = 16;
constexpr char MDNS_NAME[] =
    "atk-light"; // Truy cập qua: http://atk-light.local
