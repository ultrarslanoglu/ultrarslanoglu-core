#!/bin/bash
# Ultrarslanoglu Project - Complete Startup Script
# Tüm servisleri sırasıyla başlat

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🚀 ========================================="
echo "   Ultrarslanoglu Projesi Başlatılıyor"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 1. Python Virtual Environment
echo ""
echo "📦 Python Virtual Environment kontrol ediliyor..."
if [ ! -d ".venv" ]; then
    echo "   ⚠️ .venv bulunamadı, oluşturuluyor..."
    python -m venv .venv
fi
source .venv/bin/activate
echo "   ✅ Python environment aktif"

# 2. Docker Services
echo ""
echo "🐳 Docker Services başlatılıyor..."
docker-compose -f docker-compose.prod.yml up -d mongodb redis
sleep 5

echo "   🔍 MongoDB durumu kontrol ediliyor..."
docker exec ultrarslanoglu-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null && echo "   ✅ MongoDB sağlıklı" || echo "   ⚠️ MongoDB hazırlanıyor..."

echo "   🔍 Redis durumu kontrol ediliyor..."
docker exec ultrarslanoglu-redis redis-cli ping > /dev/null && echo "   ✅ Redis sağlıklı" || echo "   ⚠️ Redis hazırlanıyor..."

# 3. API Gateway
echo ""
echo "🔗 API Gateway başlatılıyor (localhost:5000)..."
cd api-gateway
python main_v2.py > logs/api-gateway.log 2>&1 &
API_PID=$!
sleep 3

# Test health check
if curl -s http://localhost:5000/health > /dev/null; then
    echo "   ✅ API Gateway çalışıyor"
else
    echo "   ⚠️ API Gateway başlatılıyor..."
fi

# 4. Social Media Hub
echo ""
echo "📱 Social Media Hub başlatılıyor (localhost:3000)..."
cd ../social-media-hub
npm run dev > logs/social-hub.log 2>&1 &
SOCIAL_PID=$!
sleep 3

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Social Media Hub çalışıyor"
else
    echo "   ⚠️ Social Media Hub başlatılıyor..."
fi

# 5. Website
echo ""
echo "🌐 Website başlatılıyor (localhost:3001)..."
cd ../ultrarslanoglu-website
npm run dev > logs/website.log 2>&1 &
WEBSITE_PID=$!
sleep 3

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Website çalışıyor"
else
    echo "   ⚠️ Website başlatılıyor..."
fi

# 6. Summary
echo ""
echo "✅ ========================================="
echo "   Ultrarslanoglu Projesi Başlatıldı!"
echo "========================================="
echo ""
echo "📋 Servisler:"
echo "   🔗 API Gateway    : http://localhost:5000"
echo "   📱 Social Hub     : http://localhost:3000"
echo "   🌐 Website        : http://localhost:3001"
echo "   📊 MongoDB        : localhost:27017"
echo "   🔴 Redis          : localhost:6379"
echo ""
echo "📝 Loglar:"
echo "   API      : api-gateway/logs/api-gateway.log"
echo "   Social   : social-media-hub/logs/social-hub.log"
echo "   Website  : ultrarslanoglu-website/logs/website.log"
echo ""
echo "🛑 Durdurmak için: pkill -f 'python main_v2.py' && pkill -f 'npm run dev'"
echo "========================================="

# Keep script running
wait
