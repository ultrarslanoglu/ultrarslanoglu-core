# Meta (Facebook/Instagram) Entegrasyonu - Dosya ve Fonksiyon Özeti

## 📁 Oluşturulan/Güncellenen Dosyalar

### 1. **.env.example** (Güncellendi)

**Amaç:** Environment değişkenleri şablonu

**Önemli Değişiklikler:**
- ✅ `META_APP_ID` gerçek değer: 1044312946768719
- ✅ `META_APP_DOMAIN` eklendi: ultrarslanoglu.com
- ✅ Scope'lar genişletildi (8 scope)

**Kod:**
```env
META_APP_ID=1044312946768719
META_APP_SECRET=your-meta-app-secret-here
META_REDIRECT_URI=https://ultrarslanoglu.com/auth/meta/callback
META_APP_DOMAIN=ultrarslanoglu.com
META_SCOPE=public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights
```

---

### 2. **config/index.js** (Güncellendi)

**Amaç:** Meta konfigürasyon ayarlarını yönetir

**Önemli Değişiklikler:**
- ✅ `appDomain` eklendi
- ✅ API version v19.0'a güncellendi
- ✅ Tüm scope'lar environment'tan okunuyor

**Kod:**
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

---

### 3. **src/auth/metaAuth.js** (Mevcut - İyileştirilmiş)

**Amaç:** Meta OAuth 2.0 authentication servisi

**Ana Fonksiyonlar:**

#### `getAuthorizationUrl(userId)`
**Ne yapar:**
- OAuth akışını başlatır
- CSRF state token oluşturur
- Authorization URL döndürür

**Kullanım:**
```javascript
const authUrl = metaAuth.getAuthorizationUrl(userId);
// Returns: https://www.facebook.com/v19.0/dialog/oauth?client_id=...
```

#### `handleCallback(code, state)` ⭐ 2 AŞAMALI TOKEN EXCHANGE
**Ne yapar:**
1. Authorization code → Short-lived token (1-2 saat)
2. Short-lived token → Long-lived token (60 gün)
3. Kullanıcı bilgilerini çeker
4. Instagram Business hesaplarını bulur
5. Token'ı MongoDB'ye kaydeder

**Kullanım:**
```javascript
const result = await metaAuth.handleCallback(code, state);
// Returns: { success, token, userInfo, instagramAccounts }
```

#### `getUserInfo(accessToken)`
**Ne yapar:**
- Kullanıcının temel bilgilerini çeker
- Facebook Page'lerini listeler
- Her page'in Instagram Business Account'unu getirir

**API Call:**
```
GET /me?fields=id,name,email,accounts{id,name,access_token,instagram_business_account}
```

#### `getInstagramAccounts(accessToken, userId)`
**Ne yapar:**
- Facebook Page'lerini tarar
- Instagram Business Account'ları bulur
- Username, follower count, profile picture getirir

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

#### `refreshAccessToken(currentToken)`
**Ne yapar:**
- Long-lived token'ı yeniler
- Yeni 60 günlük token alır

**API Call:**
```
GET /oauth/access_token?grant_type=fb_exchange_token&...
```

#### `ensureValidToken(userId)`
**Ne yapar:**
- Token'ın geçerliliğini kontrol eder
- Token süresinin 30 günden az kalması durumunda otomatik yeniler
- Her API call öncesi kullanılır

**Token Debug:**
- `debugToken()` ile token bilgilerini kontrol eder
- Valid, expires_at, issued_at, scopes bilgilerini alır

#### `revokeAccess(userId)`
**Ne yapar:**
- OAuth bağlantısını iptal eder
- Token'ı veritabanında pasif yapar

**API Call:**
```
DELETE /{user-id}/permissions
```

#### `debugToken(accessToken)`
**Ne yapar:**
- Token'ın detaylı bilgilerini çeker
- App ID, User ID, expiration, scopes

**API Call:**
```
GET /debug_token?input_token=TOKEN&access_token=APP_ID|APP_SECRET
```

---

### 4. **src/api/meta.js** (Mevcut - İyileştirilmiş)

**Amaç:** Meta API client - Instagram & Facebook operations

**Ana Fonksiyonlar:**

