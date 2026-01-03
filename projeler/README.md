# 🚀 Projeler

## 📋 Genel Bakış
Bu klasör, Ultrarslanoglu-Core altında geliştirilecek alt projeleri barındırır. Her proje, Galatasaray'ın dijital ekosisteminin farklı bir yönünü ele alır ve bağımsız olarak geliştirilir ancak entegre şekilde çalışır.

## 🎯 Proje Listesi

### 1. 🎬 **gs-ai-editor**
**AI-Destekli Video Editör**
- **Amaç**: Yapay zeka ile video düzenleme ve optimizasyon
- **Teknoloji**: Flask, PyTorch, OpenCV, MoviePy
- **Özellikler**:
  - Otomatik sahne tespiti
  - AI-powered edit suggestions
  - Platform-specific optimization
  - Text overlay ve efektler
- **Port**: 5001
- **Status**: ✅ Tamamlandı

### 2. 📊 **gs-analytics-dashboard**
**Analitik ve İçgörü Dashboard**
- **Amaç**: Sosyal medya performans analizi ve raporlama
- **Teknoloji**: Flask, Streamlit, Plotly, Pandas
- **Özellikler**:
  - Real-time metrics dashboard
  - AI-generated insights
  - Trend prediction
  - Custom reports
- **Ports**: 5002 (Flask), 8501 (Streamlit)
- **Status**: ✅ Tamamlandı

### 3. 🤖 **gs-automation-tools**
**Sosyal Medya Otomasyon**
- **Amaç**: Sosyal medya görevlerini otomatikleştirme
- **Teknoloji**: Flask, Celery, Selenium, Instagram/TikTok APIs
- **Özellikler**:
  - Otomatik Instagram paylaşımı
  - Content scraping
  - Batch posting
  - Performance monitoring
- **Port**: 5003
- **Status**: ✅ Tamamlandı

### 4. 🎨 **gs-brand-kit**
**Marka Kimliği Yönetimi**
- **Amaç**: Galatasaray brand assets ve guidelines
- **Teknoloji**: Flask, Pillow, ColorThief
- **Özellikler**:
  - Color palette management
  - Brand guidelines
  - Design templates
  - Asset library
- **Port**: 5004
- **Status**: ✅ Tamamlandı

### 5. 📅 **gs-content-scheduler**
**İçerik Planlama ve Zamanlama**
- **Amaç**: Multi-platform content scheduling
- **Teknoloji**: Flask, Celery Beat, APScheduler
- **Özellikler**:
  - Content calendar
  - Scheduled posting
  - Multi-platform support
  - Performance analytics
- **Port**: 5005
- **Status**: ✅ Tamamlandı

### 6. 📹 **gs-video-pipeline**
**Video İşleme Pipeline**
- **Amaç**: Büyük ölçekli video işleme ve optimizasyon
- **Teknoloji**: Flask, FFmpeg, Celery, AWS/Azure
- **Özellikler**:
  - Automatic transcoding
  - Quality optimization
  - Cloud storage integration
  - Batch processing
- **Port**: 5006
- **Status**: ✅ Tamamlandı

### 7. 🌐 **social-media-hub**
**Meta Webhook ve Sosyal Medya Integration**
- **Amaç**: Meta (Facebook/Instagram) API integration
- **Teknoloji**: Node.js, Express, MongoDB
- **Özellikler**:
  - Webhook handling
  - Event processing
  - API integrations
  - Data persistence
- **Port**: 3000
- **Status**: ✅ Meta webhook tamamlandı

## 🏗️ Proje Yapısı

Her proje şu standart yapıya sahiptir:

```
proje-adı/
├── README.md                 # Proje dokümantasyonu
├── main.py                   # Ana Flask uygulaması
├── __init__.py              # Python paketi
├── config.json              # Konfigürasyon
├── gereksinimler.txt        # Python dependencies
├── Dockerfile               # Docker image tanımı
├── kaynak/                  # Kaynak kodları
│   ├── __init__.py
│   ├── models.py           # Veri modelleri
│   ├── services.py         # Business logic
│   ├── utils.py            # Yardımcı fonksiyonlar
│   └── database.py         # DB operations
├── testler/                 # Test dosyaları
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_api.py
│   └── fixtures/
├── dokumanlar/              # Proje dokumentasyonu
│   └── README.md
└── logs/                    # Uygulama logları
```

## 🚀 Hızlı Başlangıç

