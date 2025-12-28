# 🎯 GALATASARAY ANALİTİCS PLATFORMU - BAŞLANGIÇ

## ✅ Sistem Kuruldu!

Galatasaray Analytics Platform profesyonel şekilde kuruldu. Aşağıdaki adımları izleyerek başlayın:

---

## 📦 Ne Kuruldı?

### 1. **Veritabanı Yönetimi** (`src/database/manager.py`)
- ✅ Azure Cosmos DB entegrasyonu
- ✅ MongoDB fallback
- ✅ Otomatik schema oluşturma
- ✅ 7 koleksyon: 
  - `social_media_posts` - Sosyal medya gönderileri
  - `sentiment_analysis` - Duygusallık analizi
  - `engagement_metrics` - Etkileşim metrikleri
  - `player_mentions` - Oyuncu bahisleri
  - `team_performance` - Takım performansı
  - `daily_aggregations` - Günlük özet
  - `reports` - Analiz raporları

### 2. **Veri Çekme Servisleri** (`src/services/data_collector.py`)
- ✅ Twitter/X API entegrasyonu
- ✅ Instagram/Meta Graph API
- ✅ YouTube Data API v3
- ✅ TikTok API (kısıtlı)
- ✅ Async/await ile paralel çekme

### 3. **Yapay Zeka Analiz** (`src/analyzers/analyzer.py`)
- ✅ Türkçe optimized sentiment analizi
- ✅ Etkileşim metrik hesaplaması
- ✅ Oyuncu performans analizi
- ✅ Rapor üretimi
- ✅ İçgörü generation

### 4. **Flask REST API** (`main.py`)
- ✅ 10+ endpoint
- ✅ Health checks
- ✅ Real-time data collection
- ✅ Automatic scheduling
- ✅ Rate limiting

---

## 🚀 İlk Çalıştırma - 3 Seçenek

### Seçenek 1: Docker (✨ Önerilen)

```bash
cd projeler/gs-galatasaray-analytics

# API keys'i ekle (isteğe bağlı, test için gerekli değil)
nano .env

# Başlat
docker-compose up -d

# Kontrol et
curl http://localhost:5002/health
```

**Logları İzle:**
```bash
docker logs -f gs-analytics
```

**Dur:**
```bash
docker-compose down
```

---

### Seçenek 2: Python Venv (Manual)

**Windows:**
```bash
cd projeler\gs-galatasaray-analytics

# Setup çalıştır
setup.bat

# Giydir
python main.py
```

**Linux/Mac:**
```bash
cd projeler/gs-galatasaray-analytics

# Setup çalıştır
bash setup.sh

# Giydir
python main.py
```

---

### Seçenek 3: Azure Cloud

Detaylı talimatlar için: [DEPLOYMENT.md](DEPLOYMENT.md)

```bash
az login
az group create --name galatasaray-rg --location eastus
# ... (detaylı adımlar DEPLOYMENT.md'de)
```

---

## 📡 API Test Etme

### 1. Sağlık Kontrolü
```bash
curl http://localhost:5002/health
```

### 2. Mock Veri ile Test (API keys olmadan)
```bash
curl -X POST http://localhost:5002/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "posts": [
      {
        "external_id": "123",
        "platform": "twitter",
        "author_name": "John",
        "content": "Galatasaray harika oynadı! 🔥",
        "created_at": "2025-12-28T10:00:00Z",
        "likes": 100,
        "comments": 20,
        "shares": 5
      }
    ]
  }' | python -m json.tool
```

**Sonuç:**
```json
{
  "analysis_results": {
    "posts_with_sentiment": [
      {
        "sentiment": "positive",
        "score": 0.85,
        "content": "Galatasaray harika oynadı! 🔥"
      }
    ],
    "key_insights": [
      "😊 Pozitif sentiment tespit edildi"
    ]
  }
}
```

### 3. Rapor Oluştur
```bash
curl -X POST http://localhost:5002/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type": "daily"}'
```

### 4. İçgörüleri Al
```bash
curl "http://localhost:5002/api/insights?days=7"
```

---

## 🔑 API Keys Ekleme (Canlı Veri İçin)

### Twitter/X
1. https://developer.twitter.com/en/portal/dashboard adresine git
2. API Key, API Secret ve Bearer Token'ı kopyala
3. `.env` dosyasında güncelle:
```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### Instagram/Meta
1. https://developers.facebook.com/apps/ adresine git
2. Business Account Access Token al
3. `.env`'e ekle:
```env
META_ACCESS_TOKEN=your_token_here
META_BUSINESS_ACCOUNT_ID=your_account_id
```

### YouTube
1. https://console.cloud.google.com/ adresine git
2. YouTube Data API v3'ü enable et
3. API Key oluştur
4. `.env`'e ekle:
```env
YOUTUBE_API_KEY=your_api_key_here
```

---

## 📊 Veritabanını Kontrol Et

### MongoDB Shell'de
```bash
# Container'a gir
docker exec -it gs-mongodb mongosh