#### `uploadInstagramReel(userId, videoUrl, metadata)` ⭐ 2 AŞAMALI
**Ne yapar:**
1. **Container oluşturur**: Media container API call
2. **Status kontrolü**: Container hazır mı?
3. **Publish eder**: Container'ı yayınlar

**Önemli:** Video public URL olmalı!

**Metadata:**
```javascript
{
  instagramAccountId: 'ig_account_123', // Zorunlu
  caption: 'Harika bir Reel!',
  hashtags: ['viral', 'trending'],
  shareToFeed: true,
  coverUrl: 'https://...',
  thumbOffset: 0
}
```

**Process:**
```javascript
// 1. Container oluştur
POST /{ig-account-id}/media
{
  media_type: "REELS",
  video_url: "https://ultrarslanoglu.com/video.mp4",
  caption: "...",
  share_to_feed: true
}
→ Response: { id: "container_123" }

// 2. Container status kontrol (her 3 saniyede)
GET /{container-id}?fields=status_code
→ Status: FINISHED

// 3. Publish
POST /{ig-account-id}/media_publish
{ creation_id: "container_123" }
→ Response: { id: "media_456" }
```

#### `uploadFacebookVideo(userId, videoPath, metadata)` ⭐ 3 AŞAMALI
**Ne yapar:**
1. **Start**: Upload session başlatır
2. **Transfer**: Video'yu yükler (chunked)
3. **Finish**: Upload'ı tamamlar ve publish eder

**Metadata:**
```javascript
{
  pageId: 'page_123', // Zorunlu
  title: 'Video Başlığı',
  description: 'Açıklama',
  published: true
}
```

**Process:**
```javascript
// 1. Start
POST /{page-id}/videos
{ upload_phase: "start", file_size: 52428800 }
→ { video_id, upload_session_id }

// 2. Transfer
POST /{page-id}/videos
FormData: { upload_phase: "transfer", upload_session_id, video_file_chunk }

// 3. Finish
POST /{page-id}/videos
{ upload_phase: "finish", upload_session_id, title, description, published: true }
→ { id: "post_789" }
```

#### `getInstagramMediaInsights(userId, mediaId, metrics)`
**Ne yapar:**
- Media insights çeker (impressions, reach, likes, comments, etc.)

**Metrics:**
- impressions, reach, likes, comments, shares, saves, plays, total_interactions

**API Call:**
```
GET /{media-id}/insights?metric=impressions,reach,likes,comments
```

#### `getInstagramAccountInsights(userId, igAccountId, metrics, period)`
**Ne yapar:**
- Account level insights (follower_count, profile_views, website_clicks)

**Period:** day, week, days_28

**API Call:**
```
GET /{ig-account-id}/insights?metric=...&period=day
```

#### `getFacebookPageInsights(userId, pageId, metrics, period)`
**Ne yapar:**
- Facebook Page insights (page_impressions, page_engaged_users, page_video_views)

**Metrics:**
- page_impressions, page_engaged_users, page_video_views, page_fan_adds, page_post_engagements

#### `waitForContainerReady(igAccountId, containerId, accessToken, maxAttempts)`
**Ne yapar:**
- Instagram container'ın FINISHED status'üne ulaşmasını bekler
- Her 3 saniyede kontrol eder
- Max 10 deneme (30 saniye)

**Status'ler:**
- EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED

#### `getMediaPermalink(mediaId, accessToken)`
**Ne yapar:**
- Media'nın public URL'ini çeker

**API Call:**
```
GET /{media-id}?fields=permalink
```

#### `formatCaption(caption, hashtags)`
**Ne yapar:**
- Caption ve hashtag'leri formatlar
- Hashtag'leri # ile başlatır

#### `getInstagramMediaList(userId, igAccountId, limit)`
**Ne yapar:**
- Instagram hesabının medya listesini çeker (pagination ile)

**API Call:**
```
GET /{ig-account-id}/media?fields=id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count
```

---

### 5. **src/routes/metaRoutes.js** ⭐ YENİ DOSYA

**Amaç:** Meta'ya özel endpoint'leri yönetir

**Endpoint'ler:**