### Yerel Geliştirme
```bash
# Python venv oluştur
python -m venv venv
source venv/bin/activate  # Linux/Mac
# veya
venv\Scripts\activate  # Windows

# Gerekli paketleri yükle
pip install -r projeler/gs-ai-editor/gereksinimler.txt

# Uygulamayı başlat
cd projeler/gs-ai-editor
python main.py
```

### Docker ile
```bash
# Tüm servisleri başlat
docker-compose up

# Belirli bir servisi başlat
docker-compose up gs-ai-editor

# Logları görüntüle
docker-compose logs -f gs-ai-editor
```

## 📦 Bağımlılıklar

### Ortak Bağımlılıklar
- **Web**: Flask 3.0+, Flask-CORS 4.0+
- **Database**: PyMongo 4.6+, MongoDB 7.0+
- **Cache**: Redis 7.0+, redis-py 5.0+
- **Async**: Celery 5.3+
- **AI**: azure-ai-inference 1.0.0b1+
- **Logging**: Loguru 0.7+
- **Environment**: python-dotenv

### Proje-Spesifik Bağımlılıklar
Her projenin kendi `gereksinimler.txt` dosyasında tanımlı:
- **gs-ai-editor**: opencv-python, moviepy, torch, transformers
- **gs-analytics-dashboard**: pandas, plotly, streamlit, matplotlib
- **gs-automation-tools**: selenium, instagrapi, tweepy, beautifulsoup4
- **gs-brand-kit**: pillow, colorthief, svglib, reportlab
- **gs-content-scheduler**: apscheduler, schedule, celery, redis
- **gs-video-pipeline**: moviepy, boto3, azure-storage-blob, ffmpeg-python

## 🧪 Test

### Unit Tests
```bash
# Belirli bir projenin testlerini çalıştır
pytest projeler/gs-ai-editor/testler/

# Coverage raporu
pytest --cov=projeler/gs-ai-editor/kaynak
```

### Integration Tests
```bash
# API testleri
pytest projeler/gs-ai-editor/testler/test_api.py

# Database testleri
pytest projeler/gs-ai-editor/testler/test_database.py
```

### Health Checks
```bash
# Tüm servisleri kontrol et
curl http://localhost:5001/health  # AI Editor
curl http://localhost:5002/health  # Analytics
curl http://localhost:5003/health  # Automation
curl http://localhost:5004/health  # Brand Kit
curl http://localhost:5005/health  # Scheduler
curl http://localhost:5006/health  # Pipeline
curl http://localhost:3000/health  # Social Media Hub
```

## 🔄 Aralarındaki Entegrasyon

```
┌─────────────────────────────────────────────┐
│         Social Media Hub (Node.js)           │
│     Meta Webhook & Platform Handling       │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Scheduler │ │ Automation │ │ Analytics  │
│   (5005)   │ │    (5003)   │ │   (5002)   │
└────┬───────┘ └────┬───────┘ └────┬───────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ AI Editor  │ │  Brand Kit │ │  Pipeline  │
│   (5001)   │ │   (5004)   │ │   (5006)   │
└────────────┘ └────────────┘ └────────────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
           ┌────────┴────────┐
           │                 │
           ▼                 ▼
       ┌────────┐        ┌────────┐
       │ MongoDB│        │ Redis  │
       │  (27017)       │ (6379) │
       └────────┘        └────────┘
```

## 📋 Geliştirme Takvimi

- **Q1 2025**: Marka temeli ve temel projeler (✅ TAMAMLANDI)
- **Q2 2025**: İçerik sistemi ve platform entegrasyonları
- **Q3 2025**: AI entegrasyonları ve gelişmiş özellikler
- **Q4 2025**: Ölçeklendirme ve optimizasyon
- **2026**: Büyüme ve global genişleme

## 🤝 Katkı

Yeni proje eklemek veya mevcut projeleri geliştirmek için:

1. İlgili proje klasöründe branch oluştur
2. Değişiklikleri yap
3. Testler ekle
4. Dokümantasyonu güncelle
5. Pull request aç

## 📚 Dokümantasyon

- **Genel**: [README.md](../README.md)
- **Teknik**: [dokumanlar/teknik/](../dokumanlar/teknik/)
- **Strateji**: [dokumanlar/strateji/](../dokumanlar/strateji/)
- **Altyapı**: [altyapi/README.md](../altyapi/README.md)

## 📞 İletişim

Proje ile ilgili sorular: [GitHub Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)

## 📄 Lisans

MIT License - Detaylar için [LICENSE](../LICENSE) dosyasına bakın