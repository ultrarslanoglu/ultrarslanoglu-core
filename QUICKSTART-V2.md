# 🚀 Quick Start Guide - API Gateway v2.0

## Hızlı Başlangıç

### 1. Docker ile Başlat (En Kolay)

```bash
# Tüm sistemi başlat
docker-compose -f docker-compose.new.yml up -d

# Logları izle
docker-compose -f docker-compose.new.yml logs -f api-gateway

# Durum kontrol
docker-compose -f docker-compose.new.yml ps
```

### 2. Health Check

```bash
# PowerShell
Invoke-RestMethod -Uri http://localhost:5000/health

# curl
curl http://localhost:5000/health

# Browser
http://localhost:5000/health
```

Beklenen çıktı:
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

### 3. Test Çalıştır

```bash
# Python test
python test-api-gateway.py

# PowerShell test
.\test-api-gateway.ps1

# Bash test (Linux/Mac)
bash test-api-gateway.sh
```

## 📡 Servisler ve Portlar

| Servis | Port | URL |
|--------|------|-----|
| API Gateway | 5000 | http://localhost:5000 |
| Social Media Hub | 3000 | http://localhost:3000 |
| Website | 3001 | http://localhost:3001 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |

## 🎯 Örnek API Çağrıları

### Video Upload

```powershell
# PowerShell
$formData = @{
    video = Get-Item ".\test-video.mp4"
}
Invoke-RestMethod -Uri "http://localhost:5000/api/video/upload" `
    -Method Post -Form $formData
```

### Analytics Metric

```powershell
# PowerShell
$body = @{
    platform = "instagram"
    metric_type = "views"
    value = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/analytics/metrics" `
    -Method Post -Body $body -ContentType "application/json"
```

### AI Video Analysis

```powershell
# PowerShell
$body = @{
    video_id = "123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/ai-editor/analyze" `
    -Method Post -Body $body -ContentType "application/json"
```

## 🛠️ Development Mode

### Local çalıştırma (Docker olmadan)

```bash
# 1. MongoDB ve Redis'i Docker'da başlat
docker-compose -f docker-compose.new.yml up -d mongodb redis

# 2. Virtual environment oluştur
cd api-gateway
python -m venv venv

# 3. Activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# 4. Bağımlılıkları yükle
pip install -r requirements.txt

# 5. Environment variables ayarla
cp .env.example .env
# .env dosyasını düzenle

# 6. Uygulamayı çalıştır
python main.py
```

## 🔧 Environment Variables

`.env` dosyası oluşturun:

```env
MONGODB_URI=mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin
REDIS_URL=redis://localhost:6379/0
GITHUB_TOKEN=your_github_token_here
JWT_SECRET=change_this_to_random_secret
PORT=5000
```

## 📊 Monitoring

### Logs

```bash
# Tüm servislerin logları
docker-compose -f docker-compose.new.yml logs -f

# Sadece API Gateway
docker-compose -f docker-compose.new.yml logs -f api-gateway

# Son 100 satır
docker-compose -f docker-compose.new.yml logs --tail=100 api-gateway
```

### Container Durumu

```bash
# Tüm container'ları listele
docker-compose -f docker-compose.new.yml ps

# Resource kullanımı
docker stats ultrarslanoglu-api-gateway
```

## 🆘 Sorun Giderme

### Port çakışması

```powershell
# Port 5000'i kullanan process'i bul
Get-NetTCPConnection -LocalPort 5000

# Process'i durdur
Stop-Process -Id <PID>
```

### Container yeniden başlat

```bash
# Tek container
docker-compose -f docker-compose.new.yml restart api-gateway

# Tüm sistem
docker-compose -f docker-compose.new.yml restart
```

### Logları temizle

```bash
# Container'ları durdur ve sil
docker-compose -f docker-compose.new.yml down

# Volume'leri de sil (dikkatli!)
docker-compose -f docker-compose.new.yml down -v

# Yeniden başlat
docker-compose -f docker-compose.new.yml up -d
```

### MongoDB bağlantı problemi

```bash
# MongoDB'yi test et
docker exec ultrarslanoglu-mongodb mongosh --eval "db.adminCommand('ping')"

# MongoDB loglarını kontrol et
docker logs ultrarslanoglu-mongodb
```

## 📚 Daha Fazla Bilgi

- [API Gateway README](api-gateway/README.md) - Detaylı API dokümantasyonu
- [ARCHITECTURE-V2.md](ARCHITECTURE-V2.md) - Mimari detayları
- [MIGRATION-COMPLETE.md](MIGRATION-COMPLETE.md) - Migration özeti

## 🎉 Başarılı!

Sistem çalışıyorsa şunları göreceksiniz:

✅ http://localhost:5000/health → {"status": "healthy"}  
✅ http://localhost:3000 → Social Media Hub  
✅ http://localhost:3001 → Website  

Mutlu kodlamalar! 🚀