#### Instagram Endpoints

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| GET | `/api/meta/instagram/accounts` | IG Business hesapları |
| GET | `/api/meta/instagram/:accountId/media` | Medya listesi |
| GET | `/api/meta/instagram/media/:mediaId/insights` | Media insights |
| GET | `/api/meta/instagram/account/:accountId/insights` | Account insights |

#### Facebook Endpoints

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| GET | `/api/meta/facebook/pages` | Facebook Page listesi |
| GET | `/api/meta/facebook/page/:pageId/insights` | Page insights |

#### Data Deletion Endpoints ⭐ FACEBOOK REQUIREMENT

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| POST | `/api/meta/data-deletion` | Deletion callback |
| GET | `/api/meta/data-deletion-status/:code` | Status check |

**Data Deletion Implementation:**

**Facebook Callback:**
```javascript
POST /api/meta/data-deletion
{
  "signed_request": "ENCODED_SIGNATURE.PAYLOAD"
}
```

**Process:**
1. Signed request decode et
2. Facebook User ID al
3. Token'ları bul ve pasif yap
4. Connected platforms'dan kaldır
5. Confirmation code oluştur
6. Response döndür

**Response (Facebook için):**
```json
{
  "url": "https://ultrarslanoglu.com/data-deletion-status/123456789_1703001600000",
  "confirmation_code": "123456789_1703001600000"
}
```

