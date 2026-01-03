#!/bin/bash
# ================================================
# ULTRARSLANOGLU CORE - Development Starter
# Optimized for WSL2 Ubuntu 24.04
# ================================================

set -e

echo "🚀 ULTRARSLANOGLU CORE - Development Environment"
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker bulunamadı!${NC}"
    echo "Docker'ı kurmak için:"
    echo "  sudo apt install -y docker.io docker-compose-v2"
    exit 1
fi

# Check Docker service
if ! sudo systemctl is-active --quiet docker; then
    echo -e "${YELLOW}⚠️  Docker servisi başlatılıyor...${NC}"
    sudo systemctl start docker
fi

# Check .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, .env.example'dan kopyalanıyor...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
fi

# Function to show menu
show_menu() {
    echo ""
    echo "Ne yapmak istersiniz?"
    echo "1) 🐳 Docker ile Tam Sistem (Önerilen)"
    echo "2) ⚡ Sadece Veritabanları (Native geliştirme için)"
    echo "3) 🔍 Sistem durumunu görüntüle"
    echo "4) 🛑 Tüm servisleri durdur"
    echo "5) 🗑️  Tüm container'ları ve volume'ları temizle"
    echo "6) 📊 Monitoring araçlarını aç (Mongo Express + Redis Commander)"
    echo "7) 📝 Logları görüntüle"
    echo "0) 🚪 Çıkış"
    echo ""
}

# Start full system
start_full() {
    echo -e "${GREEN}🐳 Tam sistem başlatılıyor...${NC}"
    docker compose -f docker-compose.dev.optimized.yml up -d
    echo ""
    echo -e "${GREEN}✅ Sistem başlatıldı!${NC}"
    echo ""
    echo "📍 Erişim Noktaları:"
    echo "   • API Gateway:  http://localhost:5000"
    echo "   • Website:      http://localhost:3001"
    echo "   • MongoDB:      mongodb://localhost:27017"
    echo "   • Redis:        redis://localhost:6379"
    echo "   • PostgreSQL:   postgresql://localhost:5432"
    echo ""
    echo "🔍 Durumu kontrol etmek için: docker compose -f docker-compose.dev.optimized.yml ps"
}

# Start only databases
start_databases() {
    echo -e "${GREEN}⚡ Sadece veritabanları başlatılıyor...${NC}"
    docker compose -f docker-compose.dev.optimized.yml up -d mongodb redis postgres
    echo ""
    echo -e "${GREEN}✅ Veritabanları başlatıldı!${NC}"
    echo ""
    echo "📍 Bağlantı Bilgileri:"
    echo "   • MongoDB:    mongodb://admin:ultrarslanoglu2025@localhost:27017"
    echo "   • Redis:      redis://localhost:6379"
    echo "   • PostgreSQL: postgresql://ultraadmin:ultrarslanoglu2025@localhost:5432/ultrarslanoglu"
}

# Show status
show_status() {
    echo -e "${GREEN}📊 Sistem Durumu:${NC}"
    echo ""
    docker compose -f docker-compose.dev.optimized.yml ps
    echo ""
    echo "💾 Volume Kullanımı:"
    docker volume ls | grep ultrarslanoglu
}

# Stop all
stop_all() {
    echo -e "${YELLOW}🛑 Tüm servisler durduruluyor...${NC}"
    docker compose -f docker-compose.dev.optimized.yml down
    echo -e "${GREEN}✅ Servisler durduruldu${NC}"
}

# Clean all
clean_all() {
    echo -e "${RED}⚠️  Bu işlem tüm container'ları, network'leri ve volume'ları silecek!${NC}"
    read -p "Devam etmek istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker compose -f docker-compose.dev.optimized.yml down -v
        echo -e "${GREEN}✅ Temizleme tamamlandı${NC}"
    fi
}

# Start monitoring
start_monitoring() {
    echo -e "${GREEN}📊 Monitoring araçları başlatılıyor...${NC}"
    docker compose -f docker-compose.dev.optimized.yml --profile monitoring up -d
    echo ""
    echo -e "${GREEN}✅ Monitoring araçları başlatıldı!${NC}"
    echo ""
    echo "📍 Erişim:"
    echo "   • Mongo Express:     http://localhost:8081"
    echo "   • Redis Commander:   http://localhost:8082"
}

# Show logs
show_logs() {
    echo "Hangi servisin loglarını görmek istersiniz?"
    echo "1) API Gateway"
    echo "2) Website"
    echo "3) MongoDB"
    echo "4) Redis"
    echo "5) Celery Worker"
    echo "6) Tüm servisler"
    read -p "Seçim (1-6): " choice
    
    case $choice in
        1) docker compose -f docker-compose.dev.optimized.yml logs -f api-gateway ;;
        2) docker compose -f docker-compose.dev.optimized.yml logs -f website ;;
        3) docker compose -f docker-compose.dev.optimized.yml logs -f mongodb ;;
        4) docker compose -f docker-compose.dev.optimized.yml logs -f redis ;;
        5) docker compose -f docker-compose.dev.optimized.yml logs -f celery-worker ;;
        6) docker compose -f docker-compose.dev.optimized.yml logs -f ;;
        *) echo "Geçersiz seçim" ;;
    esac
}

# Main loop
while true; do
    show_menu
    read -p "Seçiminiz (0-7): " choice
    
    case $choice in
        1) start_full ;;
        2) start_databases ;;
        3) show_status ;;
        4) stop_all ;;
        5) clean_all ;;
        6) start_monitoring ;;
        7) show_logs ;;
        0) 
            echo -e "${GREEN}👋 Görüşürüz!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Geçersiz seçim${NC}"
            ;;
    esac
    
    echo ""
    read -p "Ana menüye dönmek için Enter'a basın..."
done
