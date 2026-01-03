# 🎬 YouTube Entegrasyon Özeti

YouTube API v3 ve YouTube Analytics API v2 kullanarak yapılan entegrasyonun tüm dosyalarının detaylı açıklaması.

---

## 📁 Oluşturulan/Güncellenen Dosyalar

### 1. `.env.example`

**Amaç**: Environment variables template  
**Durum**: Güncellendi  
**Değiştirilme Nedeni**: Google OAuth credentials eklendi

**Eklenen Satırlar**:
```bash
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_REDIRECT_URI=https://ultrarslanoglu.com/auth/youtube/callback
GOOGLE_JAVASCRIPT_ORIGINS=https://ultrarslanoglu.com
GOOGLE_SCOPE=https://www.googleapis.com/auth/youtube.upload,https://www.googleapis.com/auth/youtube.readonly,https://www.googleapis.com/auth/userinfo.profile,https://www.googleapis.com/auth/userinfo.email
```

**Example Placeholders**:
- `GOOGLE_CLIENT_ID`: your-google-client-id.apps.googleusercontent.com
- `GOOGLE_CLIENT_SECRET`: your-google-client-secret
- `GOOGLE_PROJECT_ID`: your-google-project-id
- `GOOGLE_REDIRECT_URI`: https://ultrarslanoglu.com/auth/youtube/callback

---

### 2. `config/index.js`

**Amaç**: Merkezi konfigürasyon  
**Durum**: Zaten var (değişiklik yok gerekti)  
**Notlar**: Google config zaten tanımlanmış, env'den okuyor

