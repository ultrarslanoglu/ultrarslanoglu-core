# 🚀 HIZLI BAŞLANGIÇ - Galatasaray Analytics

## 5 Dakika'da Başlayın

### 1️⃣ Sistemi Başlat (Docker ile - En Kolay)

```bash
cd projeler/gs-galatasaray-analytics

# .env dosyasında API keys'i güncelledikten sonra:
docker-compose up -d

# Kontrol et
curl http://localhost:5002/health
```

**Output:**
```json
{
  "status": "healthy",
  "service": "Galatasaray Analytics Platform",
  "database": "mongodb",
  "collectors_active": ["twitter", "instagram", "youtube"]
}
```

### 2️⃣ Canlı Veri Çek

```bash
curl -X POST http://localhost:5002/api/collect \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Galatasaray", "GS", "#Galatasaray"],
    "platforms": ["twitter"],
    "limit": 50
  }'
```

**Response:** 45 gönderi çekildi ✅

### 3️⃣ Otomatik Analiz Yap

```bash
curl -X POST http://localhost:5002/api/collect-and-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Galatasaray"],
    "platforms": ["twitter", "instagram"]
  }'
```

**Sonuç:**
```json
{
  "data_collected": 95,
  "analysis": {
    "posts_with_sentiment": [
      {
        "sentiment": "positive",
        "score": 0.85,
        "content": "Galatasaray harika oynadı!"
      }
    ],
    "key_insights": [
      "😊 78% pozitif sentiment",
      "⭐ Top oyuncular: Icardi, Mertens, Ziyech"
    ]
  }
}
```

### 4️⃣ Raporlar Oluştur

```bash
# Günlük rapor
curl -X POST http://localhost:5002/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type": "daily", "days_back": 1}'

# Haftalık rapor
curl -X POST http://localhost:5002/api/reports \
  -H "Content-Type: application/json" \
  -d '{"type": "weekly", "days_back": 7}'
```

### 5️⃣ İçgörüleri Görüntüle

```bash
curl "http://localhost:5002/api/insights?days=7"
```

**Output:**
```json
{
  "total_analyzed": 1250,
  "sentiment_distribution": {
    "positive": 950,
    "negative": 200,
    "neutral": 100
  },
  "insights": [
    "😊 76% pozitif sentiment",
    "⭐ Top oyuncular: Icardi, Ziyech, Mertens",
    "🔥 Yüksek etkileşim oranı"
  ]
}
```

---

## 📋 Gerekli Setup

### Adım 1: API Keys Alma

1. **Twitter/X API**
   - https://developer.twitter.com/en/portal/dashboard
   - API Key + Secret + Bearer Token kopyala

2. **Instagram/Meta API**
   - https://developers.facebook.com/apps/
   - Business Account Access Token al

3. **YouTube API**
   - https://console.cloud.google.com/
   - YouTube Data API v3 aktif et
   - API Key oluştur

### Adım 2: .env Dosyasını Güncelle

```bash
# .env dosyasını aç
nano .env

# Şu satırları güncelle:
TWITTER_BEARER_TOKEN=your_token_here
META_ACCESS_TOKEN=your_token_here
YOUTUBE_API_KEY=your_key_here
```

### Adım 3: Docker Başlat

```bash
docker-compose up -d
```

**Kontrol et:**
```bash
docker ps
# gs-analytics, gs-mongodb, gs-redis çalışıyor olmalı
```

---

## 🎮 İnteraktif Testler

### Test 1: Galatasaray Tweetlerini Çek
```bash
curl -X POST http://localhost:5002/api/collect \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["Galatasaray Spor Kulübü"],
    "platforms": ["twitter"],
    "limit": 100
  }' | python -m json.tool
```

### Test 2: En Çok Bahsedilen Oyuncuları Bul
```bash
curl "http://localhost:5002/api/insights?days=30" | python -m json.tool
```

### Test 3: Son 7 Günün Raporunu Indir
```bash
curl "http://localhost:5002/api/reports?limit=1" \
  -o rapor.json

# JSON'u aç
cat rapor.json | python -m json.tool
```

---

## 📊 Veritabanı Kontrolü

### MongoDB Shell'de Verileri Kontrol Et
```bash
# MongoDB container'a gir
docker exec -it gs-mongodb mongosh

# Database seç
use galatasaray_analytics

# Koleksiyon listesi
show collections

# Son 5 gönderiyi gör
db.social_media_posts.find().limit(5).pretty()

# Sentiment dağılımını gör
db.sentiment_analysis.aggregate([
  {$group: {_id: "$sentiment", count: {$sum: 1}}}
]).pretty()

# Çık
exit
```

---

## 🔄 Otomatik Zamanlama

Sistem otomatik olarak her 15 dakikada:
1. ✅ Galatasaray hakkında yeni veriler çeker
2. ✅ Duygusallık analizi yapar
3. ✅ Etkileşim metriklerini hesaplar
4. ✅ Oyuncu performansını değerlendir
5. ✅ İnsights üretir

**Log'ları kontrol et:**
```bash
docker logs -f gs-analytics | grep "⏰"
```

---

## 🆘 Sorun Giderme

### Sorun: "API Key invalid"
```bash
# .env dosyasını kontrol et
cat .env | grep TWITTER

# API keys'i doğrula
https://developer.twitter.com/en/portal/dashboard
```

### Sorun: "MongoDB connection refused"
```bash
# MongoDB container'ı yeniden başlat
docker-compose restart mongodb

# Logları kontrol et
docker logs gs-mongodb
```

### Sorun: Port 5002 zaten kullanımda
```bash
# docker-compose.yml'de değiştir:
# ports:
#   - "5003:5002"  # Yerine 5003 kullan
```

### Logs'u Full Detay ile Göster
```bash
docker logs gs-analytics --tail 100 -f
```

---

## 📈 Sonraki Adımlar

1. **Dashboard Kurma**
   - Streamlit dashboard oluştur
   - Real-time metrikleri göster
   - Interactive charts ekle

2. **Uyarı Sistemi**
   - Anormal aktiviteler için SMS/Email
   - Önemli oyuncu bahisleri bildir
   - Trend değişimleri takip et

3. **Gelişmiş Analiz**
   - Predictive modeling
   - Player performance forecasting
   - Match outcome prediction

4. **Scale-up**
   - Azure Cosmos DB'ye geç
   - Global replication kur
   - Advanced indexing yapı

---

## 💡 İPUCU: PowerShell ile Otomatize

```powershell
# collect-analyze.ps1
$url = "http://localhost:5002/api/collect-and-analyze"
$body = @{
    keywords = @("Galatasaray")
    platforms = @("twitter")
} | ConvertTo-Json

while ($true) {
    Invoke-WebRequest -Uri $url -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host "✅ Analiz tamamlandı - $(Get-Date)"
    Start-Sleep -Seconds 3600  # 1 saatlik bekle
}
```

Çalıştır:
```powershell
.\collect-analyze.ps1
```

---

**🎉 Başarılı! Şu an Galatasaray Analytics sisteminiz canlı çalışıyor!**

Sorular için: [README.md](README.md) → Kaynaklar bölümü
