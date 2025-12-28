#!/bin/bash

# Ultrarslanoglu-Core Kurulum Scripti
# Bu script geliştirme ortamını otomatik olarak kurar

set -e

echo "🚀 Ultrarslanoglu-Core Kurulum Başlıyor..."
echo "================================================"

# 1. Backend Kurulumu
echo ""
echo "📦 Social Media Hub kurulumu başlıyor..."
cd social-media-hub

# Node modules kontrol
if [ ! -d "node_modules" ]; then
    echo "📥 NPM paketleri yükleniyor..."
    npm install
else
    echo "✅ Node modules zaten yüklü"
fi

# .env kontrol
if [ ! -f ".env" ]; then
    echo "⚠️  .env dosyası bulunamadı! .env.example'dan kopyalanıyor..."
    cp .env.example .env
    echo "📝 Lütfen .env dosyasını düzenleyin:"
    echo "   - JWT_SECRET: Güçlü bir key girin"
    echo "   - MONGODB_URI: MongoDB bağlantı string'i"
    echo "   - OAuth credentials: Platform API keys"
else
    echo "✅ .env dosyası bulundu"
fi

cd ..

# 2. Frontend Kurulumu
echo ""
echo "📦 Website kurulumu başlıyor..."
cd ultrarslanoglu-website

# Node modules kontrol
if [ ! -d "node_modules" ]; then
    echo "📥 NPM paketleri yükleniyor..."
    npm install
else
    echo "✅ Node modules zaten yüklü"
fi

# .env kontrol
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local dosyası bulunamadı! .env.example'dan kopyalanıyor..."
    cp .env.example .env.local
    echo "📝 Lütfen .env.local dosyasını düzenleyin:"
    echo "   - NEXTAUTH_SECRET: Güçlü bir key girin"
    echo "   - NEXT_PUBLIC_API_URL: Backend API URL (http://localhost:3000)"
else
    echo "✅ .env.local dosyası bulundu"
fi

cd ..

# 3. MongoDB Kontrol
echo ""
echo "🗄️  MongoDB bağlantısı kontrol ediliyor..."
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB yüklü"
else
    echo "⚠️  MongoDB bulunamadı. Lütfen https://www.mongodb.com/try/download/community adresinden indirin"
fi

# 4. Özet
echo ""
echo "================================================"
echo "✨ Kurulum Tamamlandı!"
echo ""
echo "📋 Sonraki Adımlar:"
echo ""
echo "1️⃣  Backend Başlat:"
echo "   cd social-media-hub"
echo "   npm run dev"
echo ""
echo "2️⃣  Frontend Başlat (yeni terminal):"
echo "   cd ultrarslanoglu-website"
echo "   npm run dev"
echo ""
echo "3️⃣  MongoDB Başlat (yeni terminal):"
echo "   mongod"
echo ""
echo "4️⃣  Tarayıcıdan ziyaret edin:"
echo "   http://localhost:3001"
echo ""
echo "================================================"
