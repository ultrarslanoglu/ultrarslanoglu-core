# 🐳 Ultrarslanoglu Core - Docker Kurulum ve Çalıştırma Rehberi

## 📋 İçindekiler
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Kurulum](#kurulum)
- [Servisler](#servisler)
- [Kullanım](#kullanım)
- [Sorun Giderme](#sorun-giderme)

## 🚀 Hızlı Başlangıç

### 1. Environment Dosyasını Hazırlayın
```powershell
# .env.example dosyasını kopyalayın
Copy-Item .env.example .env

# Gerekli API anahtarlarını düzenleyin
notepad .env
```

### 2. Docker Container'ları Başlatın
```powershell
# Tüm servisleri başlat (development mode)
docker-compose up -d

# Logları takip et
docker-compose logs -f

# Sadece belirli servisleri başlat
docker-compose up -d mongodb redis api-gateway
```

### 3. Servislere Erişim
- **Website**: http://localhost:3001
- **Social Media Hub**: http://localhost:3000
- **API Gateway**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## 💻 Sistem Gereksinimleri

### Minimum
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: 8GB
- **Disk**: 20GB boş alan

### Önerilen
- **RAM**: 16GB+
- **CPU**: 4 Core+
- **Disk**: 50GB SSD

## 📦 Kurulum

### Windows

1. **Docker Desktop Kurulumu**
```powershell
# Chocolatey ile kurulum
choco install docker-desktop

# veya Docker Desktop'u indirin:
# https://www.docker.com/products/docker-desktop
```

2. **WSL2 Kurulumu** (Önerilen)
```powershell
wsl --install
wsl --set-default-version 2
```

3. **Projeyi Klonlayın**
```powershell
git clone https://github.com/ultrarslanoglu/ultrarslanoglu-core.git
cd ultrarslanoglu-core
```

4. **Environment Ayarları**
```powershell
# .env dosyasını oluşturun
Copy-Item .env.example .env

# API anahtarlarınızı ekleyin
notepad .env
```

### Linux / macOS

```bash
# Docker kurulumu (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker.io docker-compose

# macOS için
brew install docker docker-compose

# Projeyi klonla
git clone https://github.com/ultrarslanoglu/ultrarslanoglu-core.git
cd ultrarslanoglu-core

# Environment ayarları
cp .env.example .env
nano .env
```

## 🔧 Servisler

### Core Infrastructure
| Servis | Port | Açıklama |
|--------|------|----------|
| MongoDB | 27017 | Ana veritabanı |
| Redis | 6379 | Cache ve queue sistemi |

### API Services
| Servis | Port | Açıklama |
|--------|------|----------|
| API Gateway | 5000 | Ana API giriş noktası |
| GS AI Editor | 5001 | Yapay zeka editör |
| GS Analytics Dashboard | 5002 | Analiz paneli |
| GS Automation Tools | 5003 | Otomasyon araçları |
| GS Brand Kit | 5004 | Marka kiti yönetimi |
| GS Content Scheduler | 5005 | İçerik planlayıcı |
| GS Video Pipeline | 5006 | Video işleme |

### Web Platforms
| Servis | Port | Açıklama |
|--------|------|----------|
| Ultrarslanoglu Website | 3001 | Ana website (Next.js) |
| Social Media Hub | 3000 | Sosyal medya yönetimi |

### Reverse Proxy
| Servis | Port | Açıklama |
|--------|------|----------|
| Nginx | 80, 443 | Reverse proxy (production) |

## 🎮 Kullanım

### Temel Komutlar

```powershell
# Tüm servisleri başlat
docker-compose up -d

# Servisleri durdur
docker-compose stop

# Servisleri tamamen kaldır
docker-compose down

# Volume'ları da sil (dikkatli!)
docker-compose down -v

# Servisleri yeniden başlat
docker-compose restart

# Belirli bir servisi yeniden başlat
docker-compose restart api-gateway

# Logları görüntüle
docker-compose logs -f

# Belirli servis logları
docker-compose logs -f api-gateway social-media-hub

# Container içine gir
docker-compose exec api-gateway bash
docker-compose exec mongodb mongosh

# Servis durumunu kontrol et
docker-compose ps

# Kaynak kullanımı
docker stats
```

### Build ve Update

```powershell
# Yeniden build et
docker-compose build

# Build ederken cache kullanma
docker-compose build --no-cache

# Belirli servisi build et
docker-compose build api-gateway

# Build et ve başlat
docker-compose up -d --build

# Sadece değişen servisleri güncelle
docker-compose up -d --build --force-recreate api-gateway
```

### Development Mode

```powershell
# Hot reload ile geliştirme
docker-compose up -d

# Servislere kod değişiklikleriniz otomatik yansıyacak
# Node.js servisleri: nodemon ile hot reload
# Next.js: next dev ile hot reload
# Python servisleri: volume mount ile kod senkronizasyonu
```

### Production Mode

```powershell
# Nginx ile production
docker-compose --profile production up -d

# Production build
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🔍 Health Check

```powershell
# Tüm servislerin health durumu
docker-compose ps

# API Gateway health
curl http://localhost:5000/health

# Website health
curl http://localhost:3001/api/health

# Social Media Hub health
curl http://localhost:3000/api/health

# MongoDB bağlantı testi
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Redis bağlantı testi
docker-compose exec redis redis-cli ping
```

## 🔧 Veritabanı Yönetimi

### MongoDB

```powershell
# MongoDB shell'e bağlan
docker-compose exec mongodb mongosh -u admin -p ultrarslanoglu2025

# Veritabanlarını listele
docker-compose exec mongodb mongosh -u admin -p ultrarslanoglu2025 --eval "show dbs"

# Backup al
docker-compose exec mongodb mongodump --out=/data/backup

# Restore yap
docker-compose exec mongodb mongorestore /data/backup
```

### Redis

```powershell
# Redis CLI
docker-compose exec redis redis-cli

# Redis bilgileri
docker-compose exec redis redis-cli INFO

# Cache temizle
docker-compose exec redis redis-cli FLUSHALL
```

## 🐛 Sorun Giderme

### Container Başlamıyor

```powershell
# Logları kontrol et
docker-compose logs service-name

# Container durumunu kontrol et
docker-compose ps

# Yeniden başlat
docker-compose restart service-name

# Tamamen yeniden oluştur
docker-compose up -d --force-recreate service-name
```

### Port Çakışması

```powershell
# Port kullanımını kontrol et
netstat -ano | findstr :3000

# Çakışan portu değiştirin (docker-compose.yml içinde)
ports:
  - "3002:3000"  # 3002 kullan
```

### Disk Alanı Yetersiz

```powershell
# Kullanılmayan image'ları temizle
docker image prune -a

# Kullanılmayan volume'ları temizle
docker volume prune

# Kullanılmayan container'ları temizle
docker container prune

# Tümünü temizle
docker system prune -a --volumes
```

### MongoDB Bağlantı Hatası

```powershell
# MongoDB container'ının çalıştığını kontrol et
docker-compose ps mongodb

# MongoDB loglarını kontrol et
docker-compose logs mongodb

# Health check
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### Network Sorunları

```powershell
# Network'ü yeniden oluştur
docker-compose down
docker network prune
docker-compose up -d

# Network'ü kontrol et
docker network ls
docker network inspect ultrarslanoglu-network
```

## 📊 Monitoring

```powershell
# Kaynak kullanımı (real-time)
docker stats

# Container detayları
docker-compose top

# Disk kullanımı
docker system df

# Belirli container'ın detayları
docker inspect ultrarslanoglu-api-gateway
```

## 🔄 Backup & Restore

### Full Backup

```powershell
# Volumes backup
docker run --rm -v ultrarslanoglu-core_mongodb_data:/data -v ${PWD}/backup:/backup alpine tar czf /backup/mongodb-backup.tar.gz /data

# Configuration backup
Copy-Item .env backup/.env.backup
Copy-Item docker-compose.yml backup/docker-compose.yml.backup
```

### Restore

```powershell
# Volumes restore
docker run --rm -v ultrarslanoglu-core_mongodb_data:/data -v ${PWD}/backup:/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /
```

## 📝 Environment Variables

Tüm environment değişkenleri için [.env.example](.env.example) dosyasına bakın.

Kritik değişkenler:
- `MONGO_PASSWORD`: MongoDB root şifresi
- `JWT_SECRET`: JWT token şifresi
- `GITHUB_TOKEN`: GitHub API token
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`: Facebook OAuth
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`: TikTok OAuth

## 🆘 Destek

Sorun yaşıyorsanız:
1. [Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues) sayfasını kontrol edin
2. Yeni issue açın
3. Logları ekleyin: `docker-compose logs > logs.txt`

## 📚 Ek Kaynaklar

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Redis Docker](https://hub.docker.com/_/redis)
- [Nginx Docker](https://hub.docker.com/_/nginx)

## ⚡ Hızlı Test

```powershell
# Tüm servisleri test et
.\TEST-DOCKER.ps1

# Manuel test
curl http://localhost:3001         # Website
curl http://localhost:3000/api/health  # Social Media Hub
curl http://localhost:5000/health      # API Gateway
```

---

**Not**: Production ortamına geçmeden önce `.env` dosyasındaki tüm secret'ları değiştirin!
