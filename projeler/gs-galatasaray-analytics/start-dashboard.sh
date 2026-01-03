#!/bin/bash
# Galatasaray Analytics Platform - Quick Start Script
# Kullanım: ./start-dashboard.sh

set -e

echo "🟡 Galatasaray Analytics Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Renk tanımları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kontrol: Docker kurulu mu?
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker kurulu değil. Lütfen Docker'ı kurun.${NC}"
    exit 1
fi

# Kontrol: Docker Compose kurulu mu?
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose kurulu değil. Lütfen kurun.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker ve Docker Compose bulundu${NC}"
echo ""

# Seçenek sorgusu
echo "Ne yapmak istiyorsunuz?"
echo "1) 🚀 Docker ile tüm sistemi başlat"
echo "2) 🛑 Tüm servisleri durdur"
echo "3) 🔄 Servisleri yeniden başlat"
echo "4) 📊 Streamlit dashboard'u açı"
echo "5) 🌐 Web sayfasını açı"
echo "6) 🔍 Logları izle"
echo "7) 🧹 Konteynerileri temizle"
echo "8) ❌ Çık"
echo ""
read -p "Seçim yapın (1-8): " choice

case $choice in
    1)
        echo -e "${BLUE}→ Docker ile sistem başlatılıyor...${NC}"
        
        # .env kontrolü
        if [ ! -f .env ]; then
            echo -e "${YELLOW}⚠️ .env dosyası bulunamadı. .env.example'den kopyalanıyor...${NC}"
            cp .env.example .env
            echo -e "${YELLOW}📝 Lütfen .env dosyasını düzenleyip API keys'leri girin!${NC}"
            echo -e "${YELLOW}   nano .env${NC}"
            exit 1
        fi
        
        # Servisleri başlat
        docker-compose up -d
        
        echo ""
        echo -e "${GREEN}✅ Sistemler başlatıldı!${NC}"
        echo ""
        echo "🔗 Erişim Noktaları:"
        echo -e "   ${BLUE}Flask API:${NC}     http://localhost:5002"
        echo -e "   ${BLUE}Streamlit:${NC}     http://localhost:8501"
        echo -e "   ${BLUE}MongoDB:${NC}       localhost:27017"
        echo -e "   ${BLUE}Redis:${NC}         localhost:6379"
        echo ""
        echo "Kontrol et: docker ps"
        ;;
        
    2)
        echo -e "${BLUE}→ Tüm servisleri durdurma...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Servisleri durduruldu${NC}"
        ;;
        
    3)
        echo -e "${BLUE}→ Servisleri yeniden başlatma...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Servisleri yeniden başlatıldı${NC}"
        ;;
        
    4)
        echo -e "${BLUE}→ Streamlit dashboard'unu açıyor...${NC}"
        sleep 2
        
        # OS'ye göre browser aç
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open http://localhost:8501
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            open http://localhost:8501
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            start http://localhost:8501
        fi
        
        echo -e "${GREEN}✅ Dashboard açılıyor: http://localhost:8501${NC}"
        ;;
        
    5)
        echo -e "${BLUE}→ Web sayfasını açıyor...${NC}"
        sleep 2
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open http://localhost:3000/galatasaray
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            open http://localhost:3000/galatasaray
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
            start http://localhost:3000/galatasaray
        fi
        
        echo -e "${GREEN}✅ Web sayfası açılıyor: http://localhost:3000/galatasaray${NC}"
        ;;
        
    6)
        echo -e "${BLUE}→ Flask API logları (Ctrl+C ile çık)...${NC}"
        docker-compose logs -f galatasaray-analytics
        ;;
        
    7)
        echo -e "${YELLOW}⚠️ Tüm konteynerler, volumeler ve network'ü kaldıracak...${NC}"
        read -p "Devam etmek istiyor musunuz? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            docker-compose down -v
            echo -e "${GREEN}✅ Kaynaklar temizlendi${NC}"
        else
            echo "İşlem iptal edildi"
        fi
        ;;
        
    8)
        echo "Çıkılıyor..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Geçersiz seçim!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "🟡 Keyifli analiz'ler! 🟡"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
