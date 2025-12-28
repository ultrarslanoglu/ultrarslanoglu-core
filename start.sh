#!/bin/bash

# Ultrarslanoglu-Core Çalıştırma Scripti
# Tüm servisleri arka planda başlatır

set -e

RESET='\033[0m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'

echo -e "${BLUE}╔════════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║   Ultrarslanoglu-Core Başlatılıyor       ║${RESET}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${RESET}"

# 1. Docker Container'ları Başlat
echo ""
echo -e "${BLUE}📦 Docker Container'ları başlatılıyor...${RESET}"
cd "$(dirname "$0")"
docker compose -f docker-compose.dev.yml up -d

echo -e "${GREEN}✅ Docker container'ları başlatıldı${RESET}"

# MongoDB bağlantısını bekle
echo ""
echo -e "${YELLOW}⏳ MongoDB'nin açılması bekleniyor...${RESET}"
sleep 10

# 2. Backend Başlat
echo ""
echo -e "${BLUE}🚀 Backend başlatılıyor (Port 3000)...${RESET}"
cd social-media-hub
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend başlatıldı (PID: $BACKEND_PID)${RESET}"

# 3. Frontend Başlat
echo ""
echo -e "${BLUE}⚛️  Frontend başlatılıyor (Port 3001)...${RESET}"
cd ../ultrarslanoglu-website
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend başlatıldı (PID: $FRONTEND_PID)${RESET}"

cd ..

# Durum Gösterimi
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║   🎉 Sistem Tamamen Açık!               ║${RESET}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BLUE}📍 Servisler:${RESET}"
echo -e "   🌐 Frontend:  ${GREEN}http://localhost:3001${RESET}"
echo -e "   🔌 Backend:   ${GREEN}http://localhost:3000${RESET}"
echo -e "   🗄️  Database:  ${GREEN}mongodb://localhost:27017${RESET}"
echo -e "   💾 Cache:     ${GREEN}redis://localhost:6379${RESET}"
echo ""
echo -e "${YELLOW}⚠️  İpucu: Ctrl+C ile tüm servisleri durduabilirsiniz${RESET}"

# Düzgün Kapatış için
trap "echo 'Durduruluyor...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose -f docker-compose.dev.yml down" EXIT

wait
