# Sosyal Medya Bağlantı Testi

Bu araçlar, Social Media Hub'ın tüm sosyal medya platformlarıyla olan bağlantılarını test etmenizi sağlar.

## Özellikler

✅ **4 Platform Desteği:**
- 📱 TikTok
- 📘 Meta (Facebook/Instagram)
- 📺 YouTube (Google)
- 🐦 X (Twitter)

✅ **Kontrol Edilen Özellikler:**
- Kimlik bilgileri (API keys, secrets) kontrolü
- OAuth yapılandırması doğrulama
- Aktif token varlığı kontrolü
- API bağlantı testi
- Platform kullanıcı bilgilerini çekme

## Kullanım

### 1. CLI ile Test (Önerilen)

Terminalde komple test raporu almak için:

```bash
npm run test:connections
```

Bu komut:
- Tüm platformları sırayla test eder
- Renkli ve detaylı konsol çıktısı verir
- `connection-test-report.json` dosyasına JSON raporu kaydeder
- Başarısız testler varsa exit code 1 döner

### 2. API Endpoint ile Test

Sunucu çalışırken HTTP istekleri ile test edebilirsiniz:

#### Tüm platformları test et:
```bash
GET /api/health/connections
```

Örnek:
```bash
curl http://localhost:3000/api/health/connections
```

#### Tek platform test et:
```bash
GET /api/health/connections/:platform
```

Platform değerleri: `tiktok`, `meta`, `youtube`, `x`

Örnek:
```bash
curl http://localhost:3000/api/health/connections/tiktok
```

### 3. Node.js Script Olarak

```javascript
const ConnectionTester = require('./src/utils/connectionTester');

async function test() {
  const tester = new ConnectionTester();
  await tester.testAll();
  const results = tester.getResults();
  console.log(JSON.stringify(results, null, 2));
}

test();
```

## Test Sonuçları

### Konsol Çıktısı

```
🔍 Sosyal Medya Bağlantı Testi Başlatılıyor...

═══════════════════════════════════════════════════════════════

📱 TikTok Bağlantısı Test Ediliyor...
────────────────────────────────────────────────────────────────
   Client Key: ✅ Tanımlı
   Client Secret: ✅ Tanımlı
   Redirect URI: http://localhost:3000/auth/tiktok/callback
   Scope: user.info.basic,video.upload
   Aktif Token Sayısı: 1
   Test Token: @username
   ✅ API Bağlantısı Başarılı
   Kullanıcı: Display Name

...
```

### JSON Yanıtı

```json
{
  "summary": {
    "totalPlatforms": 4,
    "configured": 4,
    "connected": 2
  },
  "platforms": {
    "tiktok": {
      "configured": true,
      "connected": true,
      "error": null
    },
    "meta": {
      "configured": true,
      "connected": false,
      "error": "Aktif token bulunamadı"
    },
    "youtube": {
      "configured": true,
      "connected": true,
      "error": null
    },
    "x": {
      "configured": false,
      "connected": false,
      "error": "X kimlik bilgileri eksik"
    }
  },
  "timestamp": "2024-12-24T10:30:00.000Z"
}
```

## Yapılandırma

Test için gerekli ortam değişkenlerini `.env` dosyasında tanımlayın:

```env
# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# Meta (Facebook/Instagram)
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret

# Google (YouTube)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# X (Twitter)
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ultrarslanoglu_social
```

## Bağlantı Kurma

Eğer test sonucunda "Aktif token bulunamadı" hatası alıyorsanız, OAuth akışını tamamlamanız gerekir:

1. **TikTok:** `http://localhost:3000/auth/tiktok`
2. **Meta:** `http://localhost:3000/auth/meta`
3. **YouTube:** `http://localhost:3000/auth/youtube`
4. **X:** `http://localhost:3000/auth/x`

Bu URL'lere tarayıcıdan erişin ve OAuth akışını tamamlayın.

## Hata Ayıklama

### "Kimlik bilgileri eksik" Hatası
- `.env` dosyasında ilgili platformun API anahtarlarını kontrol edin
- Sunucuyu yeniden başlatın

### "Aktif token bulunamadı" Hatası
- OAuth akışını yukarıdaki URL'lerden tamamlayın
- Veritabanında token'ların kaydedildiğinden emin olun

### "API Bağlantısı Başarısız" Hatası
- Token'ın süresi dolmuş olabilir (refresh token kullanılacak)
- Platform API'sinde sorun olabilir
- İzinler (scope) eksik olabilir

## Otomatik Testler

CI/CD pipeline'ına eklemek için:

```yaml
# GitHub Actions örneği
- name: Test Social Media Connections
  run: npm run test:connections
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
    TIKTOK_CLIENT_KEY: ${{ secrets.TIKTOK_CLIENT_KEY }}
    # ... diğer secrets
```

## İlgili Dosyalar

- `src/utils/connectionTester.js` - Ana test servisi
- `scripts/test-connections.js` - CLI aracı
- `src/routes/healthRoutes.js` - API endpoints
- `src/models/Token.js` - Token veri modeli

## Güvenlik Notu

⚠️ Bu testler API anahtarlarınızı ve token'larınızı kullanır. Loglarda hassas verilerin görünmediğinden emin olun.