# Veri kontrol et
use galatasaray_analytics
db.social_media_posts.findOne()
db.sentiment_analysis.find().limit(5)

# Çık
exit
```

### MongoDB Compass ile (GUI)
1. https://www.mongodb.com/products/compass adresinden indir
2. `mongodb://localhost:27017` adresine bağlan
3. Collections'ı görüntüle

---

## 📁 Dosya Yapısı

```
gs-galatasaray-analytics/
├── config/
│   ├── config.py              # Merkezi konfigürasyon
│   └── __init__.py
│
├── src/
│   ├── database/
│   │   ├── manager.py         # DB yöneticisi
│   │   └── __init__.py
│   │
│   ├── models/
│   │   ├── schemas.py         # Pydantic modelleri
│   │   └── __init__.py
│   │
│   ├── services/
│   │   ├── data_collector.py  # API istemcileri
│   │   └── __init__.py
│   │
│   ├── analyzers/
│   │   ├── analyzer.py        # NLP engine
│   │   └── __init__.py
│   │
│   └── __init__.py
│
├── main.py                    # Flask uygulaması
├── requirements.txt           # Dependencies
├── .env.example              # Template
├── Dockerfile                # Docker image
├── docker-compose.yml        # Compose config
├── setup.sh / setup.bat      # Setup script
│
├── README.md                 # Detaylı doku
├── QUICKSTART.md             # Hızlı başlangıç
├── DEPLOYMENT.md             # Azure deploy
│
└── logs/                     # Log dosyaları
```

---

## 🔄 Otomatik Zamanlama

Sistem her 15 dakikada otomatik olarak:
1. Galatasaray hakkında yeni veriler çeker
2. Duygusallık analizi yapar
3. Etkileşim metriklerini hesaplar
4. Raporlar oluşturur

**Devre dışı bırakmak için** `.env`'de:
```env
SCHEDULER_ENABLED=false
```

---

## 🆘 Yaygın Sorunlar

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "Connection refused"
```bash
docker-compose restart
```

### "API Rate Limited"
```python
# config.py'de artır
RATE_LIMIT_REQUESTS = 200
RATE_LIMIT_PERIOD = 3600
```

### Port 5002 zaten kullanımda
```bash
# .env'de değiştir
PORT=5003
```

---

## 📚 Sonraki Adımlar

### 1. **Dashboard Oluştur**
```bash
pip install streamlit plotly
# streamlit_dashboard.py oluştur
streamlit run streamlit_dashboard.py
```

### 2. **Uyarı Sistemi**
- SMS alerts: Twilio entegrasyonu
- Email alerts: SMTP setup
- Webhook: Slack/Discord

### 3. **Advanced Analytics**
- Predictive modeling
- Anomaly detection
- Clustering analysis

### 4. **Scale-up**
- Kubernetes deployment
- Global replication
- Load balancing

---

## 📖 Döküman Dizini

| Dosya | İçerik |
|-------|--------|
| [README.md](README.md) | Detaylı teknik doku |
| [QUICKSTART.md](QUICKSTART.md) | 5 dakikalık hızlı başlangıç |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Azure deployment talimatları |
| [config/config.py](config/config.py) | Konfigürasyon referansı |

---

## 🎯 Hedefler Tamamlandı

- ✅ Multi-platform veri çekme (Twitter, Instagram, YouTube)
- ✅ Türkçe sentiment analizi
- ✅ Oyuncu performans tracking
- ✅ Gerçek-zamanlı raporlar
- ✅ RESTful API
- ✅ Veritabanı opsiyonları (Cosmos DB + MongoDB)
- ✅ Docker containerization
- ✅ Zamanlı görevler
- ✅ Logging ve monitoring
- ✅ Üretim deployment ready

---

## 💡 İpuçları

1. **Logları İzle:** `docker logs -f gs-analytics | grep "✅"`
2. **Redis Cache:** Redis 6379 portunda çalışıyor
3. **MongoDB Compass:** GUI ile veri kontrol et
4. **API Docs:** [Postman Collection](./postman_collection.json)

---

## 🆘 Yardım Gerekirse

1. Logları kontrol et: `docker logs gs-analytics`
2. README.md'yi oku
3. [config/config.py](config/config.py) kommentlerini gözden geçir
4. DEPLOYMENT.md'deki troubleshooting bölümüne bak

---

**🎉 BAŞARILI! Galatasaray Analytics Platform kuruldu ve çalışmaya hazır!**

🚀 Aşağıdaki komutu çalıştırarak başlayın:

```bash
docker-compose up -d
curl http://localhost:5002/health
```

**Sorular & İdealer:** Issues tab'ında açabilir veya PR gönderebilirsiniz.

---

**Made with ❤️ for Galatasaray** 🟡🔴
