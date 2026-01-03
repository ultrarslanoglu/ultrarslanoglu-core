# 🛠️ Altyapı

## 📋 Genel Bakış
Bu klasör, Ultrarslanoglu-Core projesinin teknik altyapısını destekleyen Docker konteynerları, deployment betikleri, CI/CD pipeline'ları ve DevOps araçlarını barındırır.

## 🎯 Amaç
- Tutarlı geliştirme ortamı sağlama (Docker)
- Otomatik deployment ve orchestration
- CI/CD pipeline'ları ile sürekli entegrasyon
- İzleme ve loglama altyapısı
- Güvenlik ve backup sistemleri
- Ölçeklenebilir mimari

## 🏗️ Yapı
```
altyapi/
├── README.md
├── docker/                  # Docker konfigürasyonları
│   ├── README.md
│   ├── docker-compose.yml   # Multi-container setup
│   ├── .env.example         # Environment şablonu
│   ├── mongodb/            # MongoDB konfig
│   ├── redis/              # Redis konfig
│   └── nginx/              # Nginx reverse proxy
├── betikler/               # Otomasyon betikleri
│   ├── README.md
│   ├── setup.sh            # Kurulum beitiği
│   ├── deploy.sh           # Deployment beitiği
│   ├── backup.sh           # Backup beitiği
│   ├── monitor.sh          # İzleme beitiği
│   └── cleanup.sh          # Temizlik beitiği
└── araclar/                # DevOps araçları
    ├── README.md
    ├── ci-cd/              # CI/CD konfig
    ├── monitoring/         # İzleme araçları
    ├── security/           # Güvenlik araçları
    └── testing/            # Test araçları
```

## 🚀 Hızlı Başlangıç

### 1. Docker ile Kurulum
```bash
# .env dosyasını oluştur
cp .env.example .env

# Environment değişkenlerini düzenle
nano .env

# Tüm servisleri başlat
docker-compose up -d

# Servislerin durumunu kontrol et
docker-compose ps

# Logları görüntüle
docker-compose logs -f
```

### 2. Manuel Kurulum
```bash
# Kurulum betinini çalıştır
chmod +x altyapi/betikler/setup.sh
./altyapi/betikler/setup.sh

# Servisleri başlat
chmod +x altyapi/betikler/deploy.sh
./altyapi/betikler/deploy.sh
```

## 📍 Docker Compose Servisleri

### Core Services
```yaml
services:
  mongodb:        # Ana veritabanı
    - Port: 27017
    - Volume: mongodb_data
    - Authentication: enabled
  
  redis:          # Cache ve task queue
    - Port: 6379
    - Volume: redis_data
    - Persistence: AOF
```

### Application Services
```yaml
  gs-ai-editor:              # AI video editörü
    - Port: 5001
    - Depends: mongodb, redis
  
  gs-analytics-dashboard:    # Analitik dashboard
    - Ports: 5002 (Flask), 8501 (Streamlit)
    - Depends: mongodb, redis
  
  gs-automation-tools:       # Otomasyon araçları
    - Port: 5003
    - Celery workers
  
  gs-brand-kit:              # Marka yönetimi
    - Port: 5004
  
  gs-content-scheduler:      # İçerik zamanlama
    - Port: 5005
    - Celery beat scheduler
  
  gs-video-pipeline:         # Video pipeline
    - Port: 5006
    - Celery workers
  
  social-media-hub:          # Sosyal medya hub
    - Port: 3000
    - Node.js application
```

## 🔧 Betikler

### setup.sh - Kurulum
- Python sanal ortam kurulumu
- Gerekli paketlerin yüklenmesi
- MongoDB ve Redis kurulumu
- Environment dosyalarının konfigürasyonu

### deploy.sh - Deployment
- Docker imajlarını build etme
- Konteynerları başlatma
- Health check
- Migrasyonları çalıştırma

### backup.sh - Yedekleme
- MongoDB veritabanı yedeini
- Redis snapshot alma
- Log dosyalarını arşivleme
- Cloud storage'a yükleme

### monitor.sh - İzleme
- Servis sağlık kontrolu
- Resource kullanımı
- Log analizi
- Uyarı sistemleri

### cleanup.sh - Temizlik
- Kullanılmayan Docker imajlarını silme
- Log rotasyonu
- Geçici dosyaları temizleme
- Disk alanı optimizasyonu

## 🔐 Güvenlik

### Environment Variables
```bash
# .env dosyası (asla commit etme!)
GITHUB_TOKEN=ghp_xxxxx
MONGODB_USERNAME=admin
MONGODB_PASSWORD=secure_password
REDIS_PASSWORD=redis_password
```

### Secrets Yönetimi
- Docker secrets kullanımı
- Environment encryption
- API key rotation
- SSL/TLS sertifikaları

## 📊 İzleme ve Loglama

### Loglama Stratejisi
```bash
# Log seviyeleri
- DEBUG: Geliştirme detayları
- INFO: Genel bilgiler
- WARNING: Uyarılar
- ERROR: Hatalar
- CRITICAL: Kritik sorunlar

# Log lokasyonları
- Container logs: docker-compose logs
- Application logs: ./logs/
- System logs: /var/log/
```

### Monitoring Tools
- **Prometheus**: Metrik toplama
- **Grafana**: Görselleştirme
- **ELK Stack**: Log analizi (opsiyonel)
- **Uptime Robot**: Uptime monitoring

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    - Run unit tests
    - Run integration tests
    - Code coverage
  
  build:
    - Build Docker images
    - Push to registry
  
  deploy:
    - Deploy to production
    - Health checks
    - Rollback if failed
```

## 🧪 Test

### Infrastructure Tests
```bash
# Docker container sağlık testi
chmod +x altyapi/araclar/testing/health_check.sh
./altyapi/araclar/testing/health_check.sh

# Network connectivity testi
docker network inspect ultrarslanoglu-network

# Volume integrity testi
docker volume ls
```

## 📦 Backup ve Recovery

### Backup Strategy
- **Daily**: MongoDB incremental backup
- **Weekly**: Full system backup
- **Monthly**: Archive old logs

### Recovery Process
```bash
# MongoDB restore
mongorestore --uri="mongodb://localhost:27017" --archive=backup.archive

# Redis restore
redis-cli --rdb /path/to/dump.rdb
```

## 🌐 Deployment Environments

### Development
```bash
ENV=development
DEBUG=true
LOG_LEVEL=debug
```

### Staging
```bash
ENV=staging
DEBUG=false
LOG_LEVEL=info
```

### Production
```bash
ENV=production
DEBUG=false
LOG_LEVEL=warning
SCALING=auto
```

## 📝 Dokümantasyon
Detaylı altyapı dokümantasyonu: `../dokumanlar/teknik/altyapi.md`

## 🤝 Katkı
Altyapı geliştirmeleri için:
1. Feature branch oluştur
2. Değişiklikleri test et
3. Dokümantasyonu güncelle
4. Pull request aç

## 📞 İletişim
Altyapı sorularınız: [GitHub Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)