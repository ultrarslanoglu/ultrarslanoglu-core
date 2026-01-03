# 🚀 Ultrarslanoglu API Gateway

**Versiyon 2.0.0** - Unified Microservices Architecture

## 📋 Genel Bakış

Ultrarslanoglu API Gateway, tüm mikroservisleri tek bir çatı altında toplayan merkezi API platformudur. 7 ayrı mikroservis yerine tek bir entegre sistem sunar.

## 🏗️ Mimari

```
api-gateway/
├── main.py                 # Ana Flask uygulaması
├── config.json             # Konfigürasyon
├── requirements.txt        # Bağımlılıklar
├── Dockerfile             # Container image
├── src/
│   ├── modules/           # İş modülleri
│   │   ├── video.py       # Video pipeline
│   │   ├── ai_editor.py   # AI editor
│   │   ├── analytics.py   # Analytics
│   │   ├── automation.py  # Automation
│   │   ├── brand_kit.py   # Brand kit
│   │   └── scheduler.py   # Content scheduler
│   └── shared/            # Ortak kod
│       ├── database.py    # MongoDB client
│       ├── auth.py        # JWT authentication
│       ├── github_models.py  # AI client
│       ├── celery_app.py  # Task queue
│       └── middleware.py  # Request/response processing
└── logs/                  # Log dosyaları
```

## 🎯 Özellikler

### Modüller

1. **Video Pipeline** (`/api/video`)
   - Video yükleme ve işleme
   - Video transcode
   - Thumbnail oluşturma
   - İşleme kuyruğu yönetimi

2. **AI Editor** (`/api/ai-editor`)
   - Video içerik analizi
   - Otomatik düzenleme önerileri
   - AI destekli video editing
   - Altyazı oluşturma

3. **Analytics** (`/api/analytics`)
   - Metrik toplama ve analiz
   - AI ile içgörü üretimi
   - Rapor oluşturma
   - Dashboard yönetimi

4. **Automation** (`/api/automation`)
   - Görev otomasyonu
   - Workflow yönetimi
   - Zamanlanmış işlemler

5. **Brand Kit** (`/api/brand`)
   - Şablon yönetimi
   - Marka renkleri ve fontları
   - Asset kütüphanesi

6. **Content Scheduler** (`/api/scheduler`)
   - İçerik planlama
   - Zamanlama ve yayınlama
   - Platform entegrasyonu

### Teknik Özellikler

- ✅ **JWT Authentication** - Güvenli kimlik doğrulama
- ✅ **Role-based Access Control** - Rol bazlı yetkilendirme
- ✅ **Background Jobs** - Celery ile asenkron işlemler
- ✅ **AI Integration** - GitHub Models API
- ✅ **MongoDB** - Esnek veri depolama
- ✅ **Redis** - Cache ve task queue
- ✅ **Docker Ready** - Container-based deployment

## 🚀 Kurulum

### 1. Environment Değişkenleri

```bash
cp .env.example .env
# .env dosyasını düzenleyin
```

Gerekli değişkenler:
```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/ultrarslanoglu?authSource=admin
REDIS_URL=redis://redis:6379/0
GITHUB_TOKEN=your_github_token
JWT_SECRET=your_secret_key
PORT=5000
```

### 2. Docker ile Çalıştırma

```bash
# Build
docker build -t ultrarslanoglu-api-gateway .

# Run
docker run -d \
  -p 5000:5000 \
  --env-file .env \
  --name api-gateway \
  ultrarslanoglu-api-gateway
```

### 3. Docker Compose ile (Önerilen)

```bash
cd ..
docker-compose -f docker-compose.new.yml up -d
```

### 4. Local Development

```bash
# Virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Bağımlılıklar
pip install -r requirements.txt

# Çalıştır
python main.py
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "Ultrarslanoglu API Gateway",
  "version": "2.0.0",
  "modules": {
    "video": "ready",
    "ai_editor": "ready",
    "analytics": "ready",
    "automation": "ready",
    "brand_kit": "ready",
    "scheduler": "ready"
  }
}
```

