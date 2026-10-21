@echo off
cd /d "%~dp0"
if not exist node_modules (
    call npm.cmd install
    if errorlevel 1 goto failed
)
netstat -ano | findstr 3001 >nul 2>nul
if errorlevel 1 (
    echo Dang khoi dong Backend API (Port 3001)...
    start /b cmd /c "cd /d "%~dp0backend" && node dist/main.js"
)

echo ============================================================
echo   ATK LIGHT - DANG HOAT DONG
echo   1. Tren may tinh nay: http://127.0.0.1:5173
echo   2. Tren dien thoai (bat Hotspot may tinh): http://192.168.137.1:5173
echo   3. Hoac dien thoai cung Wi-Fi phong: http://192.168.100.23:5173
echo   * ESP dang ket noi tai: http://192.168.137.97
echo ------------------------------------------------------------
echo   TAI KHOAN DANG NHAP:
echo   - Admin (Toan quyen):  admin  /  admin  (hoac Admin@2026)
echo   - Super Admin:         superadmin  /  SuperAdmin@2026
echo   - Nguoi van hanh:      operator  /  Operator@2026
echo   - Nguoi xem:           viewer  /  Viewer@2026
echo ============================================================
echo Giu cua so nay mo khi su dung ung dung.
call npm.cmd run dev -- --host 0.0.0.0 --port 5173
if errorlevel 1 goto failed
exit /b 0
:failed
echo Khong the khoi dong. Kiem tra Node.js va thong bao loi o tren.
pause
exit /b 1
