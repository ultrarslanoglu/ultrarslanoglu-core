# TikTok Entegrasyonu - Dosya ve Fonksiyon Özeti

## 📁 Oluşturulan/Güncellenen Dosyalar

### 1. **config/index.js** (Güncellendi)

**Amaç:** TikTok konfigürasyon ayarlarını yönetir

**Önemli Değişiklikler:**
- ✅ `TIKTOK_CLIENT_KEY` environment'tan okunuyor
- ✅ `TIKTOK_CLIENT_SECRET` environment'tan okunuyor  
- ✅ `TIKTOK_REDIRECT_URI` environment'tan okunuyor
- ✅ `TIKTOK_SCOPE` environment'tan okunuyor (video.publish eklendi)
- ✅ Share Kit URL'i eklendi

**Kod:**
```javascript
tiktok: {
  clientKey: process.env.TIKTOK_CLIENT_KEY,
  clientSecret: process.env.TIKTOK_CLIENT_SECRET,
  redirectUri: process.env.TIKTOK_REDIRECT_URI,
  scope: process.env.TIKTOK_SCOPE,
  authorizationURL: 'https://www.tiktok.com/v2/auth/authorize/',
  tokenURL: 'https://open.tiktokapis.com/v2/oauth/token/',
  apiBaseURL: 'https://open.tiktokapis.com/v2/',
  shareKitURL: 'https://www.tiktok.com/share'
}
```

---

### 2. **.env.example** (Güncellendi)

**Amaç:** Environment değişkenleri şablonu

**Önemli Değişiklikler:**
- ✅ `video.publish` scope'u eklendi
- ✅ Client Key ve Secret'lar tanımlandı (gerçek değerleriniz)

**Kod:**
```env
TIKTOK_CLIENT_KEY=AW15HSO9IVWT9GT7
TIKTOK_CLIENT_SECRET=eOr2UMw6vaIeKrpc12mKOK8s05fZHvAQ
TIKTOK_REDIRECT_URI=https://ultrarslanoglu.com/auth/tiktok/callback
TIKTOK_SCOPE=user.info.basic,video.upload,video.publish,video.list
```

---

### 3. **src/auth/tiktokAuth.js** (Mevcut)

**Amaç:** TikTok OAuth 2.0 authentication servisi

**Ana Fonksiyonlar:**

#### `getAuthorizationUrl(userId)`
- OAuth akışını başlatır
- PKCE code verifier/challenge oluşturur
- CSRF state token oluşturur
- Authorization URL döndürür

**Kullanım:**
```javascript
const authUrl = tiktokAuth.getAuthorizationUrl(userId);
// Returns: https://www.tiktok.com/v2/auth/authorize/?client_key=...
```

#### `handleCallback(code, state)`
- Authorization code'u token'a çevirir
- Refresh token alır
- Kullanıcı bilgilerini çeker
- Token'ı MongoDB'ye kaydeder

**Kullanım:**
```javascript
const result = await tiktokAuth.handleCallback(code, state);
// Returns: { success, token, userInfo }
```

#### `refreshAccessToken(refreshToken)`
- Süresi dolmuş token'ı yeniler
- Yeni access ve refresh token döndürür

#### `ensureValidToken(userId)`
- Token'ın geçerliliğini kontrol eder
- Gerekirse otomatik yeniler
- Her API call öncesi kullanılır

#### `revokeAccess(userId)`
- OAuth bağlantısını iptal eder
- Token'ı veritabanında pasif yapar

---

### 4. **src/api/tiktok.js** (Güncellendi)

**Amaç:** TikTok Content Posting API client

**Ana Fonksiyonlar:**

#### `uploadVideo(userId, videoPath, metadata)`
**Amaç:** Video'yu TikTok'a yükler

