@echo off
title ATK LIGHT - CHIA SE WEB RA NGOAI INTERNET
cd /d "%~dp0"

echo Dang khoi dong Web & Ket noi Internet Tunnel...
echo.
if not exist .tooling\cloudflared.exe (
    echo Dang tai cong cu chia se...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '.tooling\cloudflared.exe'"
)

echo ============================================================
echo   LINK DANG HOAT DONG - GUI LINK NAY CHO NGUOI KHAC DE XEM:
echo ============================================================
echo.
.tooling\cloudflared.exe tunnel --url http://127.0.0.1:5173
pause
