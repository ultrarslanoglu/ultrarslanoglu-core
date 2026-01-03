# 🐳 Docker ile Çalıştırma - Hızlı Başlangıç

## ✅ Hazırlık Tamamlandı!

Projeniz artık tamamen Docker üzerinde çalışacak şekilde yapılandırıldı. Tüm servisler containerize edildi ve aşağıdaki iyileştirmeler yapıldı:

### 🎯 Yapılan İyileştirmeler

#### 1. **Dockerfile'lar**
- ✅ Social Media Hub için Dockerfile oluşturuldu
- ✅ Social Media Hub için Dockerfile.dev (hot reload)
- ✅ API Gateway için .dockerignore eklendi
- ✅ Social Media Hub için .dockerignore eklendi

#### 2. **Docker Compose**
- ✅ Tüm servisler için health check eklendi
- ✅ Servis bağımlılıkları (depends_on) düzgün yapılandırıldı
- ✅ Environment variables centralize edildi
- ✅ Volume yönetimi optimize edildi
- ✅ Network ayarları iyileştirildi (subnet: 172.20.0.0/16)
- ✅ Redis için memory limitleri eklendi

#### 3. **Nginx Reverse Proxy**
- ✅ API Gateway upstream eklendi
- ✅ Load balancing yapılandırıldı
- ✅ Health check endpoint'leri güncellendi
- ✅ Fail-over mekanizması eklendi

#### 4. **Environment Management**
- ✅ Comprehensive .env.example dosyası oluşturuldu
- ✅ Tüm servisler için gerekli değişkenler tanımlandı
- ✅ Production-ready secret yönetimi

#### 5. **Automation Scripts**
- ✅ START-DOCKER.ps1 - Hızlı başlatma script'i
- ✅ TEST-DOCKER.ps1 - Otomatik test script'i
- ✅ DOCKER-GUIDE.md - Detaylı kullanım kılavuzu

## 🚀 Hemen Başla

### 1. İlk Kurulum

```powershell
# 1. Environment dosyasını oluştur
Copy-Item .env.example .env

# 2. .env dosyasını düzenle (API anahtarlarını ekle)
notepad .env

# 3. Servisleri başlat
.\START-DOCKER.ps1
```

### 2. Hızlı Başlatma

```powershell
# Tüm servisleri başlat
.\START-DOCKER.ps1

# Build ile başlat
.\START-DOCKER.ps1 -Build

# Production mode
.\START-DOCKER.ps1 -Production

# Belirli servisi başlat
.\START-DOCKER.ps1 -Service api-gateway
```

### 3. Servisleri Test Et

```powershell
# Otomatik test çalıştır
.\TEST-DOCKER.ps1
```

## 📦 Servis Listesi

### Core Infrastructure
- **MongoDB** (27017) - Ana veritabanı
- **Redis** (6379) - Cache ve queue sistemi

### API Gateway
- **API Gateway** (5000) - Unified microservices entry point

### Galatasaray Projeleri
- **GS AI Editor** (5001) - Yapay zeka editör
- **GS Analytics Dashboard** (5002) - Analiz paneli
- **GS Automation Tools** (5003) - Otomasyon araçları
- **GS Brand Kit** (5004) - Marka kiti
- **GS Content Scheduler** (5005) - İçerik planlayıcı
- **GS Video Pipeline** (5006) - Video işleme

### Web Platforms
- **Ultrarslanoglu Website** (3001) - Ana website (Next.js)
- **Social Media Hub** (3000) - Sosyal medya yönetimi (Node.js)

### Reverse Proxy
- **Nginx** (80, 443) - Production reverse proxy

## 🔧 Temel Komutlar

```powershell
# Başlat
docker-compose up -d

# Durdur
.\START-DOCKER.ps1 -Stop

# Yeniden başlat
docker-compose restart

# Logları görüntüle
docker-compose logs -f

# Belirli servis logları
docker-compose logs -f api-gateway

# Container içine gir
docker-compose exec api-gateway bash

# Durumu kontrol et
docker-compose ps

# Temizlik
.\START-DOCKER.ps1 -Clean
```

## 📊 Servis URL'leri

### Ana Servisler
- Website: http://localhost:3001
- Social Media Hub: http://localhost:3000
- API Gateway: http://localhost:5000

### Galatasaray Servisleri
- AI Editor: http://localhost:5001
- Analytics: http://localhost:5002
- Automation: http://localhost:5003
- Brand Kit: http://localhost:5004
- Scheduler: http://localhost:5005
- Video Pipeline: http://localhost:5006

### Infrastructure
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

## 🔍 Health Check

```powershell
# API Gateway
curl http://localhost:5000/health

# Website
curl http://localhost:3001

# Social Media Hub
curl http://localhost:3000/api/health

# MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker-compose exec redis redis-cli ping
```

## 🐛 Sorun Giderme

### Container başlamıyor?
```powershell
# Logları kontrol et
docker-compose logs service-name

# Yeniden başlat
docker-compose restart service-name
```

### Port çakışması?
```powershell
# Portu değiştir (docker-compose.yml)
ports:
  - "3002:3000"  # 3002 kullan
```

### Disk alanı yetersiz?
```powershell
# Temizlik yap
docker system prune -a
docker volume prune
```

## 📚 Detaylı Dokümantasyon

Detaylı kullanım kılavuzu için: [DOCKER-GUIDE.md](DOCKER-GUIDE.md)

## ⚙️ Önemli Notlar

### Development Mode
- Hot reload aktif (kod değişiklikleri otomatik yansır)
- Volume mount ile kod senkronizasyonu
- Debug modları açık

### Production Mode
```powershell
# Production başlatma
.\START-DOCKER.ps1 -Production

# veya
docker-compose --profile production up -d
```

### Environment Variables
`.env` dosyasındaki kritik değişkenler:
- `MONGO_PASSWORD` - MongoDB şifresi
- `JWT_SECRET` - JWT token şifresi
- `GITHUB_TOKEN` - GitHub API token
- Sosyal medya API anahtarları (Facebook, Google, TikTok, Twitter)

**⚠️ Production'a geçmeden önce tüm secret'ları değiştirin!**

## 🎯 Özellikler

### ✅ Yapılandırılmış
- [x] Health checks (tüm servisler)
- [x] Auto-restart
- [x] Resource limits
- [x] Log management
- [x] Network isolation
- [x] Volume persistence
- [x] Multi-stage builds
- [x] .dockerignore optimization

### 🚀 Hazır
- [x] Development environment
- [x] Production configuration
- [x] Hot reload support
- [x] Automated testing
- [x] Quick start scripts
- [x] Comprehensive documentation

## 📞 Destek

Sorun yaşıyorsanız:
1. [DOCKER-GUIDE.md](DOCKER-GUIDE.md) dosyasını kontrol edin
2. `docker-compose logs <service-name>` ile logları inceleyin
3. `.\TEST-DOCKER.ps1` ile testleri çalıştırın

---

**🎉 Projeniz Docker'da çalışmaya hazır!**

Başlamak için: `.\START-DOCKER.ps1`
