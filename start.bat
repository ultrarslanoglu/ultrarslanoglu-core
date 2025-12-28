@echo off
REM Ultrarslanoglu-Core Çalıştırma Scripti (Windows)
REM Tüm servisleri arka planda başlatır

setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║   Ultrarslanoglu-Core Başlatılıyor       ║
echo ╚════════════════════════════════════════════╝
echo.

REM 1. Docker Container'ları Başlat
echo 📦 Docker Container'ları başlatılıyor...
cd /d "%~dp0"
docker compose -f docker-compose.dev.yml up -d

echo.
echo ✅ Docker container'ları başlatıldı
echo.

REM MongoDB bağlantısını bekle
echo ⏳ MongoDB'nin açılması bekleniyor (10 sn)...
timeout /t 10 /nobreak

REM 2. Terminal Pencereleri Aç
echo.
echo 🚀 Backend başlatılıyor (Port 3000)...
start "Ultrarslanoglu - Backend" cmd /k "cd /d social-media-hub && npm run dev"
timeout /t 2 /nobreak

echo.
echo ⚛️  Frontend başlatılıyor (Port 3001)...
start "Ultrarslanoglu - Frontend" cmd /k "cd /d ultrarslanoglu-website && npm run dev"
timeout /t 2 /nobreak

cls
echo.
echo ╔════════════════════════════════════════════╗
echo ║   🎉 Sistem Tamamen Açık!               ║
echo ╚════════════════════════════════════════════╝
echo.
echo 📍 Servisler:
echo    🌐 Frontend:  http://localhost:3001
echo    🔌 Backend:   http://localhost:3000
echo    🗄️  Database:  mongodb://localhost:27017
echo    💾 Cache:     redis://localhost:6379
echo.
echo ⚠️  İpucu: Tüm pencereleri kapatmak için burayı kapatın
echo.
pause

REM Opsiyonel: Tamamen Dur
REM docker compose -f docker-compose.dev.yml down
