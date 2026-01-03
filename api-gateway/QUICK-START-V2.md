# ⚡ QUICK START - Ultrarslanoglu API Gateway v2.0

**5 dakikada API'yi çalıştırmak**

---

## 1️⃣ SETUP (2 dakika)

### Seçenek A: Docker ile (RECOMMENDED)

```bash
# Docker Desktop'ın çalıştığından emin ol
docker --version

# Production environment başlat
docker-compose -f docker-compose.prod.yml up -d

# Kontrol et
docker ps
# 6 container göreceksin: mongodb, redis, celery, flower, api-gateway, nginx
```

### Seçenek B: Local Python ile

```bash
# Requirements kur
cd api-gateway
pip install -r requirements.txt

# .env file kopyala
cp .env.example .env

# Services başlat (ayrı terminallerde)
# Terminal 1 - MongoDB
mongod

# Terminal 2 - Redis
redis-server

# Terminal 3 - Celery Worker
celery -A src.shared.celery_app worker --loglevel=info

# Terminal 4 - API
python main_v2.py
```

---

## 2️⃣ VERIFY (1 dakika)

```bash
# API çalışıyor mu?
curl http://localhost:5000/health

# Çıktı görmelisin:
# {
#   "success": true,
#   "data": {
#     "status": "healthy",
#     "service": "Ultrarslanoglu API Gateway",
#     "version": "2.0.0",
#     ...
#   }
# }

# API versiyonu kontrol et
curl http://localhost:5000/api/version

# Docker'ı kullanıyorsan, Flower (Celery monitoring) ekle
# http://localhost:5555
```

---

## 3️⃣ FIRST API CALLS (2 dakika)

### Health Check
```bash
curl -X GET http://localhost:5000/health
```

### Get API Version
```bash
curl -X GET http://localhost:5000/api/version
```

### Get System Status
```bash
curl -X GET http://localhost:5000/status
```

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

### User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'
```

---

## 🔐 Configuration

### Email Service Seç (REQUIRED)

Seçeneklerden birini seç:

#### Option 1: SMTP (Gmail)
```bash
# Gmail App Password kur
# https://myaccount.google.com/apppasswords

# .env update et
SMTP_ENABLED=True
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Option 2: SendGrid (Recommended)
```bash
# https://sendgrid.com/free adresinden hesap aç
# API Key al

# .env update et
SENDGRID_ENABLED=True
SENDGRID_API_KEY=SG.your-api-key
```

#### Option 3: AWS SES
```bash
# AWS Console'dan SES kaynağını setup et
# Access key ve secret al

# .env update et
AWS_SES_ENABLED=True
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_SES_REGION=eu-west-1
```

### GitHub Token Kur (REQUIRED for AI)
```bash
# https://github.com/settings/personal-access-tokens ziyaret et
# Yeni token oluştur (scope: read:packages)

# .env update et
GITHUB_TOKEN=github_pat_your-token-here
```

### AWS S3 Kur (OPTIONAL - Video Storage)
```bash
# AWS S3 bucket oluştur
# IAM user oluştur (s3 permissions ile)

# .env update et
AWS_S3_ENABLED=True
AWS_S3_BUCKET=ultrarslanoglu-videos
AWS_S3_ACCESS_KEY_ID=your-key
AWS_S3_SECRET_ACCESS_KEY=your-secret
```

---

## 🧪 TESTING

### Unit Tests Çalıştır
```bash
cd api-gateway
python test_comprehensive.py
```

### Specific Test Modülü
```bash
# Sadece health checks
python -m unittest test_comprehensive.HealthCheckTests

# Sadece authentication
python -m unittest test_comprehensive.AuthenticationTests

# Sadece validation
python -m unittest test_comprehensive.ValidationTests
```

### Integration Test
```bash
# Full API flow test
python test_api_gateway.py
```

---

## 📊 Monitoring

### API Health Dashboard
```
http://localhost:5000/health
http://localhost:5000/status
http://localhost:5000/api/version
```

### Celery Task Monitoring (Flower)
```
http://localhost:5555
```

### Logs View
```bash
# API gateway logs
tail -f logs/api_gateway.log

# Error logs
tail -f logs/errors.log

# Performance logs
tail -f logs/performance.log

# Audit trail
tail -f logs/audit.log
```