### Video Pipeline

```bash
# Video yükle
POST /api/video/upload
Content-Type: multipart/form-data
Body: video file

# Video işle
POST /api/video/{video_id}/process
Body: {"operations": ["trim", "resize"]}

# Transcode
POST /api/video/{video_id}/transcode
Body: {"format": "mp4"}

# Durum sorgula
GET /api/video/{video_id}/status
```

### AI Editor

```bash
# Video analizi
POST /api/ai-editor/analyze
Body: {"video_id": "123"}

# Düzenleme önerileri
POST /api/ai-editor/suggest-edits
Body: {"video_id": "123", "edit_type": "highlight"}

# Otomatik düzenleme
POST /api/ai-editor/auto-edit
Body: {"video_id": "123", "style": "dynamic"}
```

### Analytics

```bash
# Metrik kaydet
POST /api/analytics/metrics
Body: {"platform": "instagram", "metric_type": "views", "value": 1000}

# Metrikleri getir
GET /api/analytics/metrics?platform=instagram&days=7

# İçgörü üret
POST /api/analytics/insights/generate
Body: {"data_summary": {...}, "insight_type": "engagement"}
```

### Authentication

```bash
# Token ile istek
GET /api/video/queue
Authorization: Bearer <your_jwt_token>
```

## 🔐 Authentication

### Token Oluşturma

```python
from src.shared.auth import generate_token

token = generate_token(
    user_id="user_123",
    email="user@example.com",
    role="editor"
)
```

### Protected Endpoint Örneği

```python
from flask import Blueprint
from src.shared.auth import require_auth, require_role

bp = Blueprint('example', __name__)

@bp.route('/admin-only')
@require_auth
@require_role('admin')
def admin_endpoint():
    return {"message": "Admin access granted"}
```

## 🔄 Background Jobs

### Celery Task Örneği

```python
from src.shared.celery_app import celery

@celery.task
def process_video(video_id):
    # Video processing logic
    return {"video_id": video_id, "status": "completed"}

# Task başlat
task = process_video.delay("video_123")
```

## 📊 Monitoring

### Logs

```bash
# Container logs
docker logs -f ultrarslanoglu-api-gateway

# Log dosyaları
tail -f logs/api_gateway.log
```

### Metrics

```bash
# Health check
curl http://localhost:5000/health

# Module status
curl http://localhost:5000/api/info
```

## 🧪 Testing

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/

# API tests
curl http://localhost:5000/health
```

## 🔧 Configuration

`config.json` dosyasından yapılandırma:

```json
{
  "port": 5000,
  "debug": false,
  "database": {
    "type": "mongodb",
    "connection_string": "${MONGODB_URI}"
  },
  "modules": {
    "video": {"enabled": true},
    "ai_editor": {"enabled": true},
    "analytics": {"enabled": true}
  }
}
```

## 📦 Dependencies

Core:
- Flask 3.0.0
- PyMongo 4.6.1
- Redis 5.0.1
- Celery 5.3.4
- PyJWT 2.8.0

AI/ML:
- OpenAI 1.12.0
- Pandas 2.2.0

Video:
- OpenCV 4.9.0
- MoviePy 1.0.3

## 🌐 Production Deployment

### Gunicorn

```bash
gunicorn --bind 0.0.0.0:5000 \
         --workers 4 \
         --timeout 120 \
         main:app
```

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
GITHUB_TOKEN=...
JWT_SECRET=strong_random_secret
```

## 🆘 Troubleshooting

### MongoDB Connection Error

```bash
# Check MongoDB
docker logs ultrarslanoglu-mongodb

# Test connection
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://...').admin.command('ping'))"
```

### Redis Connection Error

```bash
# Check Redis
docker logs ultrarslanoglu-redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### Module Import Error

```bash
# Ensure PYTHONPATH
export PYTHONPATH=/app:$PYTHONPATH
```

## 📝 License

MIT License - See LICENSE file

## 👥 Contributors

- Ultrarslanoglu Team

## 📞 Support

- GitHub Issues: https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues
- Email: info@ultrarslanoglu.com
