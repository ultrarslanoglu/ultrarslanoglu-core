#!/bin/bash

# 🚀 ULTRARSLANOGLU-CORE HIZLI BAŞLANGIÇ SCRIPTI
# 3 Ocak 2026

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ULTRARSLANOGLU-CORE V2.0 BAŞLATMA SCRIPTI                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Renk tanımları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Kontrol ve başlatma fonksiyonları
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker yüklü değil!${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Docker kontrol edildi${NC}"
    return 0
}

check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js yüklü değil!${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Node.js kontrol edildi${NC}"
    return 0
}

check_python() {
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 yüklü değil!${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Python3 kontrol edildi${NC}"
    return 0
}

start_mongodb() {
    echo -n "MongoDB başlatılıyor..."
    if docker ps | grep -q ultrarslanoglu-mongodb; then
        echo -e " ${GREEN}(zaten çalışıyor)${NC}"
    else
        docker run -d \
            --name ultrarslanoglu-mongodb \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=admin \
            -e MONGO_INITDB_ROOT_PASSWORD=ultrarslanoglu2025 \
            mongo:7.0 2>/dev/null
        sleep 3
        echo -e " ${GREEN}✓${NC}"
    fi
}

start_redis() {
    echo -n "Redis başlatılıyor..."
    if docker ps | grep -q ultrarslanoglu-redis; then
        echo -e " ${GREEN}(zaten çalışıyor)${NC}"
    else
        docker run -d \
            --name ultrarslanoglu-redis \
            -p 6379:6379 \
            redis:7-alpine 2>/dev/null
        sleep 2
        echo -e " ${GREEN}✓${NC}"
    fi
}

start_api_gateway() {
    echo -n "API Gateway başlatılıyor..."
    
    # Python venv oluştur
    if [ ! -d "/tmp/api_env" ]; then
        python3 -m venv /tmp/api_env >/dev/null 2>&1
        source /tmp/api_env/bin/activate
        pip install -q -r api-gateway/requirements.txt
    fi
    
    source /tmp/api_env/bin/activate
    python3 api-gateway/main.py >/dev/null 2>&1 &
    API_PID=$!
    sleep 3
    
    if curl -s http://localhost:5000/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC} (PID: $API_PID)"
    else
        echo -e " ${RED}✗${NC}"
        return 1
    fi
}

start_website() {
    echo -n "Website başlatılıyor..."
    
    cd ultrarslanoglu-website
    npm start >/dev/null 2>&1 &
    WEBSITE_PID=$!
    cd ..
    
    sleep 5
    
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        echo -e " ${GREEN}✓${NC} (PID: $WEBSITE_PID)"
    else
        echo -e " ${RED}✗${NC}"
        return 1
    fi
}

# MAIN BAŞLANGICI
echo "🔍 Sistem Kontrolleri:"
echo "───────────────────────"
check_docker || exit 1
check_node || exit 1
check_python || exit 1

echo ""
echo "🚀 Servisler Başlatılıyor:"
echo "───────────────────────"
start_mongodb
start_redis
start_api_gateway
start_website

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ SİSTEM BAŞARILI ŞEKİLDE BAŞLADI!              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Servisler:"
echo "   • API Gateway: http://localhost:5000"
echo "   • Website:     http://localhost:3001"
echo "   • MongoDB:     localhost:27017"
echo "   • Redis:       localhost:6379"
echo ""
echo "🧪 Test Et:"
echo "   curl http://localhost:5000/health"
echo "   curl http://localhost:3001/api/health"
echo ""
echo "📚 Dokümantasyon:"
echo "   • START-HERE.md"
echo "   • DEVELOPMENT-ROADMAP-01-JAN-2026.md"
echo "   • SYSTEM-STATUS-03-JAN-2026.md"
echo ""
echo "Press Ctrl+C to stop services"
echo ""

# Servisleri arka planda tut
wait