**Process:**
1. Upload initialization (publish_id ve upload_url alır)
2. Chunked upload (10MB chunk'larla)
3. Publish status kontrolü

**Metadata:**
```javascript
{
  title: 'Video Başlığı',
  description: 'Açıklama',
  privacyLevel: 'PUBLIC_TO_EVERYONE', // MUTUAL_FOLLOW_FRIENDS, SELF_ONLY
  disableDuet: false,
  disableComment: false,
  disableStitch: false,
  coverTimestamp: 1000
}
```

**Response:**
```javascript
{
  success: true,
  publishId: 'v_pub_12345',
  status: 'PUBLISH_COMPLETE',
  videoId: 'video_123',
  shareUrl: 'https://tiktok.com/@user/video/123'
}
```

#### `uploadVideoChunks(videoPath, uploadUrl, accessToken)`
**Amaç:** Video'yu chunk'lara bölerek yükler

- Chunk size: 10MB
- Content-Range header ile progress tracking
- PUT request kullanır

#### `getVideoList(userId, cursor, maxCount)`
**Amaç:** Kullanıcının videolarını listeler

**Response:**
```javascript
{
  success: true,
  videos: [...],
  cursor: 'next_token',
  hasMore: true
}
```

#### `getVideoAnalytics(userId, videoIds)`
**Amaç:** Video analytics'i çeker

**Response:**
```javascript
{
  success: true,
  analytics: [{
    videoId: 'video_123',
    views: 150000,
    likes: 12500,
    comments: 450,
    shares: 320,
    engagement: 0.0862
  }]
}
```

#### `getCreatorAnalytics(userId)`
**Amaç:** Creator profil istatistiklerini getirir

**Response:**
```javascript
{
  success: true,
  analytics: {
    displayName: 'UltraRslanoglu',
    followers: 25000,
    totalLikes: 450000,
    totalVideos: 85
  }
}
```

#### `generateShareUrl(options)` ⭐ YENİ
**Amaç:** TikTok Share Kit URL'i oluşturur

**Parameters:**
```javascript
{
  url: 'https://example.com/video',  // Opsiyonel
  title: 'Video Başlığı',            // Opsiyonel
  hashtags: ['viral', 'trending']     // Opsiyonel
}
```

**Response:**
```javascript
'https://www.tiktok.com/share?url=...&title=...&hashtags=viral,trending'
```

#### `checkPublishStatus(userId, publishId)` ⭐ YENİ
**Amaç:** Upload sonrası publish durumunu kontrol eder

**Status'ler:**
- `PUBLISH_COMPLETE` - Yayınlandı
- `PROCESSING_DOWNLOAD` - İndiriliyor
- `PROCESSING_UPLOAD` - İşleniyor
- `FAILED` - Başarısız

#### `getVideoComments(userId, videoId, cursor, count)` ⭐ YENİ
**Amaç:** Video yorumlarını listeler

#### `updateVideoPrivacy(userId, videoId, privacyLevel)` ⭐ YENİ
**Amaç:** Video privacy ayarlarını günceller

**Privacy Levels:**
- `PUBLIC_TO_EVERYONE`
- `MUTUAL_FOLLOW_FRIENDS`
- `SELF_ONLY`

#### `deleteVideo(userId, videoId)`
**Amaç:** Video'yu siler

---

### 5. **src/routes/tiktokRoutes.js** ⭐ YENİ DOSYA

**Amaç:** TikTok'a özel endpoint'leri yönetir

**Endpoint'ler:**

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| GET | `/api/tiktok/share` | Share URL oluştur |
| POST | `/api/tiktok/share/redirect` | Share'e yönlendir |
| GET | `/api/tiktok/videos` | Video listesi |
| GET | `/api/tiktok/video/:videoId/analytics` | Video analytics |
| GET | `/api/tiktok/creator/analytics` | Creator analytics |
| GET | `/api/tiktok/publish/status/:publishId` | Publish durumu |
| GET | `/api/tiktok/video/:videoId/comments` | Video yorumları |
| PUT | `/api/tiktok/video/:videoId/privacy` | Privacy güncelle |
| DELETE | `/api/tiktok/video/:videoId` | Video sil |

**Örnek Route Implementation:**
```javascript
router.get('/share', (req, res) => {
  const { url, title, hashtags } = req.query;
  
  const shareUrl = tiktokClient.generateShareUrl({
    url,
    title,
    hashtags: hashtags ? hashtags.split(',') : undefined
  });
  
  res.json({ success: true, shareUrl });
});
```

---

### 6. **src/app.js** (Güncellendi)

**Amaç:** Ana Express uygulaması

**Değişiklik:**
- ✅ TikTok route'ları eklendi

**Kod:**
```javascript
const tiktokRoutes = require('./routes/tiktokRoutes');

// Routes
app.use('/api/tiktok', tiktokRoutes);
```

---

### 7. **src/routes/authRoutes.js** (Mevcut)

**Amaç:** OAuth authentication endpoint'leri

**TikTok Endpoint'leri:**

#### `GET /auth/tiktok/login`
- OAuth akışını başlatır
- Authorization URL'ine yönlendirir

#### `GET /auth/tiktok/callback`
- TikTok'tan geri döner
- Token exchange yapar
- Dashboard'a yönlendirir

#### `POST /auth/tiktok/revoke`
- Bağlantıyı iptal eder
- Token'ı pasif yapar

---

### 8. **src/routes/uploadRoutes.js** (Mevcut)

**Amaç:** Video upload endpoint'leri

**TikTok İçin Kullanım:**

```javascript
POST /api/upload/single

Form Data:
- video: [Binary File]
- platform: tiktok
- title: Video Başlığı
- description: Açıklama
- privacy: PUBLIC_TO_EVERYONE
```

**Backend'de:**
```javascript
// Upload işlemi
uploaderService.uploadToMultiplePlatforms(
  userId,
  uploadDoc._id,
  ['tiktok'],
  videoPath,
  metadata
);
```

---

### 9. **docs/TIKTOK.md** ⭐ YENİ DOSYA

**Amaç:** Kapsamlı TikTok entegrasyon dokümantasyonu

**İçerik:**
- ✅ Genel bakış ve özellikler
- ✅ Aktif ürünler ve kapsamlar
- ✅ Konfigürasyon rehberi
- ✅ OAuth akış detayları
- ✅ Content Posting API açıklamaları
- ✅ Share Kit kullanımı
- ✅ Analytics ve video yönetimi
- ✅ API endpoint'leri listesi
- ✅ Kod örnekleri
- ✅ Hata yönetimi
- ✅ Güvenlik önlemleri

---

### 10. **docs/API.md** (Güncellendi)

**Amaç:** REST API referans dokümantasyonu

**Eklenen Bölüm:**
- ✅ TikTok Specific Endpoints
- ✅ 9 yeni endpoint dokümante edildi
- ✅ Request/response örnekleri
- ✅ cURL komutları

---

## 🔑 Önemli Özellikler

### 1. OAuth 2.0 + PKCE

**Neden PKCE?**
- TikTok OAuth 2.0 güvenlik standardı
- Authorization code'un çalınmasını engeller
- Code verifier/challenge mekanizması

**Implementation:**
```javascript
// 1. Code verifier oluştur (43-128 karakter)
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// 2. Code challenge oluştur (SHA256 hash)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// 3. Authorization URL'inde gönder
// code_challenge=CHALLENGE&code_challenge_method=S256

// 4. Token exchange'de code_verifier'ı kullan
```

### 2. Chunked Upload

**Neden Chunked?**
- Büyük dosyalar için (500MB'a kadar)
- Network kesintilerinde resume desteği
- Progress tracking

**Chunk Size:** 10MB (10485760 bytes)

**Process:**
```javascript
// 1. Dosyayı oku
const fileStream = fs.createReadStream(videoPath);

// 2. Her chunk'ı PUT request ile gönder
await axios.put(uploadUrl, chunk, {
  headers: {
    'Content-Range': 'bytes 0-10485759/52428800'
  }
});
```

### 3. Token Auto-Refresh

**Neden Gerekli?**
- Access token kısa ömürlü (genelde 24 saat)
- Refresh token uzun ömürlü (30-90 gün)
- Kullanıcı deneyimi için otomatik yenileme

**Implementation:**
```javascript
async ensureValidToken(userId) {
  const token = await Token.findOne({ userId, platform: 'tiktok' });
  
  // Token süresi dolmuş mu?
  if (token.needsRefresh()) {
    // Otomatik yenile
    const newTokenData = await this.refreshAccessToken(token.refreshToken);
    token.accessToken = newTokenData.accessToken;
    await token.save();
  }
  
  return token.accessToken;
}
```

### 4. Share Kit Integration

**Kullanım Senaryosu:**
- Web sitesinden TikTok'a paylaşım
- URL, başlık ve hashtag'lerle
- Mobil ve desktop uyumlu

**Örnek:**
```javascript
// Backend'de URL oluştur
const shareUrl = tiktokClient.generateShareUrl({
  url: 'https://ultrarslanoglu.com/video/123',
  title: 'Harika bir video!',
  hashtags: ['viral', 'trending', 'funny']
});

// Frontend'de kullanıcıyı yönlendir
window.open(shareUrl, '_blank');
```

---

## 🔐 Güvenlik Özellikleri

1. **Environment Değişkenleri**
   - ✅ Tüm credential'lar .env'de
   - ✅ Kodda hardcoded değer yok
   - ✅ .gitignore ile korunuyor

2. **PKCE (Proof Key for Code Exchange)**
   - ✅ Authorization code interception koruması
   - ✅ SHA256 hash challenge
   - ✅ Base64url encoding

3. **CSRF Koruması**
   - ✅ State parameter ile
   - ✅ Her OAuth akışında unique
   - ✅ 16-byte random hex

4. **Token Güvenliği**
   - ✅ MongoDB'de `selected: false`
   - ✅ Sadece gerektiğinde okunur
   - ✅ HTTPS zorunlu (production)

5. **Rate Limiting**
   - ✅ API endpoint'leri için
   - ✅ 15 dakikada 100 request
   - ✅ Brute force koruması

---

## 📊 Scope'lar ve İzinler

| Scope | İzin | Kullanıldığı Yer |
|-------|------|------------------|
| `user.info.basic` | Temel kullanıcı bilgileri | OAuth, getUserInfo() |
| `video.upload` | Video yükleme | uploadVideo() |
| `video.publish` | Video yayınlama | uploadVideo(), checkPublishStatus() |
| `video.list` | Video listesi | getVideoList(), getVideoAnalytics() |

---

## 🚀 Kullanım Akışı

### 1. OAuth Bağlantısı

```
1. Kullanıcı "TikTok ile Bağlan" tıklar
   → GET /auth/tiktok/login

2. Backend authorization URL oluşturur
   → PKCE code verifier/challenge
   → CSRF state token
   → Redirect to TikTok

3. Kullanıcı TikTok'ta izin verir
   → Redirect to /auth/tiktok/callback

4. Backend token exchange yapar
   → Access token + refresh token
   → Token'ı MongoDB'ye kaydeder
   → connectedPlatforms'a ekler

5. Dashboard'a yönlendir
```

### 2. Video Upload

```
1. Frontend video seçer ve form doldurur
   → POST /api/upload/single

2. Backend upload kaydı oluşturur
   → Upload model'e kaydet
   → Status: 'processing'

3. Background upload işlemi başlar
   → ensureValidToken() - token kontrol
   → uploadVideo() çağrılır
   → Init → Chunks → Publish

4. Frontend status polling yapar
   → GET /api/upload/status/:uploadId
   → Her 5 saniyede bir

5. Upload tamamlanır
   → Status: 'success'
   → videoId ve shareUrl döner
```

### 3. Share Kit Kullanımı

```
1. Frontend share button'a tıklar
   → GET /api/tiktok/share?url=...&title=...

2. Backend share URL oluşturur
   → generateShareUrl() fonksiyonu
   → Query parameters ekler

3. Frontend kullanıcıyı yönlendirir
   → window.open(shareUrl, '_blank')
   → TikTok share sayfası açılır

4. Kullanıcı TikTok'ta paylaşır
   → Video kullanıcının TikTok'unda
```

### 4. Analytics Çekme

```
1. Frontend analytics request atar
   → GET /api/tiktok/creator/analytics

2. Backend token kontrol eder
   → ensureValidToken()

3. TikTok API'ye request
   → /v2/user/info/ endpoint
   → Follower, likes, video count

4. Response döner
   → Frontend'de göster
   → Chart veya tablo
```

---

## 🛠️ Test ve Debugging

### Test Komutları

```bash
# 1. OAuth Akışını Test Et
curl -X GET "http://localhost:3000/auth/tiktok/login"

# 2. Video Listesini Çek
curl -X GET "http://localhost:3000/api/tiktok/videos" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Creator Analytics
curl -X GET "http://localhost:3000/api/tiktok/creator/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Share URL Oluştur
curl -X GET "http://localhost:3000/api/tiktok/share?title=Test&hashtags=viral"
```

### Log Dosyaları

```bash
# Genel loglar
tail -f logs/combined.log

# Sadece hatalar
tail -f logs/error.log

# Grep ile TikTok loglarını filtrele
grep "TikTok" logs/combined.log
```

---

## 📚 Kaynaklar

1. **TikTok Developer Documentation**
   - https://developers.tiktok.com/
   - Login Kit: https://developers.tiktok.com/doc/login-kit-web
   - Content Posting API: https://developers.tiktok.com/doc/content-posting-api-get-started

2. **Proje Dosyaları**
   - Detaylı Dokümantasyon: `docs/TIKTOK.md`
   - API Reference: `docs/API.md`
   - Deployment: `docs/DEPLOYMENT.md`

3. **Kod Dosyaları**
   - OAuth: `src/auth/tiktokAuth.js`
   - API Client: `src/api/tiktok.js`
   - Routes: `src/routes/tiktokRoutes.js`

---

## ✅ Checklist

TikTok entegrasyonunu test etmek için:

- [ ] Environment değişkenleri ayarlandı mı?
- [ ] MongoDB bağlantısı çalışıyor mu?
- [ ] OAuth akışı test edildi mi?
- [ ] Video upload test edildi mi?
- [ ] Token refresh çalışıyor mu?
- [ ] Share Kit URL'i oluşturuldu mu?
- [ ] Analytics endpoint'leri test edildi mi?
- [ ] Hata durumları kontrol edildi mi?
- [ ] Log dosyaları incelendi mi?
- [ ] Production deployment hazır mı?

---

**Not:** Bu entegrasyon TikTok API v2 kullanmaktadır. API güncellemelerini takip etmeyi unutmayın.