**Google Config Bloğu**:
```javascript
google: {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BASE_URL}/auth/youtube/callback`,
  scope: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtubepartner'
  ],
  authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenURL: 'https://oauth2.googleapis.com/token',
  apiBaseURL: 'https://www.googleapis.com/youtube/v3/'
}
```

**Erişim Şekli**: `const config = require('./config'); config.google.clientId`

---

### 3. `src/auth/googleAuth.js` (YENİ)

**Amaç**: Google OAuth 2.0 entegrasyonu  
**Durum**: Yeni dosya  
**Satır Sayısı**: 380+

#### Sınıf: `GoogleAuthService`

**Statik Metodlar**:

##### `getAuthorizationUrl(state = null)`
- **Amaç**: YouTube OAuth login URL'i oluştur
- **Giriş**: Optional state parametresi
- **Çıkış**: `{ url, state }` nesnesi
- **Özellikler**: 
  - PKCE state oluşturur
  - `access_type: offline` (refresh token almak için)
  - `prompt: consent` (her zaman consent ekranı)
- **Kullanım**:
```javascript
const { url, state } = GoogleAuthService.getAuthorizationUrl();
// url'ye redirect et
```

##### `handleCallback(code, state)`
- **Amaç**: OAuth callback'ten token'a dönüştür
- **Giriş**: Authorization code ve state
- **Çıkış**: User + token bilgileri
- **Akış**:
  1. Authorization code → Access token exchange (Google API)
  2. User info al (google+ API)
  3. User bul/oluştur (MongoDB)
  4. Refresh token kaydet
  5. JWT token oluştur
- **Kaydettiği Data**: 
  - User model: googleId, email, name, profileImage
  - Token model: accessToken, refreshToken, expiryDate, scope

##### `getUserInfo(accessToken)`
- **Amaç**: Google+ API'den user bilgilerini al
- **Giriş**: Access token
- **Çıkış**: User info (id, email, name, picture, verified_email)

##### `refreshAccessToken(userId)`
- **Amaç**: Refresh token'ı kullanarak yeni access token al
- **Giriş**: User ID
- **Çıkış**: Yeni token + expiry date
- **Not**: Otomatik çağrılır, manual çağrısı nadirdir

##### `ensureValidToken(userId)`
- **Amaç**: Token'ın geçerliliğini kontrol et, gerekirse yenile
- **Giriş**: User ID
- **Çıkış**: Geçerli token
- **Mantık**: Token < 5 dakika kalmışsa yenile
- **Kullanım**: API call'larından önce bu metod çağırılır
```javascript
const token = await GoogleAuthService.ensureValidToken(userId);
// token.accessToken kullan
```

##### `debugToken(accessToken)`
- **Amaç**: Token'ı debug et (geçerlilik kontrol et)
- **Giriş**: Access token
- **Çıkış**: Token info (isValid, scopes, expiresIn, etc.)
- **Kullanım**: Token status endpoint'inde

##### `getYoutubeChannels(userId)`
- **Amaç**: User'ın YouTube channel'larını al
- **Giriş**: User ID
- **Çıkış**: Channel listesi (youtube.js'in getChannels() metodunun output'u)

---

### 4. `src/api/youtube.js` (GÜNCELLENDİ)

**Amaç**: YouTube API client  
**Durum**: Var olup tamamen yeniden yazıldı  
**Satır Sayısı**: 570+

#### Sınıf: `YouTubeAPI`

**Statik Metodlar**:

##### `getChannels(accessToken)`
- **Amaç**: YouTube channels'ı al (authenticated user)
- **Giriş**: Access token
- **Çıkış**: Channel array `[{ id, title, description, thumbnail, subscriberCount, videoCount, viewCount }]`
- **API Endpoint**: `GET /youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true`

##### `uploadVideo(userId, videoPath, metadata = {})`
- **Amaç**: Video'yu YouTube'a yükle (resumable upload)
- **Giriş**: User ID, video file path, metadata object
- **Çıkış**: `{ success, videoId, title, privacyStatus, url }`
- **Adımlar**:
  1. Token geçerliliğini kontrol et (ensureValidToken)
  2. Metadata hazırla (snippet, status, processingDetails)
  3. Upload session başlat (_initializeUpload)
  4. Video content'i chunk'lar halinde yükle (_uploadVideoContent)
  5. Upload'ı tamamla (_finalizeUpload)
- **Chunk Size**: 256KB (CHUNK_SIZE = 262144)
- **Desteklenen Format'lar**: MP4, MOV, AVI, WMV, FLV, MKV, WEBM
- **Max Dosya Boyutu**: 12GB
- **Metadata Parametreleri**:
  - title (default: "Untitled")
  - description (default: "")
  - tags (default: [])
  - categoryId (default: "22" - People & Blogs)
  - defaultLanguage (default: "en")
  - privacyStatus (default: "private" → private, unlisted, public)
  - madeForKids (default: false)
  - publishAt (optional - scheduled upload)

##### `_initializeUpload(accessToken, metadata, fileSize)`
- **Amaç**: Upload session başlat
- **Giriş**: Access token, metadata, file size bytes
- **Çıkış**: Session URI (location header)
- **HTTP Method**: POST with resumable upload headers
- **Headers**:
  - `X-Goog-Upload-Protocol: resumable`
  - `X-Goog-Upload-Command: start`
  - `X-Goog-Upload-Header-Content-Length`: file size
  - `X-Goog-Upload-Header-Content-Type: video/mp4`

##### `_uploadVideoContent(sessionUrl, videoBuffer, fileSize)`
- **Amaç**: Video content'i chunks halinde yükle
- **Giriş**: Session URL, video buffer, total file size
- **Çıkış**: Yüklenen byte sayısı
- **Mantık**:
  1. Total chunks = fileSize / 256KB
  2. Her chunk için PUT request
  3. isLastChunk ise 'upload, finalize' command
  4. 308 response = upload devam ediyor
  5. 200/201 = upload tamamlandı
- **Error Handling**: Chunk yükleme başarısız olursa throw

##### `_finalizeUpload(sessionUrl)`
- **Amaç**: Upload'ı tamamla ve videoId al
- **Giriş**: Session URL
- **Çıkış**: Video ID
- **HTTP Method**: PUT with finalize command

##### `getVideoInfo(accessToken, videoId)`
- **Amaç**: Video bilgilerini al
- **Giriş**: Access token, video ID
- **Çıkış**: Video info `{ id, title, description, publishedAt, status, processingStatus, statistics, url }`
- **Statistics**: views, likes, comments, favorites

##### `getVideoList(accessToken, options = {})`
- **Amaç**: Video listesi (user'ın channel'ında)
- **Giriş**: Access token, options (maxResults, pageToken, searchQuery, order)
- **Çıkış**: `{ videos: [], nextPageToken, pageInfo }`
- **Order Options**: date, rating, relevance, title, videoCount, viewCount
- **API Endpoint**: `GET /youtube/v3/search`

##### `updateVideo(accessToken, videoId, updates = {})`
- **Amaç**: Video güncellemeleri (title, description, tags, privacy)
- **Giriş**: Access token, video ID, updates object
- **Çıkış**: `{ success, videoId, title, status }`
- **Update Fields**: title, description, tags, privacyStatus, categoryId
- **HTTP Method**: GET (bilgi al) + PUT (güncelle)

##### `deleteVideo(accessToken, videoId)`
- **Amaç**: Video'yu sil
- **Giriş**: Access token, video ID
- **Çıkış**: `{ success, message }`
- **HTTP Method**: DELETE

##### `getVideoAnalytics(accessToken, videoId, options = {})`
- **Amaç**: Belirli bir video'nun analytics'ini al
- **Giriş**: Access token, video ID, options (startDate, endDate)
- **Çıkış**: Analytics metrics (views, watchTime, likes, comments, shares, etc.)
- **API Endpoint**: `GET https://youtubeanalytics.googleapis.com/v2/reports`
- **Metrikler**:
  - views, estimatedMinutesWatched, averageViewDuration, averageViewPercentage
  - subscribersGained, likes, comments, shares, annotationClicks, etc.
