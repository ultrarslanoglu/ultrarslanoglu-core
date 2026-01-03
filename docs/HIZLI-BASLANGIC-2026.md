# ================================================
# ULTRARSLANOGLU CORE - Hızlı Başlangıç Rehberi
# Tarih: 3 Ocak 2026
# Ubuntu 24.04 WSL2 için optimize edilmiştir
# ================================================

## 🎯 Sistem Durumu

✅ **Kurulu Olanlar:**
- Ubuntu 24.04.3 LTS (WSL2)
- Docker 28.2.2 + Docker Compose v2
- Python 3.13.11 (Miniconda)
- Node.js v24.12.0
- PostgreSQL 16 (Native)
- MongoDB 7.0 (Kurulu ama repo sorunu var)
- Ollama (Gemma3:4b, EmbeddingGemma:300m)
- PyTorch (CUDA 13.0)
- TensorFlow

## 🚀 Hızlı Başlangıç

### Seçenek 1: Docker ile Tam Sistem (Önerilen)

```bash
# Interaktif menü ile başlat
./dev-start.sh

# Veya direkt komut
docker compose -f docker-compose.dev.optimized.yml up -d

# Durumu kontrol et
docker compose -f docker-compose.dev.optimized.yml ps

# Health check
./health-check.sh
```

### Seçenek 2: Sadece Veritabanları (Native Geliştirme)

```bash
# Sadece veritabanlarını başlat
docker compose -f docker-compose.dev.optimized.yml up -d mongodb redis postgres

# Native environment ayarla
source setup-native.sh

# API'yi başlat
cd api-gateway && python main.py

# Website'ı başlat (başka terminal)
cd ultrarslanoglu-website && npm run dev
```

### Seçenek 3: Tam Native (Veritabanları zaten çalışıyorsa)

```bash
# Environment ayarla
source setup-native.sh

# Servisleri başlat
cd api-gateway && python main.py &
cd ultrarslanoglu-website && npm run dev &
```

## 📍 Erişim Noktaları

| Servis | URL | Açıklama |
|--------|-----|----------|
| API Gateway | http://localhost:5000 | Backend API |
| Website | http://localhost:3001 | Next.js Frontend |
| MongoDB | mongodb://localhost:27017 | NoSQL Database |
| PostgreSQL | postgresql://localhost:5432 | SQL Database |
| Redis | redis://localhost:6379 | Cache & Queue |
| Mongo Express | http://localhost:8081 | MongoDB GUI |
| Redis Commander | http://localhost:8082 | Redis GUI |

## 🔑 Varsayılan Kimlik Bilgileri

### MongoDB
```
Username: admin
Password: ultrarslanoglu2025
Database: ultrarslanoglu
URI: mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin
```

### PostgreSQL
```
Username: ultraadmin
Password: ultrarslanoglu2025
Database: ultrarslanoglu
URI: postgresql://ultraadmin:ultrarslanoglu2025@localhost:5432/ultrarslanoglu
```

### Redis
```
Host: localhost
Port: 6379
Password: (yok)
URI: redis://localhost:6379/0
```

## 🛠️ Yararlı Komutlar

### Docker Yönetimi

```bash
# Tüm servisleri başlat
docker compose -f docker-compose.dev.optimized.yml up -d

# Belirli servisi başlat
docker compose -f docker-compose.dev.optimized.yml up -d api-gateway

# Logları görüntüle
docker compose -f docker-compose.dev.optimized.yml logs -f api-gateway

# Servisleri durdur
docker compose -f docker-compose.dev.optimized.yml down

# Temizlik (volumes dahil)
docker compose -f docker-compose.dev.optimized.yml down -v

# Monitoring araçlarını başlat
docker compose -f docker-compose.dev.optimized.yml --profile monitoring up -d

# Container'a gir
docker exec -it dev-api-gateway bash
```

### Database Yönetimi

```bash
# MongoDB'ye bağlan
mongosh mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin

# PostgreSQL'e bağlan
PGPASSWORD=ultrarslanoglu2025 psql -h localhost -U ultraadmin -d ultrarslanoglu

# Redis'e bağlan
redis-cli -h localhost -p 6379

# Database backup
docker exec dev-mongodb mongodump --uri="mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin" --out=/backup
```

### Development Workflows

