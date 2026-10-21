@echo off
title DANG DU AN LEN GITHUB DE TRIEN KHAI CLOUD 24/7
cd /d "%~dp0"

echo ============================================================
echo   CHUAN BI DANG CODE LEN GITHUB (DE DEPLOY CLOUD 24/24)
echo ============================================================
echo.

git status
echo.
set /p REPO_URL="Nhap link GitHub Repository cua ban (Vi du: https://github.com/username/atk-light.git): "

if "%REPO_URL%"=="" (
    echo Khong duoc de trong link GitHub!
    pause
    exit /b
)

echo.
echo Dang luu tru cac file...
git add .
git commit -m "Deploy ATK Light Cloud 24/7"
git branch -M main

git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo Dang day code len GitHub...
git push -u origin main

echo.
echo ============================================================
echo   HOAN TAT! Code da san sang tren GitHub.
echo   Bay gio hay lam theo huong dan trong:
echo   HUONG-DAN-TRIEN-KHAI-CLOUD-24-7.md
echo ============================================================
pause
