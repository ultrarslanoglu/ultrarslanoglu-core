# 📊 Galatasaray Analytics Platform

**Professional Real-Time Data Collection, Analysis, and Reporting System**

🚀 Galatasaray hakkında canlı sosyal medya verilerini çekerek yapay zeka ile analiz eden entegre platform.

## 🎯 Özellikler

### 📱 Multi-Platform Veri Çekme
- **Twitter/X** - Son gönderiler, eğilimler
- **Instagram** - Hashtag araması, medya analizi
- **YouTube** - Video keşfi, trend analiz
- **TikTok** - Video eğilimleri (kısıtlı API)
- **Web Scraping** - Dinamik içerik çekme

### 🧠 Yapay Zeka Analizleri
- **Duygusallık Analizi** (Türkçe optimized)
  - Pozitif/Negatif/Nötr sınıflandırması
  - Emoji analizi
  - Bağlamsal duygu tarama
  
- **Etkileşim Analizi**
  - Engagement rate hesaplaması
  - Trend tespiti
  - Performans metrikleri
  
- **Oyuncu Performans Analizi**
  - Oyuncu bahsedilişleri
  - Sentiment takibi per-oyuncu
  - Performans değerlendirmesi
  
- **Takım Performansı**
  - Maç analizi
  - Aferin/uyarı takibi
  - Oyuncu ratings

### 📊 Raporlama
- **Günlük Raporlar** - Günlük metrik özeti
- **Haftalık Raporlar** - Hafta boyutu analiz
- **Özel Raporlar** - Custom metrik kombinasyonları
- **Visual Insights** - Interaktif görseller

### 🗄️ Veritabanı Seçenekleri
- **Azure Cosmos DB** - Global scale, low-latency ✨ (Recommended)
- **MongoDB** - Fallback, local development
- Automatic schema management
- Index optimization

## 🏗️ Mimari

```
gs-galatasaray-analytics/
├── config/
│   └── config.py           # Merkezi konfigürasyon
├── src/
│   ├── database/
│   │   └── manager.py      # Cosmos DB + MongoDB yöneticisi
│   ├── models/
│   │   └── schemas.py      # Veri modelleri
│   ├── services/
│   │   └── data_collector.py   # API istemcileri
│   ├── analyzers/
│   │   └── analyzer.py     # NLP & Analiz engine
│   └── __init__.py
├── main.py                 # Flask API
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
└── README.md              # Bu dosya
```

## 🚀 Kurulum

### Gereksinimler
- Python 3.9+
- pip / conda
- API Keys (Twitter, Instagram, YouTube)
- Azure Cosmos DB veya MongoDB

### 1. Proje İndir
```bash
cd projeler/gs-galatasaray-analytics
```

### 2. Environment Setup
```bash
# .env dosyası oluştur
cp .env.example .env

# API Keys'i güncelle
# TWITTER_BEARER_TOKEN=your-token-here
# META_ACCESS_TOKEN=your-token-here
# YOUTUBE_API_KEY=your-key-here
```

### 3. Dependencies Yükle
```bash
pip install -r requirements.txt
```

### 4. Veritabanını Ayarla

**Azure Cosmos DB ile:**
```bash
# Azure CLI'de Cosmos DB account oluştur
az cosmosdb create --name galatasaray-db --resource-group your-rg

# Connection string'i .env'e ekle
COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_KEY=your-key
USE_COSMOS_DB=true
```

**MongoDB ile (Development):**
```bash
# MongoDB çalıştır (Docker)
docker run -d -p 27017:27017 mongo:latest

# .env'de
MONGODB_URI=mongodb://localhost:27017/galatasaray_analytics
USE_COSMOS_DB=false
```

### 5. Uygulamayı Başlat
```bash
python main.py

# Output:
# 🚀 Galatasaray Analytics Platform başlatıldı
# 📊 Veritabanı Türü: cosmos
# 🔑 API Sağlayıcıları: ['twitter', 'instagram', 'youtube']
# 🌐 Flask API başlatıldı: http://0.0.0.0:5002
```

## 📡 API Endpoints

### Sağlık Kontrol
```bash
GET /health
```

### Veri Çekme
```bash
POST /api/collect
Body: {
  "keywords": ["Galatasaray", "GS"],
  "platforms": ["twitter", "instagram"],
  "limit": 100
}

Response: {
  "success": true,
  "count": 45,
  "posts": [...]
}
```

### Analiz
```bash
POST /api/analyze
Body: {
  "posts": [...]
}

Response: {
  "analysis_results": {
    "posts_with_sentiment": [...],
    "engagement_metrics": {...},
    "player_mentions": [...],
    "key_insights": [...]
  }
}
```

### Tek Shot (Çek + Analiz)
```bash
POST /api/collect-and-analyze
Body: {
  "keywords": ["Galatasaray"],
  "platforms": ["twitter"]
}
```

### Rapor Oluştur
```bash
POST /api/reports
Body: {
  "type": "daily",
  "days_back": 1
}
```

### Raporları Getir
```bash
GET /api/reports?type=daily&limit=10
```

### İçgörüleri Getir
```bash
GET /api/insights?days=7
```

### Metrikleri Getir
```bash
GET /api/metrics?days=7&platform=twitter
```

## 🔧 Konfigürasyon

[config/config.py](config/config.py) dosyasından:

