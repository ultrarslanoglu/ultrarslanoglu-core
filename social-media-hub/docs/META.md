# Meta (Facebook/Instagram) Entegrasyonu Dokümantasyonu

Bu döküman, Ultrarslanoglu Social Media Hub'ın Meta (Facebook & Instagram) entegrasyonunu detaylı şekilde açıklar.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [App Konfigürasyonu](#app-konfigürasyonu)
3. [OAuth 2.0 Akışı](#oauth-20-akışı)
4. [Instagram Reels Upload](#instagram-reels-upload)
5. [Facebook Video Upload](#facebook-video-upload)
6. [Analytics ve Insights](#analytics-ve-insights)
7. [Data Deletion (Facebook Requirement)](#data-deletion)
8. [API Endpoint'leri](#api-endpointleri)
9. [Kullanım Örnekleri](#kullanım-örnekleri)
10. [Webhook Entegrasyonu](#webhook-entegrasyonu)

---

## 🎯 Genel Bakış

Meta entegrasyonu, aşağıdaki özellikleri sunar:

- ✅ **Facebook Login**: OAuth 2.0 ile güvenli kullanıcı kimlik doğrulama
- ✅ **Instagram Content Publishing**: Reels ve feed post yükleme
- ✅ **Facebook Pages API**: Sayfa yönetimi ve video yükleme
- ✅ **Instagram Insights**: Medya ve hesap analytics
- ✅ **Facebook Page Insights**: Sayfa performans metrikleri
- ✅ **Long-Lived Tokens**: 60 günlük token geçerliliği
- ✅ **Data Deletion Callback**: Facebook gereksinimi

---

## ⚙️ App Konfigürasyonu

### Meta Developer App Ayarları

**App Bilgileri:**
- App ID: `1044312946768719`
- App Domain: `ultrarslanoglu.com`
- Contact Email: `info@ultrarslanoglu.com`
- Privacy Policy: `https://ultrarslanoglu.com/privacy-policy.html`
- Terms of Service: `https://ultrarslanoglu.com/terms-of-service.html`
- Data Deletion URL: `https://ultrarslanoglu.com/data-deletion.html`
- Business Verification: ✅ Completed
- Category: Business and Pages

### Environment Değişkenleri (.env)

```env
# Meta (Facebook & Instagram) OAuth
META_APP_ID=1044312946768719
META_APP_SECRET=your-app-secret-here
META_REDIRECT_URI=https://ultrarslanoglu.com/auth/meta/callback
META_APP_DOMAIN=ultrarslanoglu.com
META_SCOPE=public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights

# Meta Webhook (Opsiyonel)
META_WEBHOOK_VERIFY_TOKEN=ultrarslanoglu_verify_token
```

### Config Dosyası (config/index.js)

```javascript
meta: {
  appId: process.env.META_APP_ID,
  appSecret: process.env.META_APP_SECRET,
  redirectUri: process.env.META_REDIRECT_URI,
  appDomain: process.env.META_APP_DOMAIN,
  scope: process.env.META_SCOPE,
  authorizationURL: 'https://www.facebook.com/v19.0/dialog/oauth',
  tokenURL: 'https://graph.facebook.com/v19.0/oauth/access_token',
  apiBaseURL: 'https://graph.facebook.com/v19.0/',
  apiVersion: 'v19.0'
}
```

### Gerekli Scope'lar

| Scope | Açıklama | Kullanım |
|-------|----------|----------|
| `public_profile` | Temel profil bilgileri | Kullanıcı kimliği |
| `email` | Email adresi | İletişim |
| `pages_show_list` | Kullanıcının page'lerini listele | Page seçimi |
| `pages_read_engagement` | Page engagement metrikleri | Analytics |
| `pages_manage_posts` | Page'e post yönetimi | Video upload |
| `instagram_basic` | Temel Instagram bilgileri | Hesap yönetimi |
| `instagram_content_publish` | Instagram'a içerik yükleme | Reels upload |
| `instagram_manage_insights` | Instagram insights | Analytics |

---

## 🔐 OAuth 2.0 Akışı

### 1. Authorization URL Oluşturma

**Dosya:** `src/auth/metaAuth.js`

```javascript
getAuthorizationUrl(userId)
```

**Ne yapar:**
- CSRF state token oluşturur
- Authorization URL'ini oluşturur
- User'ı geçici olarak saklar

**Endpoint:** `GET /auth/meta/login`

**Authorization URL Formatı:**
```
https://www.facebook.com/v19.0/dialog/oauth?
  client_id=1044312946768719
  &redirect_uri=https://ultrarslanoglu.com/auth/meta/callback
  &state=CSRF_TOKEN
  &scope=public_profile,email,pages_show_list,...
  &response_type=code
```

### 2. Callback İşlemi (2 Aşamalı Token Exchange)

**Dosya:** `src/auth/metaAuth.js`

**Aşama 1: Short-Lived Token**
```javascript
// Authorization code → Short-lived access token (1-2 saat)
GET /oauth/access_token?
  client_id=APP_ID
  &client_secret=APP_SECRET
  &redirect_uri=REDIRECT_URI
  &code=AUTHORIZATION_CODE
```

**Aşama 2: Long-Lived Token**
```javascript
// Short-lived → Long-lived token (60 gün)
GET /oauth/access_token?
  grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN
```

**Response:**
```json
{
  "access_token": "long_lived_token_here",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

### 3. Kullanıcı Bilgilerini Çekme

```javascript
async getUserInfo(accessToken)
```

**API Call:**
```
GET /me?fields=id,name,email,accounts{id,name,access_token,instagram_business_account}
```

**Response:**
```json
{
  "id": "123456789",
  "name": "Ultrarslanoglu",
  "email": "info@ultrarslanoglu.com",
  "accounts": {
    "data": [
      {
        "id": "page_123",
        "name": "Ultrarslanoglu Page",
        "access_token": "page_token",
        "instagram_business_account": {
          "id": "ig_account_123"
        }
      }
    ]
  }
}
```

### 4. Instagram Business Accounts

```javascript
async getInstagramAccounts(accessToken, userId)
```

**Ne yapar:**
- Kullanıcının Facebook Page'lerini çeker
- Her page'in Instagram Business Account'unu bulur
- Username, follower count gibi bilgileri getirir

**Dönen Veri:**
```javascript
[
  {
    pageId: "page_123",
    instagramId: "ig_account_123",
    username: "ultrarslanoglu",
    profilePicture: "https://...",
    followersCount: 25000
  }
]
```

### 5. Token Yenileme

**Long-lived token'lar 60 gün geçerlidir.**

```javascript
async refreshAccessToken(currentToken)
```

**API Call:**
```
GET /oauth/access_token?
  grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=CURRENT_TOKEN
```

**Otomatik Yenileme:**
- `ensureValidToken()` fonksiyonu her API call öncesi token'ı kontrol eder
- Token'ın süresinin 30 günden az kalması durumunda otomatik yeniler

### 6. Token Debug

```javascript
async debugToken(accessToken)
```

**API Call:**
```
GET /debug_token?
  input_token=USER_TOKEN
  &access_token=APP_ID|APP_SECRET
```

**Response:**
```json
{
  "data": {
    "app_id": "1044312946768719",
    "type": "USER",
    "user_id": "123456789",
    "is_valid": true,
    "expires_at": 1735689600,
    "issued_at": 1730505600,
    "scopes": ["public_profile", "email", ...]
  }
}
```

---

## 📸 Instagram Reels Upload

### Upload Akışı (2 Aşamalı)

**Dosya:** `src/api/meta.js`

#### Aşama 1: Container Oluşturma

```javascript
async uploadInstagramReel(userId, videoUrl, metadata)
```

**Önemli:** Video public URL olmalı! Meta sunucuları bu URL'den video'yu indirer.

**API Call:**
```
POST /{ig-account-id}/media
```

**Request Body:**
```json
{
  "media_type": "REELS",
  "video_url": "https://ultrarslanoglu.com/videos/my-reel.mp4",
  "caption": "Harika bir Reel! #viral #trending",
  "share_to_feed": true,
  "cover_url": "https://ultrarslanoglu.com/thumbnails/cover.jpg",
  "thumb_offset": 0
}
```

**Response:**
```json
{
  "id": "container_123"
}
```

#### Aşama 2: Container Status Kontrolü

```javascript
async waitForContainerReady(igAccountId, containerId, accessToken)
```

**Status'ler:**
- `EXPIRED`: Container süresi dolmuş
- `ERROR`: Hata oluştu
- `FINISHED`: İşlem tamamlandı, publish edilebilir
- `IN_PROGRESS`: Hala işleniyor
- `PUBLISHED`: Yayınlanmış

**Bekleme Süresi:** Her 3 saniyede kontrol, max 10 deneme (30 saniye)

#### Aşama 3: Publish

**API Call:**
```
POST /{ig-account-id}/media_publish
```

**Request Body:**
```json
{
  "creation_id": "container_123"
}
```

**Response:**
```json
{
  "id": "media_456"
}
```

### Video Gereksinimleri

**Teknik Özellikler:**
- Format: MP4 veya MOV
- Codec: H.264
- Audio: AAC
- Aspect Ratio: 9:16 (dikey) önerilir
- Duration: 3-90 saniye
- Max File Size: 1GB
- Min Resolution: 500x888 piksel

**Caption:**
- Max 2,200 karakter
- Hashtag'ler dahil
- @mention'lar desteklenir

### Endpoint Kullanımı

**Endpoint:** `POST /api/upload/single`

**Form Data:**
```
video: [Binary File]
platform: instagram
instagramAccountId: ig_account_123
publicVideoUrl: https://ultrarslanoglu.com/temp/video.mp4
title: Reel Başlığı
description: Açıklama
hashtags: ["viral", "trending", "funny"]
shareToFeed: true
```

---

## 🎥 Facebook Video Upload

### Resumable Upload Akışı (3 Aşamalı)

**Dosya:** `src/api/meta.js`

#### Aşama 1: Start

```javascript
async uploadFacebookVideo(userId, videoPath, metadata)
```

**API Call:**
```
POST /{page-id}/videos
```

**Request Body:**
```json
{
  "upload_phase": "start",
  "file_size": 52428800
}
```

**Response:**
```json
{
  "video_id": "video_123",
  "upload_session_id": "session_456",
  "start_offset": 0,
  "end_offset": 52428800
}
```

#### Aşama 2: Transfer

**API Call:**
```
POST /{page-id}/videos
```

**Form Data:**
```
upload_phase: transfer
upload_session_id: session_456
video_file_chunk: [Binary Data]
```

**Chunked Upload:** Büyük dosyalar için chunk'lara bölünebilir

#### Aşama 3: Finish

**API Call:**
```
POST /{page-id}/videos
```

**Request Body:**
```json
{
  "upload_phase": "finish",
  "upload_session_id": "session_456",
  "title": "Video Başlığı",
  "description": "Video açıklaması",
  "published": true
}
```

**Response:**
```json
{
  "id": "post_789",
  "success": true
}
```

### Video Gereksinimleri

**Teknik Özellikler:**
- Format: MP4, MOV, AVI
- Max File Size: 10GB
- Max Duration: 240 dakika
- Min Resolution: 600x315 piksel
- Aspect Ratio: 16:9, 9:16, 1:1, 4:5

### Endpoint Kullanımı

**Endpoint:** `POST /api/upload/single`

**Form Data:**
```
video: [Binary File]
platform: facebook
pageId: page_123
title: Video Başlığı
description: Video Açıklaması
published: true
```

---

## 📊 Analytics ve Insights

### Instagram Media Insights

**Dosya:** `src/api/meta.js`

```javascript
async getInstagramMediaInsights(userId, mediaId, metrics)
```

**Endpoint:** `GET /api/meta/instagram/media/:mediaId/insights`

**Available Metrics:**
- `impressions` - Gösterim sayısı
- `reach` - Ulaşılan kişi sayısı
- `likes` - Beğeni sayısı
- `comments` - Yorum sayısı
- `shares` - Paylaşım sayısı
- `saves` - Kaydetme sayısı
- `plays` - İzlenme sayısı (video)
- `total_interactions` - Toplam etkileşim

**Response:**
```json
{
  "success": true,
  "mediaId": "media_123",
  "insights": {
    "impressions": 15000,
    "reach": 12000,
    "likes": 850,
    "comments": 120,
    "shares": 45,
    "saves": 230,
    "plays": 14000,
    "total_interactions": 1245
  }
}
```

### Instagram Account Insights

```javascript
async getInstagramAccountInsights(userId, igAccountId, metrics, period)
```

**Endpoint:** `GET /api/meta/instagram/account/:accountId/insights`

**Available Metrics:**
- `impressions` - Toplam gösterim
- `reach` - Toplam ulaşım
- `follower_count` - Takipçi sayısı
- `profile_views` - Profil görüntüleme
- `website_clicks` - Website tıklama

**Period Options:**
- `day` - Günlük
- `week` - Haftalık
- `days_28` - 28 günlük

**Query Parameters:**
```
?metrics=impressions,reach,follower_count&period=day
```

**Response:**
```json
{
  "success": true,
  "accountId": "ig_account_123",
  "insights": {
    "impressions": 45000,
    "reach": 35000,
    "follower_count": 25000,
    "profile_views": 1200,
    "website_clicks": 340
  }
}
```

### Facebook Page Insights

```javascript
async getFacebookPageInsights(userId, pageId, metrics, period)
```

**Endpoint:** `GET /api/meta/facebook/page/:pageId/insights`

**Available Metrics:**
- `page_impressions` - Sayfa gösterimi
- `page_engaged_users` - Etkileşimli kullanıcılar
- `page_video_views` - Video görüntüleme
- `page_fan_adds` - Yeni takipçi
- `page_post_engagements` - Post etkileşimi

**Response:**
```json
{
  "success": true,
  "pageId": "page_123",
  "insights": {
    "page_impressions": 125000,
    "page_engaged_users": 8500,
    "page_video_views": 45000,
    "page_fan_adds": 320,
    "page_post_engagements": 6200
  }
}
```

### Instagram Media List

```javascript
async getInstagramMediaList(userId, igAccountId, limit)
```

**Endpoint:** `GET /api/meta/instagram/:accountId/media`

**Response:**
```json
{
  "success": true,
  "media": [
    {
      "id": "media_123",
      "media_type": "REELS",
      "media_url": "https://...",
      "permalink": "https://instagram.com/p/ABC123",
      "caption": "Harika bir Reel!",
      "timestamp": "2025-12-20T10:00:00+0000",
      "like_count": 850,
      "comments_count": 120
    }
  ],
  "paging": {
    "cursors": {
      "before": "...",
      "after": "..."
    },
    "next": "..."
  }
}
```

---

## 🗑️ Data Deletion (Facebook Requirement)

Facebook, tüm uygulamaların Data Deletion Callback URL'i sağlamasını gerektirir.

### Data Deletion URL

**URL:** `https://ultrarslanoglu.com/data-deletion.html`

**HTML Sayfası:** `public/data-deletion.html`

### Data Deletion Callback Endpoint

**Endpoint:** `POST /api/meta/data-deletion`

**Dosya:** `src/routes/metaRoutes.js`

#### Facebook Callback Request

Facebook bu endpoint'e şu formatta request gönderir:

```json
{
  "signed_request": "ENCODED_SIGNATURE.PAYLOAD"
}
```

**Signed Request Decode:**
```javascript
const [encodedSig, payload] = signed_request.split('.');
const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
// data.user_id → Facebook User ID
```

#### Response Format (Required by Facebook)

```json
{
  "url": "https://ultrarslanoglu.com/data-deletion-status/123456789_1703001600000",
  "confirmation_code": "123456789_1703001600000"
}
```

#### İşlem Adımları

1. Facebook User ID'yi al
2. Token'ları bul ve pasif yap
3. Kullanıcının connected platforms'undan Meta'yı kaldır
4. Confirmation code oluştur
5. Status URL döndür

#### Manuel Deletion Request

Kullanıcılar data-deletion.html sayfasından da silme isteği gönderebilir:

```json
{
  "email": "user@example.com",
  "userId": "optional_facebook_user_id"
}
```

### Status Check Endpoint

**Endpoint:** `GET /api/meta/data-deletion-status/:code`

HTML sayfası döndürür, silme işleminin tamamlandığını gösterir.

---

## 🔌 API Endpoint'leri

### OAuth Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/auth/meta/login` | OAuth akışını başlat |
| GET | `/auth/meta/callback` | OAuth callback |
| POST | `/auth/meta/revoke` | Bağlantıyı kaldır |

### Instagram Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/meta/instagram/accounts` | IG Business hesaplarını listele |
| GET | `/api/meta/instagram/:accountId/media` | Medya listesi |
| GET | `/api/meta/instagram/media/:mediaId/insights` | Media insights |
| GET | `/api/meta/instagram/account/:accountId/insights` | Account insights |

### Facebook Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/meta/facebook/pages` | Facebook Page'leri listele |
| GET | `/api/meta/facebook/page/:pageId/insights` | Page insights |

### Token Management

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/meta/refresh-token` | Token'ı manuel yenile |
| GET | `/api/meta/token-status` | Token durumu ve debug |

### Data Deletion

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/meta/data-deletion` | Data deletion callback |
| GET | `/api/meta/data-deletion-status/:code` | Deletion status |
| GET | `/data-deletion` | Data deletion form (HTML) |

### Webhook (Optional)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/meta/webhook` | Webhook verification |
| POST | `/api/meta/webhook` | Webhook events |

---

## 💡 Kullanım Örnekleri

### 1. Meta OAuth Bağlantısı

```javascript
// Frontend
window.location.href = '/auth/meta/login';

// Backend otomatik:
// 1. Authorization URL oluşturur
// 2. Facebook/Instagram'a yönlendirir
// 3. Callback'i işler
// 4. Short-lived → Long-lived token
// 5. Kullanıcı bilgilerini çeker
// 6. Instagram hesaplarını bulur
// 7. Token'ı MongoDB'ye kaydeder
```

### 2. Instagram Hesapları Listeleme

```javascript
const response = await fetch('/api/meta/instagram/accounts', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const data = await response.json();
console.log('Instagram Accounts:', data.accounts);

// Response:
// {
//   success: true,
//   accounts: [
//     {
//       pageId: "page_123",
//       instagramId: "ig_account_123",
//       username: "ultrarslanoglu",
//       followersCount: 25000
//     }
//   ]
// }
```

### 3. Instagram Reel Upload

```javascript
// 1. Video'yu sunucuya yükle
const formData = new FormData();
formData.append('video', videoFile);
formData.append('platform', 'instagram');
formData.append('instagramAccountId', 'ig_account_123');
formData.append('publicVideoUrl', 'https://ultrarslanoglu.com/temp/video.mp4');
formData.append('title', 'Harika Reel');
formData.append('description', 'Bu Reel'i seveceksiniz!');
formData.append('hashtags', JSON.stringify(['viral', 'trending']));
formData.append('shareToFeed', 'true');

const response = await fetch('/api/upload/single', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});

const result = await response.json();
console.log('Upload ID:', result.uploadId);

// 2. Status kontrolü
async function checkStatus(uploadId) {
  const statusRes = await fetch(`/api/upload/status/${uploadId}`);
  const status = await statusRes.json();
  
  if (status.overallStatus === 'success') {
    console.log('Reel yayınlandı!', status.platforms);
  } else if (status.overallStatus === 'publishing') {
    // 5 saniye sonra tekrar kontrol et
    setTimeout(() => checkStatus(uploadId), 5000);
  }
}
```

### 4. Instagram Media Insights

```javascript
const mediaId = 'media_123';
const response = await fetch(
  `/api/meta/instagram/media/${mediaId}/insights?metrics=impressions,reach,likes,comments`,
  {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  }
);

const data = await response.json();
console.log('Media Insights:', data.insights);

// Response:
// {
//   impressions: 15000,
//   reach: 12000,
//   likes: 850,
//   comments: 120
// }
```

### 5. Facebook Video Upload

```javascript
const formData = new FormData();
formData.append('video', videoFile);
formData.append('platform', 'facebook');
formData.append('pageId', 'page_123');
formData.append('title', 'Video Başlığı');
formData.append('description', 'Video açıklaması');
formData.append('published', 'true');

const response = await fetch('/api/upload/single', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Upload başladı:', result.uploadId);
```

### 6. Token Status Kontrolü

```javascript
const response = await fetch('/api/meta/token-status', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});

const data = await response.json();

console.log('Token geçerli mi?', data.tokenInfo.isValid);
console.log('Süre bitiş:', data.tokenInfo.expiresAt);
console.log('Scope\'lar:', data.tokenInfo.scopes);
```

---

## 🔗 Webhook Entegrasyonu (Opsiyonel)

### Webhook Nedir?

Facebook/Instagram, belirli olaylar gerçekleştiğinde (yeni yorum, mention, vs.) uygulamanıza bildirim gönderir.

### Setup (Meta Developer Dashboard)

1. Products → Webhooks
2. Callback URL: `https://ultrarslanoglu.com/api/meta/webhook`
3. Verify Token: `ultrarslanoglu_verify_token`
4. Subscribe to events

### Verification Endpoint

**Endpoint:** `GET /api/meta/webhook`

**Facebook Request:**
```
GET /api/meta/webhook?
  hub.mode=subscribe
  &hub.verify_token=ultrarslanoglu_verify_token
  &hub.challenge=RANDOM_STRING
```

**Response:**
```
RANDOM_STRING
```

### Event Endpoint

**Endpoint:** `POST /api/meta/webhook`

**Facebook Request:**
```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "ig_account_123",
      "time": 1703001600,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "comment_456",
            "text": "Harika post!"
          }
        }
      ]
    }
  ]
}
```

**Event Types:**
- `comments` - Yeni yorum
- `mentions` - Mention
- `feed` - Feed değişiklikleri
- `live_comments` - Canlı yayın yorumları

---

## ⚠️ Hata Yönetimi

### Yaygın Hatalar

#### 1. Invalid OAuth Code

```json
{
  "error": {
    "message": "Error validating verification code",
    "type": "OAuthException",
    "code": 100
  }
}
```

**Çözüm:** Authorization code tek kullanımlıktır. Yeni OAuth akışı başlatın.

#### 2. Expired Token

```json
{
  "error": {
    "message": "Error validating access token",
    "type": "OAuthException",
    "code": 190
  }
}
```

**Çözüm:** Token'ı yenileyin veya kullanıcı tekrar login olsun.

#### 3. Insufficient Permissions

```json
{
  "error": {
    "message": "Insufficient permissions",
    "type": "OAuthException",
    "code": 200
  }
}
```

**Çözüm:** Gerekli scope'lar OAuth'ta istenmemiş. Kullanıcı tekrar authorize etmeli.

#### 4. Container Not Ready

```json
{
  "error": {
    "message": "Media container is not ready",
    "type": "IGApiException"
  }
}
```

**Çözüm:** `waitForContainerReady()` fonksiyonu otomatik bekler. Timeout süresini artırabilirsiniz.

#### 5. Video URL Not Accessible

```json
{
  "error": {
    "message": "Video URL is not accessible",
    "type": "IGApiException"
  }
}
```

**Çözüm:** 
- Video URL public olmalı
- HTTPS zorunlu
- Meta sunucuları erişebilmeli

---

## 🔒 Güvenlik

### 1. Environment Değişkenleri

- ✅ Tüm credential'lar .env'de
- ✅ APP_SECRET asla frontend'e gönderilmez
- ✅ .gitignore ile korunuyor

### 2. CSRF Koruması

- ✅ State parameter ile
- ✅ Her OAuth akışında unique
- ✅ Callback'de doğrulanır

### 3. Token Güvenliği

- ✅ Long-lived token'lar 60 gün geçerli
- ✅ MongoDB'de `selected: false`
- ✅ Sadece gerektiğinde okunur
- ✅ HTTPS zorunlu (production)

### 4. Data Deletion

- ✅ Facebook requirement
- ✅ GDPR compliance
- ✅ User data silme garantisi

---

## 📚 Kaynaklar

- [Meta for Developers](https://developers.facebook.com/)
- [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)

---

## 🆘 Destek

Sorun yaşarsanız:
- Email: info@ultrarslanoglu.com
- Meta Developer Community: [Forum](https://developers.facebook.com/community/)
- GitHub Issues: [Create issue](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)

---

**Not:** Bu dokümantasyon Meta Graph API v19.0 kullanmaktadır. API güncellemelerini takip etmeyi unutmayın.
