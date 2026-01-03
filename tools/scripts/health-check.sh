#!/bin/bash
# ================================================
# Quick System Health Check
# ================================================

echo "🏥 ULTRARSLANOGLU CORE - Sistem Sağlık Kontrolü"
echo "================================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local name=$1
    local url=$2
    local expected=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo -e "✅ ${GREEN}$name${NC} - OK ($response)"
        return 0
    else
        echo -e "❌ ${RED}$name${NC} - FAIL (got: $response, expected: $expected)"
        return 1
    fi
}

echo ""
echo "📊 Docker Servisleri:"
docker compose -f docker-compose.dev.optimized.yml ps 2>/dev/null || echo "Docker Compose çalışmıyor"

echo ""
echo "🔍 Sağlık Kontrolleri:"

check_service "API Gateway" "http://localhost:5000/health" "200"
check_service "Website" "http://localhost:3001" "200"

echo ""
echo "💾 Veritabanı Bağlantıları:"

# MongoDB
if mongosh --quiet --eval "db.adminCommand('ping')" mongodb://admin:ultrarslanoglu2025@localhost:27017/admin 2>/dev/null | grep -q "ok"; then
    echo -e "✅ ${GREEN}MongoDB${NC} - Connected"
else
    echo -e "❌ ${RED}MongoDB${NC} - Connection failed"
fi

# Redis
if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q "PONG"; then
    echo -e "✅ ${GREEN}Redis${NC} - Connected"
else
    echo -e "❌ ${RED}Redis${NC} - Connection failed"
fi

# PostgreSQL
if PGPASSWORD=ultrarslanoglu2025 psql -h localhost -U ultraadmin -d ultrarslanoglu -c "SELECT 1" 2>/dev/null | grep -q "1 row"; then
    echo -e "✅ ${GREEN}PostgreSQL${NC} - Connected"
else
    echo -e "❌ ${RED}PostgreSQL${NC} - Connection failed"
fi

echo ""
echo "📈 Sistem Kaynakları:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')% kullanımda"
echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 " kullanımda)"}')"

echo ""
echo "🐳 Docker Kaynakları:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10

echo ""
echo "================================================"
