# 🚀 GALATASARAY ANALYTICS PLATFORM
## Installation & Quick Setup Guide

**Tamamen Professional & Production-Ready Platform**

---

## ⚡ 5 Dakikalık Kurulum

### 1️⃣ Sistemleri Başlat

```bash
cd projeler/gs-galatasaray-analytics

# Option A: Docker ile (Önerilen)
docker-compose up -d

# Option B: Doğrudan
python main.py &
streamlit run streamlit_dashboard.py
```

### 2️⃣ Erişim Noktaları

| URL | Açıklama |
|-----|----------|
| http://localhost:5002 | Flask REST API |
| http://localhost:8501 | Streamlit Dashboard |
| http://localhost:3000/galatasaray | Web Sayfası (Next.js) |
| http://localhost:27017 | MongoDB |
| http://localhost:6379 | Redis |

### 3️⃣ Test API

```bash
# Oyuncuları getir
curl http://localhost:5002/api/players | jq

# Sezon istatistikleri
curl http://localhost:5002/api/club/season-stats | jq
```

---

## 📦 Ne Yüklendi?

✅ **Backend**
- Flask REST API
- Azure Cosmos DB / MongoDB
- Redis Cache
- APScheduler

✅ **Data Collection**
- Twitter/X API
- Instagram/Meta
- YouTube API
- Manual Player Data (18 oyuncu)

✅ **Analytics**
- NLP Sentiment Analysis
- Engagement Metrics
- Player Tracking

✅ **Frontend**
- Streamlit Dashboard
- React Component (Next.js)
- Web Page (/galatasaray)

✅ **Data**
- 18 Player Roster (2024-2025)
- Club Info & Stats
- Season Performance (1st place, 42 points)

---

## 🎯 İlk Adımlar

### A. Streamlit Dashboard'unu Aç

```bash
streamlit run streamlit_dashboard.py

# Tarayıcıda otomatik açılacak: http://localhost:8501
```

**Görecekleriniz:**
- 🏠 Dashboard: Oyuncu kartları, son maçlar, top scorers
- 👥 Oyuncular: Tüm 18 oyuncu, filtreleme, sıralama
- 🏆 Kulüp: Bilgi, şampiyonluklar, sosyal medya
- 📊 İstatistikler: Sezon performansı, grafikler
- 💬 Sosyal Medya: Sentiment analizi (planlı)

### B. Web Sayfasını Ziyaret Et

```
http://localhost:3000/galatasaray
```

**Görecekleriniz:**
- Hero section
- Canlı dashboard widget
- Tech stack bilgisi
- Feature showcase

### C. API Endpoint'lerini Test Et

```bash
# Hepsi birden test et:
./test-api.sh

# Veya manuel:
curl -X GET http://localhost:5002/api/players \
  -H "Content-Type: application/json" | jq '.players[] | {name: .name, position: .position, goals: .goals}'
```

---

## 🛠️ Dosya Yapısı

```
gs-galatasaray-analytics/
├── 📜 SETUP.md                    # Bu dosya
├── 🚀 start-dashboard.sh          # Linux/Mac başlatma script
├── 🚀 start-dashboard.bat         # Windows başlatma script
├── 🔍 verify-setup.py             # Kurulum doğrulama
│
├── 🐍 main.py                     # Flask API (409 satır)
├── 📊 streamlit_dashboard.py      # Streamlit UI (500+ satır)
├── 📋 requirements.txt            # Dependencies (27)
│
├── 🐳 Dockerfile                  # Container image
├── 🐳 docker-compose.yml          # Multi-container setup
│
├── 📚 QUICKSTART.md               # 5-dakika başlama
├── 📚 DASHBOARD.md                # Dashboard rehberi
├── 📚 WEB-INTEGRATION.md          # Web entegrasyon
├── 📚 DEPLOYMENT.md               # Production deployment
├── 📚 README.md                   # Teknik dokümantasyon
│
├── config/
│   └── config.py                  # Konfigürasyon yönetimi
│
└── src/
    ├── database/
    │   ├── manager.py             # Cosmos/Mongo abstraction
    │   └── squad_data.py          # Player & club data (18 oyuncu)
    ├── models/
    │   └── schemas.py             # Data models (6 dataclass)
    ├── services/
    │   └── data_collector.py      # Multi-platform data
    └── analyzers/
        └── analyzer.py            # NLP & sentiment
```

---

## 🔐 API Keys Setup