**Manuel Deletion (Form'dan):**
```javascript
POST /api/meta/data-deletion
{
  "email": "user@example.com",
  "userId": "optional"
}
```

#### Token Management

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| POST | `/api/meta/refresh-token` | Token'ı yenile |
| GET | `/api/meta/token-status` | Token debug info |

**Token Status Response:**
```json
{
  "success": true,
  "tokenInfo": {
    "isValid": true,
    "appId": "1044312946768719",
    "userId": "123456789",
    "expiresAt": "2026-02-20T10:00:00Z",
    "issuedAt": "2025-12-22T10:00:00Z",
    "scopes": ["public_profile", "email", ...],
    "type": "USER"
  }
}
```

#### Webhook Endpoints (Opsiyonel)

| Method | Endpoint | Fonksiyon |
|--------|----------|-----------|
| GET | `/api/meta/webhook` | Webhook verification |
| POST | `/api/meta/webhook` | Webhook events |

**Webhook Verification:**
```
GET /api/meta/webhook?
  hub.mode=subscribe
  &hub.verify_token=ultrarslanoglu_verify_token
  &hub.challenge=RANDOM_STRING

Response: RANDOM_STRING
```

---

### 6. **public/data-deletion.html** ⭐ YENİ DOSYA

**Amaç:** Facebook Data Deletion Requirement sayfası

**Özellikler:**
- ✅ Kullanıcı friendly form
- ✅ Email ve User ID input
- ✅ AJAX request ile silme
- ✅ Success/Error mesajları
- ✅ GDPR compliance bilgilendirme

**Form:**
```html
<form id="deletionForm">
  <input type="email" name="email" required>
  <input type="text" name="userId" placeholder="Facebook User ID (Optional)">
  <button type="submit">Submit Deletion Request</button>
</form>
```

**JavaScript:**
```javascript
fetch('/api/meta/data-deletion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, userId })
});
```

---

### 7. **src/app.js** (Güncellendi)

**Amaç:** Ana Express uygulaması

**Değişiklikler:**
- ✅ Meta route'ları import edildi
- ✅ `/api/meta` endpoint'i eklendi
- ✅ `/data-deletion` static route eklendi

**Kod:**
```javascript
const metaRoutes = require('./routes/metaRoutes');

// Routes
app.use('/api/meta', metaRoutes);

// Static pages
app.get('/data-deletion', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/data-deletion.html'));
});
```

---

### 8. **docs/META.md** ⭐ YENİ DOSYA

**Amaç:** Kapsamlı Meta entegrasyon dokümantasyonu

**İçerik (800+ satır):**
- ✅ Genel bakış ve özellikler
- ✅ App konfigürasyonu detayları
- ✅ OAuth 2.0 akış açıklamaları (2 aşamalı token exchange)
- ✅ Instagram Reels upload (3 aşama)
- ✅ Facebook video upload (resumable, 3 aşama)
- ✅ Analytics ve Insights detayları
- ✅ Data Deletion implementation
- ✅ Webhook entegrasyonu
- ✅ Kod örnekleri
- ✅ Hata yönetimi
- ✅ Güvenlik önlemleri

---

## 🔑 Önemli Özellikler

### 1. OAuth 2.0 - Long-Lived Token (60 Gün)

**Neden 2 Aşamalı?**
- Facebook ilk olarak short-lived token verir (1-2 saat)
- Long-lived token'a çevirme gerekir (60 gün)

**Process:**
```javascript
// Aşama 1: Authorization code → Short-lived token
GET /oauth/access_token?
  client_id=APP_ID
  &client_secret=APP_SECRET
  &redirect_uri=REDIRECT_URI
  &code=AUTHORIZATION_CODE

// Aşama 2: Short-lived → Long-lived token
GET /oauth/access_token?
  grant_type=fb_exchange_token
  &client_id=APP_ID
  &client_secret=APP_SECRET
  &fb_exchange_token=SHORT_LIVED_TOKEN
```

### 2. Instagram Reels - Container Based Upload

**Neden Container?**
- Video processing için zaman gerekir
- Meta sunucuları video'yu public URL'den indirir
- Container ready olunca publish edilir

**Requirements:**
- Video public URL olmalı (HTTPS)
- Meta sunucuları erişebilmeli
- Max 1GB, 3-90 saniye

**Status Tracking:**
```javascript
async waitForContainerReady(igAccountId, containerId, accessToken) {
  for (let i = 0; i < 10; i++) {
    const status = await checkContainerStatus(containerId);
    
    if (status === 'FINISHED') return true;
    if (status === 'ERROR') throw new Error('Processing failed');
    
    await sleep(3000); // 3 saniye bekle
  }
  throw new Error('Timeout');
}
```

### 3. Facebook Video - Resumable Upload

**Neden 3 Aşamalı?**
- Büyük dosyalar için (10GB'a kadar)
- Network kesintisinde resume desteği
- Session-based upload

**Phases:**
1. **Start**: Session oluştur
2. **Transfer**: Video'yu yükle (chunked olabilir)
3. **Finish**: Publish et

### 4. Token Auto-Refresh

**Neden Gerekli?**
- Long-lived token'lar 60 gün geçerli
- Son 30 gün içinde yenilenebilir
- Kullanıcı deneyimi için otomatik

**Implementation:**
```javascript
async ensureValidToken(userId) {
  const token = await Token.findOne({ userId, platform: 'meta' });
  
  // Token debug
  const debugInfo = await this.debugToken(token.accessToken);
  
  // Son 30 günde mi?
  const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
  if (debugInfo.expires_at * 1000 < thirtyDaysFromNow) {
    // Yenile
    const newToken = await this.refreshAccessToken(token.accessToken);
    token.accessToken = newToken.accessToken;
    await token.save();
  }
  
  return token.accessToken;
}
```

### 5. Data Deletion Compliance

**Neden Gerekli?**
- Facebook app review requirement
- GDPR compliance
- User privacy rights

**Implementation:**
- Signed request verification
- User data deletion from DB
- Confirmation code generation
- Status URL provision

---

## 📊 Scope'lar ve İzinler

| Scope | Açıklama | Kullanım |
|-------|----------|----------|
| `public_profile` | Temel profil bilgileri (id, name) | User identification |
| `email` | Email adresi | Contact, notifications |
| `pages_show_list` | Kullanıcının page'lerini listele | Page selection |
| `pages_read_engagement` | Page engagement metrics | Analytics |
| `pages_manage_posts` | Page'e post oluşturma/yönetme | Video upload |
| `instagram_basic` | Temel IG bilgileri (username, id) | Account management |
| `instagram_content_publish` | Instagram'a içerik yükleme | Reels upload |
| `instagram_manage_insights` | Instagram insights okuma | Analytics |

---

## 🚀 Kullanım Akışı

### 1. OAuth Bağlantısı

```
1. Kullanıcı "Meta ile Bağlan" tıklar
   → GET /auth/meta/login

2. Backend authorization URL oluşturur
   → CSRF state token
   → Redirect to Facebook

3. Kullanıcı Facebook'ta izin verir
   → Redirect to /auth/meta/callback

4. Backend 2 aşamalı token exchange
   → Authorization code → Short-lived token
   → Short-lived → Long-lived token (60 gün)

5. Kullanıcı ve Instagram hesap bilgilerini çek
   → getUserInfo()
   → getInstagramAccounts()

6. Token'ı MongoDB'ye kaydet
   → connectedPlatforms'a ekle

7. Dashboard'a yönlendir
```

### 2. Instagram Reel Upload

```
1. Video seç ve metadata doldur
   → POST /api/upload/single

2. Video sunucuya yükle
   → Public URL oluştur (geçici)

3. Backend upload işlemi
   → Instagram container oluştur
   → Container status kontrol (3s intervals)
   → Container ready → Publish

4. Frontend status polling
   → GET /api/upload/status/:uploadId
   → Her 5 saniyede kontrol

5. Upload tamamlanır
   → Status: 'success'
   → Media ID ve permalink döner
```

### 3. Facebook Video Upload

```
1. Video seç ve metadata doldur
   → POST /api/upload/single

2. Backend resumable upload
   → Start: Session oluştur
   → Transfer: Video yükle
   → Finish: Publish et

3. Status kontrolü
   → Upload tamamlanınca 'success'
   → Post ID döner
```

### 4. Analytics Çekme

```
1. Instagram accounts listele
   → GET /api/meta/instagram/accounts

2. Media listesi al
   → GET /api/meta/instagram/:accountId/media

3. Specific media insights
   → GET /api/meta/instagram/media/:mediaId/insights

4. Account insights
   → GET /api/meta/instagram/account/:accountId/insights

5. Facebook Page insights
   → GET /api/meta/facebook/page/:pageId/insights
```

---

## 🛠️ Test ve Debugging

### Test Komutları

```bash
# 1. OAuth Akışını Test Et
curl -X GET "http://localhost:3000/auth/meta/login"

# 2. Instagram Accounts
curl -X GET "http://localhost:3000/api/meta/instagram/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Token Status
curl -X GET "http://localhost:3000/api/meta/token-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Media Insights
curl -X GET "http://localhost:3000/api/meta/instagram/media/MEDIA_ID/insights?metrics=impressions,reach,likes" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Meta Graph API Explorer

Facebook'un Graph API Explorer tool'u:
https://developers.facebook.com/tools/explorer/

- Token test etme
- API call'ları deneme
- Response'ları görme

---

## 📚 Kaynaklar

1. **Meta Developer Documentation**
   - https://developers.facebook.com/
   - Instagram API: https://developers.facebook.com/docs/instagram-api
   - Facebook Login: https://developers.facebook.com/docs/facebook-login

2. **Proje Dosyaları**
   - Detaylı Dokümantasyon: `docs/META.md`
   - API Reference: `docs/API.md` (yakında güncellenecek)
   - Deployment: `docs/DEPLOYMENT.md`

3. **Kod Dosyaları**
   - OAuth: `src/auth/metaAuth.js`
   - API Client: `src/api/meta.js`
   - Routes: `src/routes/metaRoutes.js`

---

## ✅ Checklist

Meta entegrasyonunu test etmek için:

- [ ] Environment değişkenleri ayarlandı mı?
- [ ] MongoDB bağlantısı çalışıyor mu?
- [ ] OAuth akışı test edildi mi?
- [ ] Instagram hesapları listeleniyor mu?
- [ ] Reel upload test edildi mi? (Public URL gerekli!)
- [ ] Facebook video upload test edildi mi?
- [ ] Token refresh çalışıyor mu?
- [ ] Instagram insights alınıyor mu?
- [ ] Facebook Page insights alınıyor mu?
- [ ] Data deletion endpoint'i erişilebilir mi?
- [ ] Hata durumları kontrol edildi mi?
- [ ] Log dosyaları incelendi mi?
- [ ] Meta Developer Dashboard'da app onaylı mı?
- [ ] Production deployment hazır mı?

---

**Not:** Bu entegrasyon Meta Graph API v19.0 kullanmaktadır. API güncellemelerini ve Meta'nın policy değişikliklerini takip etmeyi unutmayın.
