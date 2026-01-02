@echo off
REM Ultrarslanoglu Project - Complete Startup Script for Windows
REM Tüm servisleri sırasıyla başlat

setlocal enabledelayedexpansion

cls
echo.
echo =========================================
echo    Ultrarslanoglu Projesi Başlatılıyor
echo    %date% %time%
echo =========================================
echo.

REM Get project directory
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

REM 1. Python Virtual Environment
echo.
echo 📦 Python Virtual Environment kontrol ediliyor...
if not exist ".venv" (
    echo    ⚠️ .venv bulunamadı, oluşturuluyor...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo    ✅ Python environment aktif
timeout /t 2 /nobreak > nul

REM 2. Docker Services
echo.
echo 🐳 Docker Services başlatılıyor...
docker-compose -f docker-compose.prod.yml up -d mongodb redis
timeout /t 5 /nobreak > nul
echo    ✅ MongoDB ve Redis başlatıldı

REM 3. API Gateway
echo.
echo 🔗 API Gateway başlatılıyor (localhost:5000)...
start "API Gateway" cmd /k "cd api-gateway && python main_v2.py"
timeout /t 3 /nobreak > nul

powershell -Command "^
$retry=0; ^
while ($retry -lt 10) { ^
  try { ^
    $response = curl.exe -s http://localhost:5000/health 2>$null; ^
    if ($LASTEXITCODE -eq 0) { ^
      Write-Host '   ✅ API Gateway çalışıyor'; ^
      break; ^
    } ^
  } catch { } ^
  $retry++; ^
  Start-Sleep -Seconds 1; ^
} ^
" 2>nul

REM 4. Social Media Hub
echo.
echo 📱 Social Media Hub başlatılıyor (localhost:3000)...
start "Social Media Hub" cmd /k "cd social-media-hub && npm run dev"
timeout /t 3 /nobreak > nul
echo    ⏳ Social Media Hub başlatılıyor...

REM 5. Website
echo.
echo 🌐 Website başlatılıyor (localhost:3001)...
start "Website" cmd /k "cd ultrarslanoglu-website && npm run dev"
timeout /t 3 /nobreak > nul
echo    ⏳ Website başlatılıyor...

REM Summary
echo.
echo =========================================
echo    Ultrarslanoglu Projesi Başlatıldı!
echo =========================================
echo.
echo 📋 Servisler:
echo    🔗 API Gateway    : http://localhost:5000
echo    📱 Social Hub     : http://localhost:3000
echo    🌐 Website        : http://localhost:3001
echo    📊 MongoDB        : localhost:27017
echo    🔴 Redis          : localhost:6379
echo.
echo 📝 Browser pencereleri açılacak...
start http://localhost:5000/health
timeout /t 2 /nobreak > nul
start http://localhost:3001
echo.
echo 🛑 Durdurmak için pencere başlıklarından close tuşlarını kullanın
echo =========================================
echo.
pause
