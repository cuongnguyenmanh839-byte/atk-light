@echo off
title CAI DAT ATK LIGHT TU KHOI DONG 24/24 CUNG WINDOWS
cd /d "%~dp0"

echo ============================================================
echo   DANG CAI DAT TU KHOI DONG CUNG WINDOWS (CHAY NGAM 24/24)
echo ============================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\create-startup-shortcut.ps1"

echo.
echo [2/2] Dang khoi dong cac dich vu ngam ngay bay gio...
wscript "%~dp0CHAY-NGAM-24-7.vbs"

echo.
echo ============================================================
echo   CAI DAT HOAN TAT!
echo   - He thong se tu dong chay ngam 24/24 moi khi bat may tinh.
echo   - Khong can phai mo file hay giu cua so den nua.
echo   - Link Online toan cau: https://machines-stripes-relevant-travels.trycloudflare.com
echo   - Da tao bieu tuong 'LINK-TRUY-CAP-ONLINE' ngay ngoai Man Hinh Desktop!
echo   - Web cuc bo may tinh:  http://127.0.0.1:5173
echo   - Web Wi-Fi noi bo:     http://192.168.137.1:5173
echo ============================================================
echo.
pause
