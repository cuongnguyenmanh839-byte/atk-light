# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG ATK LIGHT CHẠY 24/24 TRÊN CLOUD / VPS
> Giúp hệ thống hoạt động liên tục 24/7 mà **hoàn toàn không cần bật máy tính**.

---

## 🌟 CÁC CÔNG CỤ ĐÃ ĐƯỢC CHUẨN BỊ SẴN TRONG DỰ ÁN

1. **`Dockerfile`**: Đã cấu hình đóng gói cả **Frontend (React Vite)** và **Backend (NestJS + SQLite)** vào 1 khối duy nhất.
2. **`render.yaml`**: Cấu hình tự động triển khai 1-click trên Render.com.
3. **`docker-compose.yml`**: Dành cho bạn nào triển khai lên VPS (máy chủ riêng) với đúng 1 lệnh.
4. **`/api/system/health`**: Cổng kiểm tra trạng thái để dịch vụ Ping (UptimeRobot) giữ cho Server hoạt động liên tục không bao giờ bị ngủ.

---

## PHƯƠNG ÁN 1: TRIỂN KHAI LÊN RENDER.COM (MIỄN PHÍ 100% - KHÔNG CẦN THẺ VISA)

Render.com cho phép bạn chạy Web Service Docker hoàn toàn miễn phí.

### Bước 1: Đưa code lên tài khoản GitHub của bạn
1. Mở trang [github.com](https://github.com) và đăng nhập (hoặc tạo tài khoản miễn phí).
2. Bấm nút **New Repository** (Tạo kho lưu trữ mới):
   - Đặt tên: `atk-light`
   - Chọn chế độ: **Public** hoặc **Private** đều được.
   - Bấm **Create repository**.
3. Chạy file `DANG-LEN-GITHUB.cmd` trong thư mục dự án (hoặc gõ lệnh sau vào Terminal):
   ```bash
   git add .
   git commit -m "Deploy ATK Light 24/7 Cloud"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/atk-light.git
   git push -u origin main
   ```

### Bước 2: Tạo Web Service trên Render.com
1. Truy cập [dashboard.render.com](https://dashboard.render.com) và đăng nhập bằng tài khoản GitHub.
2. Chọn **New +** → **Web Service**.
3. Chọn kho `atk-light` bạn vừa đẩy lên và bấm **Connect**.
4. Điền cấu hình như sau:
   - **Name**: `atk-light-247`
   - **Region**: `Singapore` (để tốc độ tải từ Việt Nam nhanh nhất)
   - **Language / Runtime**: Chọn **Docker** (Render sẽ tự nhận diện file `Dockerfile`)
   - **Instance Type**: Chọn **Free** ($0/tháng)
5. Kéo xuống phần **Advanced**:
   - **Health Check Path**: Điền `/api/system/health`
6. Bấm nút **Deploy Web Service** và đợi khoảng 3–5 phút để Render tự động build.
7. Khi hoàn tất, Render sẽ cấp cho bạn một link cố định 24/24 có dạng:
   👉 `https://atk-light-247.onrender.com`

---

## ⚡ BÍ QUYẾT GIỮ CHO RENDER CHẠY 24/24 KHÔNG BỊ TỰ ĐỘNG TẮT (SLEEP)

> **Lưu ý quan trọng**: Gói Free của Render sẽ tự động tạm dừng (ngủ) sau 15 phút nếu không có ai truy cập. Khi có người vào lại sẽ mất khoảng 40 giây để khởi động lại.  
> **Cách duy trì 24/24 thức liên tục**:

1. Vào trang miễn phí [cron-job.org](https://cron-job.org) hoặc [uptimerobot.com](https://uptimerobot.com).
2. Tạo tài khoản miễn phí và tạo một **Monitor / Cron Job**:
   - **URL cần ping**: `https://link-render-cua-ban.onrender.com/api/system/health`
   - **Tần suất**: Mỗi `10 phút` hoặc `5 phút` một lần (Execution schedule: Every 10 minutes).
3. **Kết quả**: Dịch vụ này sẽ tự động gửi tín hiệu "đánh thức" định kỳ, giúp Server của bạn **chạy mượt 24/24 liên tục như VPS trả phí** mà không tốn một đồng nào!

---

## PHƯƠNG ÁN 2: TRIỂN KHAI LÊN VPS RIÊNG (50.000đ - 100.000đ/tháng)

Nếu bạn đã có một máy chủ VPS Linux (Ubuntu / Debian) của Vietnix, CloudFly, BKHOST, v.v.:

1. Đăng nhập vào VPS qua SSH:
   ```bash
   ssh root@ip_vps
   ```
2. Cài đặt Docker (nếu chưa có):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Tải dự án về VPS và chạy:
   ```bash
   git clone https://github.com/TÊN_GITHUB/atk-light.git
   cd atk-light
   docker compose up -d --build
   ```
4. **Kết quả**: Hệ thống chạy ngầm vĩnh viễn với cơ chế `restart: always` (kể cả khi VPS bị khởi động lại). Truy cập qua `http://ip_vps:3001`.

---

## 📡 CÁCH ESP32 Ở NHÀ KẾT NỐI VỚI WEB TRÊN CLOUD

- **Khi ở nhà / tại khu di tích**: Mở link Web hoặc mở App Android `ATK-LIGHT-v4-modern-ui.apk`, hệ thống sẽ tự động giao tiếp trực tiếp với ESP32 qua mạng LAN nội bộ cực kỳ nhanh và ổn định.
- **Khi đi ra ngoài đường (bằng 4G)**:
  - Bản thân mạch ESP32 cắm củ sạc 5V đã tự động chạy theo lịch hẹn giờ độc lập.
  - Bạn có thể cấu hình ESP32 kết nối qua **MQTT Cloud** (HiveMQ Cloud miễn phí) để nhận lệnh từ xa từ Web Cloud mọi lúc mọi nơi.
