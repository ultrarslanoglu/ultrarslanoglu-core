@echo off
REM Ultrarslanoglu-Core Kurulum Scripti (Windows)
REM Bu script geliştirme ortamını otomatik olarak kurar

setlocal enabledelayedexpansion

echo 🚀 Ultrarslanoglu-Core Kurulum Başlıyor...
echo ================================================

REM 1. Backend Kurulumu
echo.
echo 📦 Social Media Hub kurulumu başlıyor...
cd /d social-media-hub

if not exist "node_modules" (
    echo 📥 NPM paketleri yükleniyor...
    call npm install
) else (
    echo ✅ Node modules zaten yüklü
)

if not exist ".env" (
    echo ⚠️  .env dosyası bulunamadı! .env.example'dan kopyalanıyor...
    copy .env.example .env
    echo 📝 Lütfen .env dosyasını düzenleyin:
    echo    - JWT_SECRET: Güçlü bir key girin
    echo    - MONGODB_URI: MongoDB bağlantı string'i
    echo    - OAuth credentials: Platform API keys
) else (
    echo ✅ .env dosyası bulundu
)

cd ..

REM 2. Frontend Kurulumu
echo.
echo 📦 Website kurulumu başlıyor...
cd /d ultrarslanoglu-website

if not exist "node_modules" (
    echo 📥 NPM paketleri yükleniyor...
    call npm install
) else (
    echo ✅ Node modules zaten yüklü
)

if not exist ".env.local" (
    echo ⚠️  .env.local dosyası bulunamadı! .env.example'dan kopyalanıyor...
    copy .env.example .env.local
    echo 📝 Lütfen .env.local dosyasını düzenleyin:
    echo    - NEXTAUTH_SECRET: Güçlü bir key girin
    echo    - NEXT_PUBLIC_API_URL: Backend API URL ^(http://localhost:3000^)
) else (
    echo ✅ .env.local dosyası bulundu
)

cd ..

REM 3. Özet
echo.
echo ================================================
echo ✨ Kurulum Tamamlandı!
echo.
echo 📋 Sonraki Adımlar:
echo.
echo 1️⃣  Backend Başlat:
echo    cd social-media-hub
echo    npm run dev
echo.
echo 2️⃣  Frontend Başlat ^(yeni terminal^):
echo    cd ultrarslanoglu-website
echo    npm run dev
echo.
echo 3️⃣  MongoDB Başlat ^(yeni terminal^):
echo    mongod
echo.
echo 4️⃣  Tarayıcıdan ziyaret edin:
echo    http://localhost:3001
echo.
echo ================================================

pause