```python
# Veritabanı
USE_COSMOS_DB = True  # Azure Cosmos DB kullan
COSMOS_ENDPOINT = "https://..."
COSMOS_KEY = "..."

# API Keys
TWITTER_BEARER_TOKEN = "..."
META_ACCESS_TOKEN = "..."
YOUTUBE_API_KEY = "..."

# Analiz
DATA_RETENTION_DAYS = 365
SENTIMENT_ANALYSIS_ENABLED = True

# Scheduler
SCHEDULER_ENABLED = True
SCHEDULER_INTERVAL_MINUTES = 15
```

## 📊 Veri Modelleri

### SocialMediaPost
```python
{
  "id": "uuid",
  "external_id": "twitter_id",
  "platform": "twitter",
  "author_name": "john_doe",
  "content": "Galatasaray harika!",
  "likes": 150,
  "comments": 23,
  "sentiment": "positive",
  "sentiment_score": 0.85,
  "hashtags": ["#Galatasaray", "#GS"],
  "created_at": "2025-12-28T10:30:00Z"
}
```

### SentimentAnalysis
```python
{
  "post_id": "...",
  "sentiment": "positive",
  "confidence": 0.92,
  "score": 0.85,
  "emotions": {"joy": 0.8, "pride": 0.7},
  "topics": ["football", "celebration"]
}
```

### EngagementMetrics
```python
{
  "platform": "twitter",
  "date": "2025-12-28",
  "total_posts": 150,
  "total_engagement": 5000,
  "average_engagement_rate": 0.15,
  "average_sentiment_score": 0.65,
  "sentiment_distribution": {"positive": 100, "negative": 30, "neutral": 20}
}
```

### PlayerMention
```python
{
  "player_name": "Mauro Icardi",
  "position": "CF",
  "sentiment": "positive",
  "sentiment_score": 0.75,
  "performance_mention": true,
  "context": "Icardi çok iyi oynadı!"
}
```

## 🧠 Sentiment Analysis Engine

Türkçe optimized duygusallık analizi:

- **Kelime Tabanlı**: 100+ Türkçe sentiment kelime listesi
- **Emoji Tabanlı**: 😊😍🔥👏 vb. emoji tespiti
- **Bağlamsal**: Oyuncu, performans, sakatlık vb. bağlamlar
- **Hibrit Model**: Çoklu kaynak kombinasyonu

Örnek Skorlama:
```
"Galatasaray harika!" → positive (0.85)
"Berbat oyun" → negative (-0.75)
"Maçı izledim" → neutral (0.05)
```

## 📈 Yapay Zeka Özellikler

- **NLP Processing** - Metin analizi, tokenization
- **Sentiment Classification** - Duygusallık sınıflandırması
- **Entity Recognition** - Oyuncu, takım, rakip tespit
- **Trend Detection** - Eğilim ve pattern tespiti
- **Anomaly Detection** - Anormal aktivite alertleri

## 🔐 Güvenlik

- ✅ Environment variables ile API keys şifrelemesi
- ✅ Rate limiting ile DDoS koruması
- ✅ CORS yapılandırması
- ✅ Input validation
- ✅ Error handling ve logging

## 📝 Logging

```
logs/
├── galatasaray_analytics.log      # Detaylı log
├── galatasaray_analytics.1.log    # Rotated backups
└── ...
```

Log Seviyeleri:
- `DEBUG` - Detaylı debug bilgisi
- `INFO` - Temel bilgiler
- `WARNING` - Uyarılar
- `ERROR` - Hatalar

## 🧪 Test Etme

### Manual Test
```bash
# Sağlık kontrolü
curl http://localhost:5002/health

# Veri çek
curl -X POST http://localhost:5002/api/collect \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["Galatasaray"], "platforms": ["twitter"]}'
```

### Docker ile Test
```bash
docker build -t gs-analytics .
docker run -p 5002:5002 --env-file .env gs-analytics
```

## 🚀 Üretim Dağıtımı

### Azure App Service
```bash
az webapp create --resource-group myRG --plan myPlan --name gs-analytics

# .env dosyasını App Settings'e ekle
az webapp config appsettings set --resource-group myRG --name gs-analytics \
  --settings COSMOS_ENDPOINT=... COSMOS_KEY=...
```

### Docker & ACI
```bash
docker build -t gs-analytics:latest .
az acr build --registry myacr --image gs-analytics:latest .
az container create --resource-group myRG --name gs-analytics-container \
  --image myacr.azurecr.io/gs-analytics:latest
```

## 📚 Kaynaklar

- [Azure Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Meta Graph API](https://developers.facebook.com/docs/graph-api)
- [YouTube Data API](https://developers.google.com/youtube/v3)

## 🤝 Katkı

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 Lisans

MIT License - see [LICENSE](../../LICENSE) file

## 👨‍💼 Geliştirici

**Ultrarslanoglu**
- 🌐 [Website](https://ultrarslanoglu.dev)
- 📧 Email: contact@ultrarslanoglu.dev
- 💼 LinkedIn: [Profile](https://linkedin.com/in/ultrarslanoglu)

---

**Made with ❤️ for Galatasaray Fans**

<div align="center">

![Galatasaray](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Galatasaray_SK.svg/200px-Galatasaray_SK.svg.png)

**Cimbom** 🟡🔴

</div>