- **Dimensions**: day (günlük breakdown)
- **Default Period**: Son 30 gün

##### `getChannelAnalytics(accessToken, options = {})`
- **Amaç**: Channel'ın genel analytics'ini al
- **Giriş**: Access token, options (startDate, endDate)
- **Çıkış**: Channel-wide metrics
- **Fark**: `filters` parametresi yok (tüm channel)
- **Ek Metrikler**: videosAddedToPlaylists, videosRemovedFromPlaylists

##### `getTrafficSources(accessToken, videoId = null, options = {})`
- **Amaç**: Traffic sources analytics (YouTube arama, external, etc.)
- **Giriş**: Access token, optional videoId, options
- **Çıkış**: Traffic sources breakdown `[{ source, views, watchTime }]`
- **Source Types**: EXTERNAL, SEARCH, BROWSE, PLAYLIST, NOTIFICATION, SUBSCRIBER_FEATURE, CHANNEL, PROMOTED
- **Dimensions**: trafficSourceDetail

---

### 5. `src/routes/youtubeRoutes.js` (YENİ)

**Amaç**: YouTube API endpoints  
**Durum**: Yeni dosya  
**Satır Sayısı**: 420+

#### Middleware

**`verifyToken` Middleware**:
- **Amaç**: JWT token doğrulama
- **Mantık**: Authorization header'dan token al, JWT.verify() ile kontrol et
- **Başarısız**: 401 Unauthorized
- **Başarılı**: `req.userId` set et

#### Endpoints

##### OAuth 2.0

**`GET /auth/youtube/login`**
- **Amaç**: YouTube OAuth login page'sine redirect et
- **Giriş**: Query: yok
- **Çıkış**: HTTP 302 Redirect to Google OAuth
- **Akış**: State oluştur → session'a kaydet → OAuth URL'ye redirect

**`GET /auth/youtube/callback`**
- **Amaç**: OAuth callback'i işle
- **Giriş**: Query: code, state, error
- **Çıkış**: JSON `{ success, user, token, googleToken }`
- **Validation**: State parametresi kontrol et (CSRF)
- **Token Generation**: JWT token oluştur (7 days)
- **Response Fields**:
  - user: { id, email, name, googleId, profileImage }
  - token: JWT token
  - googleToken: { accessToken, refreshToken, expiryDate, tokenType }

##### Channels

**`GET /api/youtube/channels`**
- **Auth**: Gerekli (JWT)
- **Amaç**: YouTube channels'ı al
- **Giriş**: yok
- **Çıkış**: `{ success, channels: [] }`

##### Video Upload

**`POST /api/youtube/upload`**
- **Auth**: Gerekli (JWT)
- **Amaç**: Video'yu YouTube'a yükle
- **Giriş**: `{ videoPath, metadata: { title, description, tags, categoryId, privacyStatus, ... } }`
- **Çıkış**: `{ success, videoId, title, privacyStatus, url }`
- **Validation**: videoPath required
- **Error Handling**: try/catch with 500 response