```bash
# API'yi rebuild et
docker compose -f docker-compose.dev.optimized.yml build api-gateway
docker compose -f docker-compose.dev.optimized.yml up -d api-gateway

# Python dependencies güncelle
docker exec dev-api-gateway pip install <paket-adı>

# Node dependencies güncelle
docker exec dev-website npm install <paket-adı>

# Veritabanını sıfırla
docker compose -f docker-compose.dev.optimized.yml down -v
docker compose -f docker-compose.dev.optimized.yml up -d mongodb
```

## 🐛 Sorun Giderme

### Docker başlatılamıyor
```bash
sudo systemctl restart docker
sudo usermod -aG docker $USER
newgrp docker
```

### Port kullanımda
```bash
# Hangi process kullanıyor?
sudo lsof -i :5000
sudo lsof -i :3001
sudo lsof -i :27017

# Process'i öldür
sudo kill -9 <PID>
```

### Veritabanı bağlantı hatası
```bash
# Container'ın çalıştığını kontrol et
docker ps | grep mongodb

# Logları kontrol et
docker logs dev-mongodb

# Health check
docker exec dev-mongodb mongosh --eval "db.adminCommand('ping')"
```

### Disk alanı dolu
```bash
# Kullanılmayan container'ları temizle
docker system prune -a

# Kullanılmayan volume'ları temizle
docker volume prune

# Kullanılmayan image'ları temizle
docker image prune -a
```

## ⚡ Performans İpuçları

1. **WSL2 Optimizasyonu**: `WSL2-OPTIMIZATION.txt` dosyasındaki ayarları uygula
2. **BuildKit Kullan**: Docker build sırasında `DOCKER_BUILDKIT=1` kullan
3. **Volume Mounting**: Büyük node_modules klasörlerini volume olarak mount et
4. **Resource Limits**: Docker Compose'da her servis için memory/cpu limiti belirle
5. **Hot Reload**: Development dockerfile'lar volume mount ile hot reload destekler

## 📊 Monitoring

```bash
# Real-time stats
docker stats

# System durumu
./health-check.sh

# Disk kullanımı
docker system df

# Network inspect
docker network inspect ultrarslanoglu-dev-network
```

## 🔐 Güvenlik Notları

1. `.env` dosyasını **asla** commit etme
2. Production'da tüm şifreleri değiştir
3. API key'leri environment variable olarak sakla
4. JWT_SECRET'i güçlü bir değer yap
5. CORS ayarlarını production için sıkılaştır

## 📚 Proje Yapısı

```
ultrarslanoglu-core/
├── api-gateway/              # Flask API + Celery
│   ├── src/                  # Kaynak kodlar
│   ├── Dockerfile           # Production
│   ├── Dockerfile.dev       # Development (hot reload)
│   └── requirements.txt     # Python dependencies
├── ultrarslanoglu-website/  # Next.js Website
│   ├── app/                 # Next.js 14 App Router
│   ├── Dockerfile.dev       # Development
│   └── package.json
├── social-media-hub/        # Social Media Manager
├── docker-compose.yml       # Production config
├── docker-compose.dev.optimized.yml  # Dev config (optimized)
├── dev-start.sh            # Interactive dev starter
├── health-check.sh         # Health check script
├── setup-native.sh         # Native development helper
└── .env                    # Environment variables

```

## 🎓 Sonraki Adımlar

1. ✅ Docker kurulumu tamamlandı
2. ✅ Development environment hazır
3. ⏭️ API endpoint'lerini test et
4. ⏭️ Frontend-backend entegrasyonunu kontrol et
5. ⏭️ Celery worker'ları test et
6. ⏭️ Monitoring dashboard'u kur
7. ⏭️ Unit testleri yaz
8. ⏭️ CI/CD pipeline kur

## 📞 Hızlı Yardım

```bash
# Sistem durumu
./health-check.sh

# Interaktif menü
./dev-start.sh

# Her şeyi yeniden başlat
docker compose -f docker-compose.dev.optimized.yml down -v && \
docker compose -f docker-compose.dev.optimized.yml up -d

# Logları takip et
docker compose -f docker-compose.dev.optimized.yml logs -f
```

---

**Not**: Bu rehber WSL2 Ubuntu 24.04 ortamı için optimize edilmiştir. Native Linux veya macOS için bazı komutlar değişiklik gösterebilir.
