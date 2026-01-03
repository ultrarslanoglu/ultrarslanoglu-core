# Ultrarslanoglu Social Media Hub

🚀 **Çoklu Platform Sosyal Medya Yönetim ve Otomasyon Sistemi**

TikTok, Instagram/Facebook, YouTube ve X (Twitter) platformlarına içerik yükleme, analitik toplama ve AI destekli karar verme altyapısı.

## 🌟 Özellikler

### 🔐 OAuth 2.0 Entegrasyonları
- ✅ **TikTok** - Login Kit + Content Posting API
- ✅ **Meta** - Facebook Login + Instagram Basic Display API
- ✅ **YouTube** - Google OAuth + YouTube Data API v3
- ✅ **X** - Twitter OAuth 2.0 + API v2

### 📤 Upload Servisleri
- Tek veya çoklu platforma video yükleme
- Zamanlanmış içerik yayınlama
- Otomatik format optimizasyonu
- Chunk-based büyük dosya yükleme

### 📊 Analytics ve Insights
- Platform başına detaylı performans metrikleri
- Cross-platform karşılaştırma
- Engagement rate hesaplama
- Trend analizi

### 🤖 AI Decision Engine
- Performans verisi analizi
- Platform önerisi
- Optimal zamanlama önerisi
- İçerik kalite skoru
- Otomatik karar verme

## 🏗️ Mimari

```
social-media-hub/
├── src/
│   ├── api/              # Platform API client'ları
│   │   ├── tiktok.js
│   │   ├── meta.js
│   │   ├── youtube.js
│   │   └── x.js
│   ├── auth/             # OAuth akışları
│   │   ├── tiktokAuth.js
│   │   ├── metaAuth.js
│   │   ├── youtubeAuth.js
│   │   └── xAuth.js
│   ├── services/         # Business logic
│   │   ├── uploader.js
│   │   └── analytics.js
│   ├── ai/               # AI karar motoru
│   │   └── decisionEngine.js
│   ├── models/           # MongoDB modelleri
│   │   ├── User.js
│   │   ├── Token.js
│   │   └── Upload.js
│   ├── routes/           # Express routes
│   │   ├── authRoutes.js
│   │   ├── uploadRoutes.js
│   │   └── analyticsRoutes.js
│   ├── utils/            # Yardımcı fonksiyonlar
│   │   ├── logger.js
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   └── app.js            # Ana uygulama
├── config/
│   └── index.js          # Konfigürasyon
├── public/
│   ├── .well-known/      # Domain doğrulama
│   ├── privacy-policy.html
│   └── terms-of-service.html
├── uploads/              # Geçici dosya storage
├── logs/                 # Uygulama logları
├── .env.example          # Ortam değişkenleri şablonu
├── package.json
└── README.md
```

## 🚀 Kurulum

### 1. Gereksinimler
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis (opsiyonel - session storage için)

### 2. Projeyi Klonla
```bash
cd social-media-hub
```

### 3. Bağımlılıkları Yükle
```bash
npm install
```

### 4. Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env
# .env dosyasını düzenle ve gerçek değerleri gir
```

### 5. Bağlantıları Test Et
```bash
# Hızlı yapılandırma kontrolü (veritabanı gerektirmez)
npm run test:connections:simple

# Detaylı bağlantı testi (veritabanı gerektirir)
npm run test:connections
```

Test sonuçlarına göre `.env` dosyasındaki eksik bilgileri tamamlayın. Detaylı bilgi için [`docs/CONNECTION-STATUS.md`](docs/CONNECTION-STATUS.md) dosyasına bakınız.

### 6. MongoDB'yi Başlat
```bash
# Local MongoDB
mongod

# veya Docker ile
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 7. Uygulamayı Başlat
```bash
# Development
npm run dev

# Production
npm start
```

## ⚙️ Konfigürasyon

### OAuth Credentials

Her platform için OAuth credentials'ları almanız gerekiyor:

#### TikTok
1. [TikTok for Developers](https://developers.tiktok.com/) hesabı oluştur
2. Yeni uygulama oluştur
3. Client Key ve Client Secret'ı al
4. Redirect URI'yi ayarla: `https://ultrarslanoglu.com/auth/tiktok/callback`
5. Gerekli scope'ları ekle: `user.info.basic,video.upload,video.list`

#### Meta (Facebook & Instagram)
1. [Meta for Developers](https://developers.facebook.com/) hesabı oluştur
2. Yeni uygulama oluştur (Consumer veya Business)
3. Facebook Login ve Instagram Basic Display ürünlerini ekle
4. App ID ve App Secret'ı al
5. OAuth Redirect URI'yi ayarla: `https://ultrarslanoglu.com/auth/meta/callback`
6. Gerekli permissions: `instagram_basic,instagram_content_publish,pages_read_engagement`

#### YouTube (Google)
1. [Google Cloud Console](https://console.cloud.google.com/) projesi oluştur
2. YouTube Data API v3'ü aktifleştir
3. OAuth 2.0 Client ID oluştur (Web application)
4. Authorized redirect URI: `https://ultrarslanoglu.com/auth/youtube/callback`
5. Client ID ve Client Secret'ı al

#### X (Twitter)
1. [Twitter Developer Portal](https://developer.twitter.com/) başvurusu yap
2. Yeni proje ve app oluştur
3. OAuth 2.0 ayarlarını yapılandır
4. Client ID ve Client Secret'ı al
5. Callback URL: `https://ultrarslanoglu.com/auth/x/callback`
6. Scope'lar: `tweet.read,tweet.write,users.read,offline.access`

### .env Dosyası

```env
# Uygulama
NODE_ENV=production
PORT=3000
BASE_URL=https://ultrarslanoglu.com

# Veritabanı
MONGODB_URI=mongodb://localhost:27017/ultrarslanoglu_social

# Session & JWT
SESSION_SECRET=your-super-secret-key
JWT_SECRET=your-jwt-secret

# TikTok
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Meta
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

# Google/YouTube
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# X (Twitter)
X_CLIENT_ID=your_x_client_id
X_CLIENT_SECRET=your_x_client_secret
```

## 📡 API Endpoints

### Authentication

#### TikTok OAuth
```
GET  /auth/tiktok/login          - OAuth akışını başlat
GET  /auth/tiktok/callback       - OAuth callback
POST /auth/tiktok/revoke         - Bağlantıyı kaldır
```

#### Meta OAuth
```
GET  /auth/meta/login            - OAuth akışını başlat
GET  /auth/meta/callback         - OAuth callback
POST /auth/meta/revoke           - Bağlantıyı kaldır
```

#### YouTube OAuth
```
GET  /auth/youtube/login         - OAuth akışını başlat
GET  /auth/youtube/callback      - OAuth callback
POST /auth/youtube/revoke        - Bağlantıyı kaldır
```

#### X OAuth
```
GET  /auth/x/login               - OAuth akışını başlat
GET  /auth/x/callback            - OAuth callback
POST /auth/x/revoke              - Bağlantıyı kaldır
```

#### Status
```
GET  /auth/status                - Bağlı platformları listele
```

### Upload

```
POST /api/upload/analyze         - İçerik analizi ve AI önerileri
POST /api/upload/single          - Tek platforma yükle
POST /api/upload/multiple        - Çoklu platforma yükle
POST /api/upload/schedule        - Zamanlanmış yükleme
GET  /api/upload/status/:id      - Upload durumu sorgula
GET  /api/upload/history         - Upload geçmişi
DELETE /api/upload/:id           - Upload sil
```

### Analytics

```
GET  /api/analytics/all          - Tüm platformlar
GET  /api/analytics/tiktok       - TikTok analytics
GET  /api/analytics/instagram    - Instagram analytics
GET  /api/analytics/youtube      - YouTube analytics
GET  /api/analytics/x            - X (Twitter) analytics
POST /api/analytics/sync/:id     - Analytics senkronize et
GET  /api/analytics/trends/:platform  - Trend analizi
GET  /api/analytics/comparison   - Platform karşılaştırma
GET  /api/analytics/export       - Export (JSON/CSV)
```

## 🔧 Kullanım Örnekleri

### 1. Platform Bağlantısı

```javascript
// Kullanıcıyı OAuth akışına yönlendir
window.location.href = '/auth/tiktok/login';

// Callback'ten döndükten sonra status kontrol et
fetch('/auth/status')
  .then(res => res.json())
  .then(data => {
    console.log('Bağlı platformlar:', data.connectedPlatforms);
  });
```

### 2. Video Yükleme

```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('platforms', JSON.stringify(['tiktok', 'instagram', 'youtube']));
formData.append('title', 'Harika bir video!');
formData.append('description', 'Detaylı açıklama...');
formData.append('tags', JSON.stringify(['galatasaray', 'futbol']));

fetch('/api/upload/multiple', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => {
  console.log('Upload başlatıldı:', data.uploadId);
  
  // Status kontrol et
  checkUploadStatus(data.uploadId);
});
```

### 3. Analytics Çekme

```javascript
// Tüm platformların analytics'i
fetch('/api/analytics/all')
  .then(res => res.json())
  .then(data => {
    console.log('TikTok:', data.stats.tiktok);
    console.log('Instagram:', data.stats.instagram);
    console.log('YouTube:', data.stats.youtube);
    console.log('X:', data.stats.x);
  });

// Platform karşılaştırma
fetch('/api/analytics/comparison')
  .then(res => res.json())
  .then(data => {
    console.log('En iyi platform:', data.comparison.rankings[0]);
  });
```

### 4. AI Decision Engine

```javascript
// İçerik analizi ve öneri al
fetch('/api/upload/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Video başlığı',
    description: 'Açıklama',
    tags: ['tag1', 'tag2']
  })
})
.then(res => res.json())
.then(data => {
  console.log('AI Skoru:', data.decision.score);
  console.log('Önerilen platformlar:', data.decision.suggestedPlatforms);
  console.log('Optimal zaman:', data.decision.suggestedTiming);
  console.log('Öneriler:', data.decision.recommendations);
});
```

## 🔒 Güvenlik

- ✅ HTTPS zorunlu (production)
- ✅ Helmet.js ile güvenlik headers
- ✅ Rate limiting
- ✅ CORS koruması
- ✅ JWT token authentication
- ✅ OAuth 2.0 PKCE akışı
- ✅ Session güvenliği
- ✅ Input validation
- ✅ XSS koruması

## 📊 Monitoring ve Logging

Loglar `logs/` klasöründe saklanır:
- `combined.log` - Tüm loglar
- `error.log` - Sadece hatalar
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled rejections

Winston logger kullanılarak yapılandırılmıştır.

## 🚢 Deployment

### Production Checklist

1. ✅ `.env` dosyasını production değerleriyle güncelle
2. ✅ `NODE_ENV=production` ayarla
3. ✅ MongoDB production instance kullan
4. ✅ HTTPS sertifikası kur
5. ✅ Domain DNS ayarlarını yap
6. ✅ Firewall kurallarını yapılandır
7. ✅ Backup stratejisi oluştur
8. ✅ Monitoring araçları kur
9. ✅ Rate limiting ayarlarını kontrol et
10. ✅ Log rotation yapılandır

### Örnek: PM2 ile Deployment

```bash
# PM2 kur
npm install -g pm2

# Uygulamayı başlat
pm2 start src/app.js --name social-media-hub

# Auto-restart ayarla
pm2 startup
pm2 save

# Logları izle
pm2 logs social-media-hub
```

## 📝 Lisans

MIT License - Detaylar için [LICENSE](../LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen pull request göndermeden önce:

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

- **Email**: support@ultrarslanoglu.com
- **Website**: https://ultrarslanoglu.com
- **Security**: security@ultrarslanoglu.com

## 🙏 Teşekkürler

Bu proje aşağıdaki harika teknolojiler kullanılarak geliştirilmiştir:

- Node.js & Express
- MongoDB & Mongoose
- TikTok API
- Meta (Facebook/Instagram) API
- YouTube Data API v3
- Twitter API v2
- Winston Logger
- JWT & Passport
- Multer
- Axios

---

**Ultrarslanoglu-Core** - Galatasaray Dijital Liderlik Projesi 🟡🔴