##### Video Management

**`GET /api/youtube/video/:videoId`**
- **Auth**: Gerekli
- **Amaç**: Video info al
- **Çıkış**: `{ success, video: { id, title, description, statistics, ... } }`

**`GET /api/youtube/videos`**
- **Auth**: Gerekli
- **Amaç**: Video listesi (pagination support)
- **Query Params**: maxResults, pageToken, search, order
- **Çıkış**: `{ success, videos: [], nextPageToken, totalResults }`

**`PUT /api/youtube/video/:videoId`**
- **Auth**: Gerekli
- **Amaç**: Video güncelle
- **Giriş**: `{ title, description, tags, privacyStatus, categoryId }`
- **Çıkış**: `{ success, videoId, title, status }`

**`DELETE /api/youtube/video/:videoId`**
- **Auth**: Gerekli
- **Amaç**: Video'yu sil
- **Çıkış**: `{ success, message }`

##### Analytics

**`GET /api/youtube/analytics/video/:videoId`**
- **Auth**: Gerekli
- **Query Params**: startDate, endDate
- **Çıkış**: Video analytics (views, watchTime, likes, comments, shares, dailyData)

**`GET /api/youtube/analytics/channel`**
- **Auth**: Gerekli
- **Query Params**: startDate, endDate
- **Çıkış**: Channel analytics (views, watchTime, subscribersGained, playlistAdds, dailyData)

**`GET /api/youtube/analytics/traffic`**
- **Auth**: Gerekli
- **Query Params**: startDate, endDate, videoId (optional)
- **Çıkış**: Traffic sources (EXTERNAL, SEARCH, BROWSE, etc.)

##### Token Management

**`POST /api/youtube/refresh-token`**
- **Auth**: Gerekli
- **Amaç**: Access token'ı manuel yenile
- **Çıkış**: `{ success, message, accessToken, expiryDate }`

**`GET /api/youtube/token-status`**
- **Auth**: Gerekli
- **Amaç**: Token durumu kontrol et
- **Çıkış**: `{ success, tokenInfo: { isValid, expiresAt, scopes, ... } }`

---

### 6. `src/app.js` (GÜNCELLENDİ)

**Amaç**: Main Express app  
**Durum**: Güncellendi  
**Değişiklik**:

1. **YouTube Routes Import**:
```javascript
const youtubeRoutes = require('./routes/youtubeRoutes');
```

2. **Route Mount**:
```javascript
app.use('/api/youtube', youtubeRoutes);
```

**Mounting Order**:
1. /auth (authentication)
2. /api/upload (file upload)
3. /api/analytics (analytics)
4. /api/tiktok (TikTok)
5. /api/meta (Meta)
6. /api/youtube (YouTube) ← YENİ

---

## 🔄 Akışlar

### OAuth 2.0 Akışı

```
1. GET /auth/youtube/login
   ↓
2. Server state oluştur, session'a kaydet
   ↓
3. Redirect to Google OAuth
   ↓
4. User izin ver
   ↓
5. Google redirect /auth/youtube/callback?code=CODE&state=STATE
   ↓
6. Code + Client ID/Secret → POST /oauth/token
   ↓
7. Access Token + Refresh Token al
   ↓
8. User info al (google+ API)
   ↓
9. User/Token kaydı oluştur/güncelle (MongoDB)
   ↓
10. JWT token oluştur, response olarak dön
   ↓
11. Client localStorage'a JWT token kaydet
```

### Video Upload Akışı

```
1. POST /api/youtube/upload (JWT token ile)
   ↓
2. Token geçerliliğini kontrol et
   ↓
3. Metadata hazırla (snippet, status, processingDetails)
   ↓
4. Upload session başlat (POST with resumable headers)
   ↓
5. Session URL al (location header)
   ↓
6. Video'yu 256KB chunks halinde yükle
   Loop for each chunk:
   - PUT chunk content
   - If last chunk: add finalize command
   - Response 200/201: done
   - Response 308: continue next chunk
   ↓
7. YouTube processing queue'ye gir
   ↓
8. Client callback'ten videoId al
   ↓
9. Processing status kontrol (getVideoInfo)
```