### Database Inspection
```bash
# MongoDB shell
mongo localhost:27017/ultrarslanoglu

# List collections
show collections

# Count users
db.users.countDocuments()

# Count videos
db.videos.countDocuments()
```

### Redis Inspection
```bash
# Redis CLI
redis-cli

# Check keys
KEYS *

# Check rate limits
KEYS rate_limit:*

# Monitor real-time
MONITOR
```

---

## 🚀 Module Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Video
```
GET    /api/video/health
POST   /api/video/upload
GET    /api/video
GET    /api/video/<id>
POST   /api/video/<id>/process
POST   /api/video/<id>/transcode
POST   /api/video/<id>/thumbnail
GET    /api/video/<id>/status
DELETE /api/video/<id>
```

### AI Editor
```
GET    /api/ai-editor/health
POST   /api/ai-editor/analyze
POST   /api/ai-editor/enhance
POST   /api/ai-editor/subtitles/generate
GET    /api/ai-editor/analysis/<id>
GET    /api/ai-editor/enhancements/<video-id>
GET    /api/ai-editor/subtitles/<video-id>
```

### Analytics
```
GET    /api/analytics/health
GET    /api/analytics/dashboard
GET    /api/analytics/video/<id>/metrics
POST   /api/analytics/video/<id>/metrics/calculate
GET    /api/analytics/reports
POST   /api/analytics/reports/generate
GET    /api/analytics/reports/<id>
GET    /api/analytics/trending
POST   /api/analytics/events/<video-id>
```

### Automation
```
GET    /api/automation/health
POST   /api/automation/workflows
POST   /api/automation/workflows/<id>/execute
GET    /api/automation/workflows/<id>
POST   /api/automation/tasks
POST   /api/automation/tasks/<id>/execute
GET    /api/automation/tasks
POST   /api/automation/batch
GET    /api/automation/batch/<id>/status
```

---

## 🐛 Troubleshooting

### "Connection refused" MongoDB
```bash
# MongoDB çalışıyor mu kontrol et
ps aux | grep mongod

# Yoksa başlat
mongod --dbpath /data/db
```

### "Connection refused" Redis
```bash
# Redis çalışıyor mu kontrol et
ps aux | grep redis

# Yoksa başlat
redis-server
```

### Port Already in Use
```bash
# 5000 port'u kullanıyorsan ne bulundur
lsof -i :5000

# Başka port kullan
API_PORT=5001 python main_v2.py
```

### Email Test
```bash
# Email config kontrol et
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### Rate Limiting Issue
```bash
# Redis'te rate limits kontrol et
redis-cli
KEYS rate_limit:*
DEL rate_limit:*  # Reset all
```

---

## 📚 Documentation

- **API Docs**: `/api-gateway/API-DOCUMENTATION.md`
- **Implementation**: `/api-gateway/IMPLEMENTATION-SUMMARY-V2.md`
- **Auth Setup**: `/AUTH_SETUP.md`
- **Docker Compose**: `docker-compose.prod.yml`
- **Environment**: `api-gateway/.env.example`

---

## ⚙️ Configuration Files

| File | Amaç |
|------|------|
| `.env` | Environment variables (credentials) |
| `config.json` | API configuration |
| `docker-compose.prod.yml` | Production containers |
| `Dockerfile.optimized` | API gateway image |
| `main_v2.py` | Main application entry point |

---

## 🎯 Next Steps

1. ✅ Email service konfigürasyonunu tamamla
2. ✅ GitHub token'ı ekle
3. ✅ AWS S3 kurulumunu tamamla (isteğe bağlı)
4. ✅ Tests'i çalıştır
5. ✅ API endpoints'leri test et
6. ✅ Frontend'i connect et (Next.js)
7. ✅ Social media webhooks'u setup et
8. ✅ CI/CD pipeline'ı kur

---

## 💡 TIPS

- Docker kullansana: Daha hızlı, daha temiz, prod-like ortam
- Logs'u takip et: `tail -f logs/api_gateway.log`
- Rate limits'i test et: Hızlıca çok request gönder
- Performance'ı monitor et: Flower dashboard'u kullan
- Secrets'i .env'de tut: Asla hard-code etme

---

**API ready? 🚀 Şimdi frontend'i connect et!**

Sorular? Logs'u kontrol et veya GitHub issues aç.
