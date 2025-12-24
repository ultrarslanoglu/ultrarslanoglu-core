# Sosyal Medya Bağlantı Durumu Raporu

**Test Tarihi:** 24 Aralık 2025
**Test Sonucu:** ⚠️ Yapılandırma Gerekli

## 📊 Test Sonuçları

### Genel Durum
- **Toplam Platform:** 4
- **Yapılandırılmış:** 0/4 ❌
- **Bağlı:** 0/4 ❌

### Platform Detayları

#### 📱 TikTok
- **Yapılandırma:** ❌ Kimlik bilgileri tanımlı değil
- **Bağlantı:** ❌ Test edilemedi
- **Gerekli:** `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`

#### 📘 Meta (Facebook/Instagram)
- **Yapılandırma:** ❌ Kimlik bilgileri tanımlı değil
- **Bağlantı:** ❌ Test edilemedi
- **Gerekli:** `META_APP_ID`, `META_APP_SECRET`

#### 📺 YouTube (Google)
- **Yapılandırma:** ❌ Kimlik bilgileri tanımlı değil
- **Bağlantı:** ❌ Test edilemedi
- **Gerekli:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

#### 🐦 X (Twitter)
- **Yapılandırma:** ❌ Kimlik bilgileri tanımlı değil
- **Bağlantı:** ❌ Test edilemedi
- **Gerekli:** `X_CLIENT_ID`, `X_CLIENT_SECRET`

## 🔧 Yapılması Gerekenler

### 1. Ortam Değişkenlerini Yapılandırın

`.env` dosyası oluşturun (`.env.example`'dan kopyalayın):

```bash
cp .env.example .env
```

### 2. API Kimlik Bilgilerini Edinin

Her platform için geliştirici portalından API anahtarları alın:

- **TikTok:** https://developers.tiktok.com/
- **Meta:** https://developers.facebook.com/
- **Google/YouTube:** https://console.cloud.google.com/
- **X (Twitter):** https://developer.twitter.com/

### 3. `.env` Dosyasını Düzenleyin

```env
# TikTok
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here

# Meta
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here

# Google (YouTube)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# X (Twitter)
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ultrarslanoglu_social

# Uygulama
BASE_URL=http://localhost:3000
```

### 4. Testi Tekrar Çalıştırın

```bash
# Hızlı test (veritabanı gerektirmez)
npm run test:connections:simple

# Tam test (veritabanı ve token kontrolü)
npm run test:connections
```

### 5. OAuth Bağlantılarını Tamamlayın

Kimlik bilgileri yapılandırıldıktan sonra, her platform için OAuth akışını tamamlayın:

1. Sunucuyu başlatın: `npm start` veya `npm run dev`
2. Tarayıcıdan şu URL'lere gidin:
   - TikTok: http://localhost:3000/auth/tiktok
   - Meta: http://localhost:3000/auth/meta
   - YouTube: http://localhost:3000/auth/youtube
   - X: http://localhost:3000/auth/x

## 📝 Test Araçları

### Test Komutları

```bash
# Basit yapılandırma testi (veritabanı gerektirmez)
npm run test:connections:simple

# Detaylı bağlantı testi (veritabanı gerektirir)
npm run test:connections
```

### API Endpoint'leri

Sunucu çalışırken HTTP istekleri ile test:

```bash
# Tüm platformları test et
curl http://localhost:3000/api/health/connections

# Tek platform test et
curl http://localhost:3000/api/health/connections/tiktok
curl http://localhost:3000/api/health/connections/meta
curl http://localhost:3000/api/health/connections/youtube
curl http://localhost:3000/api/health/connections/x
```

## 📚 Dokümantasyon

Detaylı kullanım kılavuzu için bakınız:
- [CONNECTION-TESTING.md](./CONNECTION-TESTING.md)
- [API.md](./API.md)

## 🔗 İlgili Dosyalar

- Test araçları:
  - [scripts/test-connections-simple.js](../scripts/test-connections-simple.js)
  - [scripts/test-connections.js](../scripts/test-connections.js)
  - [src/utils/connectionTester.js](../src/utils/connectionTester.js)
  
- API routes:
  - [src/routes/healthRoutes.js](../src/routes/healthRoutes.js)
  
- Yapılandırma:
  - [config/index.js](../config/index.js)
  - [.env.example](../.env.example)

## 💡 İpuçları

1. **MongoDB Çalışmıyor mu?** `test:connections:simple` komutunu kullanın
2. **Hata Ayıklama:** `DEBUG=* npm run test:connections` ile detaylı log
3. **CI/CD Entegrasyonu:** Test scriptleri exit code döndürür (0=başarılı, 1=başarısız)

## ⚠️ Güvenlik Uyarıları

- `.env` dosyasını asla git'e eklemeyin
- API anahtarlarını güvenli saklayın
- Production ortamında güçlü SECRET değerleri kullanın
- Rate limiting'i aktif tutun

---

**Sonraki Adım:** `.env` dosyasını oluşturun ve API kimlik bilgilerini ekleyin, ardından testleri tekrar çalıştırın.