### Analytics Akışı

```
1. GET /api/youtube/analytics/video/:videoId
   ↓
2. Token kontrol et (ensureValidToken)
   ↓
3. YouTubeAnalytics API call
   - ids=channel==MINE
   - filters=video==:videoId
   - startDate, endDate
   - metrics: views, likes, comments, etc.
   - dimensions: day
   ↓
4. Response rows'ları parse et
   ↓
5. Total values hesapla (sum per metric)
   ↓
6. Daily breakdown array oluştur
   ↓
7. Client'a gönder
```

---

## 📊 Scope ve Permission Mapping

| Scope | Kullanılan Yerde | Amaç |
|-------|-----------------|------|
| `youtube.upload` | Video upload | Video yükleme, metadata güncelleme |
| `youtube.readonly` | Video list, analytics | Video bilgisi, analytics okuma |
| `youtubepartner` | Analytics (advanced) | Partner analytics (optional) |
| `userinfo.profile` | OAuth callback | User profil bilgileri |
| `userinfo.email` | OAuth callback | User email |

---

## 🧪 Test Komutları

### 1. OAuth Login
```bash
# Browser'da aç:
https://ultrarslanoglu.com/auth/youtube/login

# Callback'ten JWT token al
# localStorage'a kaydet:
localStorage.setItem('youtubeToken', 'JWT_TOKEN');
```

### 2. Channels List
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/channels"
```

### 3. Video Upload
```bash
curl -X POST \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/path/to/video.mp4",
    "metadata": {
      "title": "Test Video",
      "description": "Test description",
      "categoryId": "22"
    }
  }' \
  "https://ultrarslanoglu.com/api/youtube/upload"
```

### 4. Get Videos
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/videos?maxResults=5"
```

### 5. Video Analytics
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/video/dQw4w9WgXcQ"
```

### 6. Channel Analytics
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/channel"
```

### 7. Traffic Sources
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/traffic"
```

### 8. Token Status
```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/token-status"
```

---

## ✅ Checklist

### Ön-Deployment

- [ ] `.env` dosyası güncellenmiş (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- [ ] MongoDB connection string ayarlı
- [ ] HTTPS enabled (OAuth için gerekli)
- [ ] Google Cloud Console'da redirect URI kayıtlı: https://ultrarslanoglu.com/auth/youtube/callback
- [ ] YouTube Data API v3 enabled (Google Cloud Console)
- [ ] YouTube Analytics API v2 enabled (Google Cloud Console)

### Özellikler Test Edildi

- [ ] OAuth login/callback flow
- [ ] Token refresh otomatik çalışıyor
- [ ] Video upload tamamlanıyor
- [ ] Video listesi getirilebiliyor
- [ ] Video bilgisi getirilebiliyor
- [ ] Video analytics getirilebiliyor
- [ ] Channel analytics getirilebiliyor
- [ ] Traffic sources getirilebiliyor
- [ ] Token status çalışıyor
- [ ] 30 gün sonra token refresh gerekiyor (test et)

---

## 🐛 Troubleshooting

| Problem | Çözüm |
|---------|-------|
| "Invalid OAuth access token" | Token expired olmuş, `/auth/youtube/login` ile yeniden login et |
| "Video not found" | Video ID yanlış veya silindi |
| "Insufficient permissions" | youtube.upload scope eksik, yeniden login et |
| "Analytics data not available" | Video çok yeni, 2-3 saat sonra tekrar dene |
| "Rate limited" | 60 saniye bekle ve tekrar dene |
| "Invalid request parameters" | Request body format kontrol et |

---

## 📚 İlgili Dosyalar

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [YouTube API v3](https://developers.google.com/youtube/v3)
- [YouTube Analytics API v2](https://developers.google.com/youtube/analytics/v2)
- [Complete Documentation](./YOUTUBE.md)

---

## 📈 Sonraki Adımlar

1. **Thumbnail Upload**: Video thumbnail özel upload
2. **Playlist Management**: Playlist oluşturma, video ekleme
3. **Captions**: Video subtitle yükleme
4. **Comments**: Yorum okuma/yazma
5. **Real-time Notifications**: YouTube webhooks
6. **Advanced Analytics**: Audience demographics, traffic sources detailed breakdown