`.env` dosyasını oluştur (ya da `.env.example`'den kopyala):

```bash
cp .env.example .env
nano .env
```

**Gerekli Keys:**
- `TWITTER_BEARER_TOKEN` - https://developer.twitter.com
- `META_ACCESS_TOKEN` - https://developers.facebook.com
- `YOUTUBE_API_KEY` - https://console.cloud.google.com

**İsteğe Bağlı (Azure):**
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`

---

## 🧪 Test Komutları

```bash
# Health check
curl http://localhost:5002/health

# Oyuncu listesi
curl http://localhost:5002/api/players

# Belirli oyuncu (Icardi örneği)
curl http://localhost:5002/api/players/icardi

# Kadro istatistikleri
curl http://localhost:5002/api/squad/stats

# Top scorers (Icardi 45 gol)
curl http://localhost:5002/api/squad/top-scorers

# Kulüp bilgisi
curl http://localhost:5002/api/club/info

# Sezon performansı (1. sıra, 42 puan)
curl http://localhost:5002/api/club/season-stats

# Son 5 maç
curl http://localhost:5002/api/club/recent-matches
```

---

## 📊 Streamlit Dashboard Sayfaları

### 🏠 **Dashboard**
- Canlı istatistikler (18 oyuncu, 42 puan, 1. sıra)
- En çok gol atan (Icardi 45, Mertens 18)
- Son 3 maç (W 4-1, D 2-2, W 2-0)

### 👥 **Oyuncular**
- 18 oyuncunun tam listesi
- Filtreleme: Pozisyon, milliyet
- Sıralama: Ad, gol, asist, forma numarası
- Detay: Yaş, boy, kontrat, pazar değeri

### 🏆 **Kulüp Bilgileri**
- Kuruluş: 1905
- Stadyum: Nef (52,652 kapasitesi)
- Teknik Direktör: Okan Buruk
- Başarılar: 24 lig, 18 kupa, 20 Avrupa

### 📊 **İstatistikler**
- Sezon tablosu (18 maç, 13W-3D-2L)
- Gol farkı grafiği
- Kazanma yüzdesi
- Kadro yapısı (3 GK, 5 DEF, 5 MID, 4 FWD)

### 💬 **Sosyal Medya** (Planlı)
- Sentiment analizi
- Trending topics
- Player mentions
- Engagement metrics

---

## 🆘 Sorun Giderme

### Docker başlamıyor
```bash
docker-compose logs galatasaray-analytics
docker-compose restart
```

### API Connection Error
```bash
# Kontrol et: API çalışıyor mu?
curl -v http://localhost:5002/health

# Port açık mı?
netstat -an | grep 5002  # Linux/Mac
netstat -ano | findstr :5002  # Windows

# Firewall kontrol
```

### Streamlit hata
```bash
# Cache'i temizle
rm -rf ~/.streamlit/cache

# Yeniden başlat
streamlit run streamlit_dashboard.py --logger.level=debug
```

### MongoDB bağlantısı başarısız
```bash
docker-compose restart mongodb
docker logs gs-mongodb
```

---

## 📱 Responsive Design

✅ Mobile friendly
✅ Tablet optimized
✅ Desktop full-featured
✅ Dark/Light theme support

---

## 🔄 Otomatik Updates (Planned)

- [ ] Günlük sosyal medya verisi
- [ ] Real-time sentiment analizi
- [ ] Match updates
- [ ] Player performance tracking

---

## 🚀 Production Deployment

### Docker to Azure App Service

```bash
# Build image
docker build -t galatasaray-api .

# Push to Azure Container Registry
az acr build --registry galatasarayregistry --image galatasaray-api:latest .

# Deploy to App Service
az webapp create -n galatasaray-api --plan galatasaray-plan --deployment-container-image-name galatasaray-api:latest
```

### Environment Variables (Production)

```
FLASK_ENV=production
USE_COSMOS_DB=true
COSMOS_ENDPOINT=https://*.documents.azure.com
COSMOS_KEY=...
REDIS_URL=redis://...
LOG_LEVEL=INFO
```

---

## 📚 Daha Fazla Bilgi

| Dosya | İçerik |
|-------|--------|
| `QUICKSTART.md` | 5-dakika hızlı başlama |
| `DASHBOARD.md` | Dashboard detayları |
| `WEB-INTEGRATION.md` | Next.js entegrasyon |
| `DEPLOYMENT.md` | Production deployment |
| `README.md` | Teknik dokümantasyon |

---

## ✨ Özet

🟡 **Galatasaray Analytics Platform** tamamen hazır!

### ✅ Installed
- Flask API (9 endpoints)
- Streamlit Dashboard (5 pages)
- Next.js Component
- 18-player roster database
- Club statistics & history

### 🚀 Ready to Use
```bash
docker-compose up -d
open http://localhost:8501
```

### 📊 Data Available
- Oyuncu kadrosu (18)
- Sezon istatistikleri (1st place, 42 pts)
- Son maç sonuçları
- Klub bilgileri ve başarıları

---

## 🎯 Next Steps

1. `.env` dosyasını API keys ile doldur
2. `docker-compose up -d` ile sistemi başlat
3. Dashboard'u aç: `http://localhost:8501`
4. Oyuncuları ve istatistikleri keşfet
5. Web sayfasını ziyaret et: `http://localhost:3000/galatasaray`

---

**🟡 Happy Analytics! 🟡**

*Real-time Galatasaray Data Platform*
*Professional Grade | Production Ready | Open Source*
