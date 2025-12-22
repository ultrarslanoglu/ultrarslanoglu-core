# TikTok Entegrasyonu Dokümantasyonu

Bu döküman, Ultrarslanoglu Social Media Hub'ın TikTok entegrasyonunu detaylı şekilde açıklar.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Aktif Ürünler ve Kapsamlar](#aktif-ürünler-ve-kapsamlar)
3. [Konfigürasyon](#konfigürasyon)
4. [OAuth Akışı](#oauth-akışı)
5. [Content Posting API](#content-posting-api)
6. [Share Kit](#share-kit)
7. [Analytics ve Video Yönetimi](#analytics-ve-video-yönetimi)
8. [API Endpoint'leri](#api-endpointleri)
9. [Kullanım Örnekleri](#kullanım-örnekleri)
10. [Hata Yönetimi](#hata-yönetimi)

---

## 🎯 Genel Bakış

TikTok entegrasyonu, aşağıdaki temel özellikleri sunar:

- ✅ **Login Kit**: TikTok OAuth 2.0 ile güvenli kullanıcı kimlik doğrulama
- ✅ **Content Posting API**: Video yükleme ve yayınlama
- ✅ **Share Kit**: Web-based TikTok paylaşım akışı
- ✅ **Video Management**: Video listesi, analytics, yorumlar
- ✅ **PKCE Desteği**: Code verifier/challenge ile güvenlik

---

## 🔑 Aktif Ürünler ve Kapsamlar

### Ürünler (TikTok Developer Portal'da aktif)

1. **Login Kit**
   - Kullanıcı kimlik doğrulama
   - OAuth 2.0 akışı
   - Profil bilgilerine erişim

2. **Content Posting API**
   - Video yükleme (chunked upload)
   - Video yayınlama
   - Publish status takibi

3. **Share Kit**
   - Web-based paylaşım
   - Deep linking desteği

### Kapsamlar (Scopes)

```
user.info.basic    - Temel kullanıcı bilgileri (open_id, display_name, avatar_url, follower_count)
video.upload       - Video yükleme izni
video.publish      - Video yayınlama izni
video.list         - Kullanıcının videolarını listeleme
```

---

## ⚙️ Konfigürasyon

### Environment Değişkenleri (.env)

```env
# TikTok OAuth
TIKTOK_CLIENT_KEY=AW15HSO9IVWT9GT7
TIKTOK_CLIENT_SECRET=eOr2UMw6vaIeKrpc12mKOK8s05fZHvAQ
TIKTOK_REDIRECT_URI=https://ultrarslanoglu.com/auth/tiktok/callback
TIKTOK_SCOPE=user.info.basic,video.upload,video.publish,video.list
```

### Config Dosyası (config/index.js)

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

**Önemli Notlar:**
- ✅ Tüm değerler environment değişkenlerinden okunur
- ✅ Kodda hiçbir yerde hardcoded credential yok
- ✅ Redirect URI, TikTok Developer Portal'da kayıtlı olmalı

---

## 🔐 OAuth Akışı

### 1. Authorization URL Oluşturma

**Dosya:** `src/auth/tiktokAuth.js`

```javascript
getAuthorizationUrl(userId)
```

**Ne yapar:**
- CSRF token (state) oluşturur
- PKCE için code_verifier ve code_challenge oluşturur
- State ve verifier'ı geçici olarak saklar
- Authorization URL'ini döndürür

**Endpoint:** `GET /auth/tiktok/login`

**Örnek Flow:**
1. Kullanıcı "TikTok ile Bağlan" butonuna tıklar
2. Backend authorization URL'i oluşturur
3. Kullanıcı TikTok'a yönlendirilir
4. TikTok'ta izin verir
5. Callback URL'e geri döner

### 2. Callback İşlemi

**Dosya:** `src/auth/tiktokAuth.js`

```javascript
async handleCallback(code, state)
```

**Ne yapar:**
- State parametresini doğrular (CSRF koruması)
- Authorization code'u access token'a çevirir
- Refresh token alır
- Kullanıcı bilgilerini çeker
- Token'ı MongoDB'ye kaydeder

**Endpoint:** `GET /auth/tiktok/callback`

**Parametreler:**
- `code`: TikTok'tan gelen authorization code
- `state`: CSRF token

### 3. Token Yenileme

**Dosya:** `src/auth/tiktokAuth.js`

```javascript
async refreshAccessToken(refreshToken)
```

**Ne yapar:**
- Süresi dolmuş access token'ı yeniler
- Yeni refresh token alır
- Token'ı veritabanında günceller

**Otomatik Çalışma:**
- `ensureValidToken()` fonksiyonu her API call'dan önce token'ı kontrol eder
- Gerekirse otomatik yeniler

### 4. Bağlantıyı Kaldırma

**Dosya:** `src/auth/tiktokAuth.js`

```javascript
async revokeAccess(userId)
```

**Endpoint:** `POST /auth/tiktok/revoke`

**Ne yapar:**
- Token'ı veritabanında pasif yapar
- Kullanıcının connectedPlatforms listesinden kaldırır

---

## 📹 Content Posting API

### Video Upload Akışı

**Dosya:** `src/api/tiktok.js`

#### 1. Upload Initialization

```javascript
async uploadVideo(userId, videoPath, metadata)
```

**API Call:**
```
POST https://open.tiktokapis.com/v2/post/publish/video/init/
```

**Request Body:**
```json
{
  "post_info": {
    "title": "Video Başlığı",
    "description": "Video açıklaması",
    "privacy_level": "PUBLIC_TO_EVERYONE",
    "disable_duet": false,
    "disable_comment": false,
    "disable_stitch": false,
    "video_cover_timestamp_ms": 1000
  },
  "source_info": {
    "source": "FILE_UPLOAD",
    "video_size": 52428800,
    "chunk_size": 10485760,
    "total_chunk_count": 5
  }
}
```

**Response:**
```json
{
  "data": {
    "publish_id": "v_pub_12345",
    "upload_url": "https://..."
  }
}
```

#### 2. Chunked Upload

```javascript
async uploadVideoChunks(videoPath, uploadUrl, accessToken)
```

**Chunk Size:** 10MB (10485760 bytes)

**Process:**
1. Video dosyası chunk'lara bölünür
2. Her chunk sırayla upload URL'e PUT request ile gönderilir
3. Content-Range header'ı ile progress bilgisi gönderilir

**Örnek Header:**
```
Content-Range: bytes 0-10485759/52428800
```

#### 3. Publish Status

```javascript
async checkPublishStatus(userId, publishId)
```

**API Call:**
```
POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
```

**Response Status'ler:**
- `PUBLISH_COMPLETE`: Video başarıyla yayınlandı
- `PROCESSING_DOWNLOAD`: TikTok video'yu indiriyor
- `PROCESSING_UPLOAD`: Video işleniyor
- `FAILED`: Yayınlama başarısız

### Privacy Levels

1. **PUBLIC_TO_EVERYONE**: Herkes görebilir
2. **MUTUAL_FOLLOW_FRIENDS**: Sadece karşılıklı takipçiler
3. **SELF_ONLY**: Sadece kullanıcı (private)

### Upload Endpoint'i

**Endpoint:** `POST /api/upload/single`

**Form Data:**
```
video: [Binary File]
platform: tiktok
title: Video Başlığı
description: Video Açıklaması
tags: ["tag1", "tag2"]
privacy: PUBLIC_TO_EVERYONE
```

**Response:**
```json
{
  "success": true,
  "uploadId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "message": "Upload started",
  "status": "processing"
}
```

---

## 🔗 Share Kit

### Share URL Oluşturma

**Dosya:** `src/api/tiktok.js`

```javascript
generateShareUrl(options)
```

**Parametreler:**
```javascript
{
  url: 'https://example.com/video',      // Paylaşılacak URL (opsiyonel)
  title: 'Harika bir video!',            // Video başlığı (opsiyonel)
  hashtags: ['viral', 'trending']         // Hashtag'ler (opsiyonel)
}
```

**Dönen URL:**
```
https://www.tiktok.com/share?url=https%3A%2F%2Fexample.com%2Fvideo&title=Harika+bir+video&hashtags=viral,trending
```

### Share Kit Endpoint'leri

#### 1. Share URL Getir

**Endpoint:** `GET /api/tiktok/share`

**Query Parameters:**
```
url: https://example.com/video
title: Video Başlığı
hashtags: viral,trending,funny
```

**Response:**
```json
{
  "success": true,
  "shareUrl": "https://www.tiktok.com/share?url=...",
  "message": "Share URL generated. Redirect user to this URL to initiate TikTok sharing."
}
```

#### 2. Share'e Yönlendir

**Endpoint:** `POST /api/tiktok/share/redirect`

**Request Body:**
```json
{
  "url": "https://example.com/video",
  "title": "Video Başlığı",
  "hashtags": ["viral", "trending"]
}
```

**Response:** HTTP 302 Redirect to TikTok Share URL

### Kullanım Senaryosu

```javascript
// Frontend'den örnek kullanım
async function shareToTikTok(videoUrl, title) {
  const response = await fetch('/api/tiktok/share', {
    method: 'GET',
    params: new URLSearchParams({
      url: videoUrl,
      title: title,
      hashtags: 'viral,trending'
    })
  });
  
  const data = await response.json();
  
  // Kullanıcıyı TikTok'a yönlendir
  window.location.href = data.shareUrl;
}
```

---

## 📊 Analytics ve Video Yönetimi

### 1. Video Listesi

**Dosya:** `src/api/tiktok.js`

```javascript
async getVideoList(userId, cursor = '', maxCount = 20)
```

**Endpoint:** `GET /api/tiktok/videos`

**Query Parameters:**
- `cursor`: Pagination cursor (opsiyonel)
- `maxCount`: Video sayısı (default: 20, max: 20)

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "id": "video_123",
      "title": "Video Başlığı",
      "create_time": 1703001600,
      "cover_image_url": "https://...",
      "share_url": "https://tiktok.com/@user/video/123",
      "duration": 30,
      "height": 1920,
      "width": 1080
    }
  ],
  "cursor": "next_page_token",
  "hasMore": true
}
```

### 2. Video Analytics

**Dosya:** `src/api/tiktok.js`

```javascript
async getVideoAnalytics(userId, videoIds)
```

**Endpoint:** `GET /api/tiktok/video/:videoId/analytics`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "videoId": "video_123",
    "title": "Video Başlığı",
    "views": 150000,
    "likes": 12500,
    "comments": 450,
    "shares": 320,
    "engagement": 0.0862,
    "url": "https://tiktok.com/@user/video/123",
    "createdAt": "2024-12-20T10:00:00Z"
  }
}
```

### 3. Creator Analytics

**Dosya:** `src/api/tiktok.js`

```javascript
async getCreatorAnalytics(userId)
```

**Endpoint:** `GET /api/tiktok/creator/analytics`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "displayName": "UltraRslanoglu",
    "followers": 25000,
    "following": 120,
    "totalLikes": 450000,
    "totalVideos": 85,
    "profileUrl": "https://tiktok.com/@ultrarslanoglu"
  }
}
```

### 4. Video Yorumları

**Dosya:** `src/api/tiktok.js`

```javascript
async getVideoComments(userId, videoId, cursor = '', count = 50)
```

**Endpoint:** `GET /api/tiktok/video/:videoId/comments`

**Response:**
```json
{
  "success": true,
  "comments": [
    {
      "id": "comment_123",
      "text": "Harika video!",
      "create_time": 1703002800,
      "like_count": 45,
      "reply_count": 3
    }
  ],
  "cursor": "next_page_token",
  "hasMore": true
}
```

### 5. Privacy Güncelleme

**Dosya:** `src/api/tiktok.js`

```javascript
async updateVideoPrivacy(userId, videoId, privacyLevel)
```

**Endpoint:** `PUT /api/tiktok/video/:videoId/privacy`

**Request Body:**
```json
{
  "privacyLevel": "MUTUAL_FOLLOW_FRIENDS"
}
```

**Valid Privacy Levels:**
- `PUBLIC_TO_EVERYONE`
- `MUTUAL_FOLLOW_FRIENDS`
- `SELF_ONLY`

---

## 🔌 API Endpoint'leri

### OAuth Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/auth/tiktok/login` | OAuth akışını başlat |
| GET | `/auth/tiktok/callback` | OAuth callback |
| POST | `/auth/tiktok/revoke` | Bağlantıyı kaldır |
| GET | `/auth/status` | Bağlı platformları listele |

### Upload Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/upload/single` | Tek platforma upload |
| POST | `/api/upload/multiple` | Çoklu platforma upload |
| POST | `/api/upload/schedule` | Zamanlanmış upload |
| GET | `/api/upload/status/:uploadId` | Upload durumu |
| GET | `/api/upload/history` | Upload geçmişi |

### TikTok Specific Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/tiktok/share` | Share URL oluştur |
| POST | `/api/tiktok/share/redirect` | Share'e yönlendir |
| GET | `/api/tiktok/videos` | Video listesi |
| GET | `/api/tiktok/video/:videoId/analytics` | Video analytics |
| GET | `/api/tiktok/creator/analytics` | Creator analytics |
| GET | `/api/tiktok/publish/status/:publishId` | Publish durumu |
| GET | `/api/tiktok/video/:videoId/comments` | Video yorumları |
| PUT | `/api/tiktok/video/:videoId/privacy` | Privacy güncelle |
| DELETE | `/api/tiktok/video/:videoId` | Video sil |

---

## 💡 Kullanım Örnekleri

### 1. TikTok OAuth Bağlantısı

```javascript
// Frontend
window.location.href = '/auth/tiktok/login';

// Backend otomatik olarak:
// 1. Authorization URL oluşturur
// 2. TikTok'a yönlendirir
// 3. Callback'i işler
// 4. Token'ı kaydeder
// 5. Dashboard'a yönlendirir
```

### 2. Video Upload

```javascript
// Frontend - Form Data
const formData = new FormData();
formData.append('video', videoFile);
formData.append('platform', 'tiktok');
formData.append('title', 'Harika Bir Video');
formData.append('description', 'Bu videoyu çok beğeneceksiniz!');
formData.append('tags', JSON.stringify(['viral', 'trending']));
formData.append('privacy', 'PUBLIC_TO_EVERYONE');

const response = await fetch('/api/upload/single', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Upload ID:', result.uploadId);
```

### 3. Upload Status Kontrolü

```javascript
// Upload durumunu polling ile kontrol
async function checkUploadStatus(uploadId) {
  const response = await fetch(`/api/upload/status/${uploadId}`);
  const data = await response.json();
  
  if (data.overallStatus === 'success') {
    console.log('Video başarıyla yayınlandı!');
    console.log('Platform sonuçları:', data.platforms);
  } else if (data.overallStatus === 'failed') {
    console.log('Upload başarısız:', data.platforms);
  } else {
    // Hala işleniyor, 5 saniye sonra tekrar kontrol et
    setTimeout(() => checkUploadStatus(uploadId), 5000);
  }
}
```

### 4. Video Analytics

```javascript
// Creator analytics
const creatorStats = await fetch('/api/tiktok/creator/analytics');
const data = await creatorStats.json();

console.log(`Takipçi: ${data.analytics.followers}`);
console.log(`Toplam Video: ${data.analytics.totalVideos}`);
console.log(`Toplam Beğeni: ${data.analytics.totalLikes}`);

// Specific video analytics
const videoStats = await fetch('/api/tiktok/video/video_123/analytics');
const videoData = await videoStats.json();

console.log(`Görüntülenme: ${videoData.analytics.views}`);
console.log(`Engagement: ${(videoData.analytics.engagement * 100).toFixed(2)}%`);
```

### 5. Share Kit Kullanımı

```javascript
// Share URL oluştur
const shareResponse = await fetch('/api/tiktok/share?' + new URLSearchParams({
  url: 'https://example.com/my-video',
  title: 'Bu videoyu izlemelisiniz!',
  hashtags: 'viral,trending,funny'
}));

const shareData = await shareResponse.json();

// Kullanıcıyı TikTok Share sayfasına yönlendir
window.open(shareData.shareUrl, '_blank');
```

---

## ⚠️ Hata Yönetimi

### Yaygın Hatalar ve Çözümleri

#### 1. Authentication Error

```json
{
  "error": "User not authenticated",
  "status": 401
}
```

**Çözüm:** Kullanıcı login olmamış. OAuth akışını başlatın.

#### 2. Token Expired

```json
{
  "error": "Token expired",
  "status": 401
}
```

**Çözüm:** Token otomatik yenilenir. Eğer refresh token da geçersizse, kullanıcı tekrar bağlanmalı.

#### 3. Invalid Scope

```json
{
  "error": "Insufficient permissions",
  "status": 403
}
```

**Çözüm:** Gerekli scope'lar OAuth'ta istenmemiş. TikTok Developer Portal'da scope'ları kontrol edin.

#### 4. Upload Failed

```json
{
  "error": "Video upload failed",
  "platform": "tiktok",
  "platformError": "File size exceeds limit"
}
```

**Çözüm:**
- Video boyutunu kontrol edin (max: 4GB)
- Video formatını kontrol edin (MP4 önerilir)
- Video codec: H.264 veya H.265
- Audio codec: AAC

#### 5. Rate Limit

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

**Çözüm:** TikTok API rate limit'ine ulaştınız. `retryAfter` süre kadar bekleyin.

### Error Logging

Tüm hatalar Winston ile loglanır:

```javascript
// logs/error.log dosyasında
logger.error('TikTok upload error:', error);
```

---

## 🔒 Güvenlik Önlemleri

### 1. PKCE (Proof Key for Code Exchange)

```javascript
// Code verifier (43-128 karakter, base64url)
generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

// Code challenge (SHA256 hash)
generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}
```

### 2. State Parameter (CSRF Koruması)

```javascript
// Her OAuth akışında unique state
const csrfState = crypto.randomBytes(16).toString('hex');

// Callback'de doğrulama
if (!global.authStates[state]) {
  throw new Error('Invalid state parameter');
}
```

### 3. Token Güvenliği

- Access token ve refresh token MongoDB'de `selected: false` ile saklanır
- Sadece gerektiğinde `select('+accessToken')` ile okunur
- HTTPS zorunlu (production)
- Session secret güçlü olmalı

### 4. Rate Limiting

```javascript
// API endpoint'leri için rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // 100 request
});
```

---

## 📚 Kaynaklar

- [TikTok for Developers](https://developers.tiktok.com/)
- [Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Share Kit Documentation](https://developers.tiktok.com/doc/share-kit-web)

---

## 🆘 Destek

Sorun yaşarsanız:
- GitHub Issues: [Create issue](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)
- Email: support@ultrarslanoglu.com
- TikTok Developer Forum: [Community](https://developers.tiktok.com/community)

---

**Not:** Bu dokümantasyon TikTok API v2'ye göre hazırlanmıştır. API güncellemelerini takip etmeyi unutmayın.
