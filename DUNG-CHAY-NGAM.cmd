@echo off
title DUNG CAC DICH VU ATK LIGHT
cd /d "%~dp0"

echo Dang dung cac tien trinh Web va Backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Da dung toan bo he thong Web va Backend thanh cong.
pause
