# 📺 YouTube Entegrasyonu

YouTube API v3 ve YouTube Analytics API v2 kullanarak video yükleme, yönetim ve analytics işlemleri.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [OAuth 2.0 Akışı](#oauth-20-akışı)
3. [API Referansı](#api-referansı)
4. [Video Yükleme](#video-yükleme)
5. [Analytics](#analytics)
6. [Token Yönetimi](#token-yönetimi)
7. [Hata Yönetimi](#hata-yönetimi)
8. [Kod Örnekleri](#kod-örnekleri)

---

## Genel Bakış

YouTube entegrasyonu aşağıdaki özellikleri destekler:

- **OAuth 2.0**: Google hesabı ile güvenli kimlik doğrulama
- **Video Yükleme**: Resumable upload, chunk desteği (256KB chunks)
- **Video Yönetimi**: Listeleme, güncelleme, silme
- **Analytics**: Video ve channel analytics (YouTube Analytics API v2)
- **Token Otomatik Yenileme**: Token 5 dakika kalmışsa otomatik yenileme

### Gerekli Scopes

```
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/youtubepar partner
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/userinfo.email
```

---

## OAuth 2.0 Akışı

### 1. Login Endpoint'i

Kullanıcıyı Google OAuth sayfasına yönlendir:

```http
GET /auth/youtube/login
```

**Response**: HTTP 302 Redirect to Google OAuth

**Akış**:
1. Server PKCE state oluşturur
2. Kullanıcı Google OAuth sayfasına yönlendirilir
3. Kullanıcı izin verir (Scope: youtube.upload, youtube.readonly, userinfo)
4. Google authorization code ile callback'e döner

### 2. Callback Endpoint'i

Google OAuth callback'i işle:

```http
GET /auth/youtube/callback?code=CODE&state=STATE
```

**Response**:
```json
{
  "success": true,
  "message": "YouTube authentication successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "googleId": "google_123",
    "profileImage": "https://..."
  },
  "token": "eyJhbGc...",
  "googleToken": {
    "accessToken": "ya29...",
    "refreshToken": "1/...",
    "expiryDate": "2025-01-22T...",
    "tokenType": "Bearer"
  }
}
```

**Akış**:
1. Authorization code → Access token exchange (Google API)
2. Short-lived access token alıyoruz
3. Refresh token kaydedilir (30 gün)
4. User profil bilgisini al (google+ API)
5. JWT token oluştur (7 days)
6. Token bilgisini MongoDB'ye kaydet

---

## API Referansı

### Kimlik Doğrulama

Tüm endpoints (OAuth dışındakiler) JWT token gerektirir:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### Channels

#### Get Channels (Authenticated User)

```http
GET /api/youtube/channels
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "channels": [
    {
      "id": "UCxxxxx",
      "title": "Channel Name",
      "description": "Channel description",
      "thumbnail": "https://yt3.googleapis.com/...",
      "subscriberCount": "1500000",
      "videoCount": "250",
      "viewCount": "50000000"
    }
  ]
}
```

---

## Video Yükleme

### Upload Video (Resumable)

```http
POST /api/youtube/upload
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "videoPath": "/path/to/video.mp4",
  "metadata": {
    "title": "Video Title",
    "description": "Video description with #hashtags",
    "tags": ["youtube", "tutorial", "trending"],
    "categoryId": "22",
    "privacyStatus": "private",
    "defaultLanguage": "tr",
    "madeForKids": false,
    "publishAt": "2025-01-25T10:00:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video upload initiated",
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "privacyStatus": "private",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Metadata Parametreleri**:

| Parameter | Type | Default | Açıklama |
|-----------|------|---------|----------|
| title | string | "Untitled" | Video başlığı (max 100 char) |
| description | string | "" | Video açıklaması (max 5000 char) |
| tags | array | [] | Video etiketleri (max 30 tag) |
| categoryId | string | "22" | Video kategorisi |
| privacyStatus | string | "private" | private, unlisted, public |
| defaultLanguage | string | "en" | Video dili |
| madeForKids | boolean | false | Çocuklara yönelik olarak işaretle |
| publishAt | ISO8601 | null | Yayınlanma tarihi (scheduled upload) |

**Video Kategorileri**:

| ID | Kategori |
|----|----------|
| 1 | Film & Animation |
| 2 | Autos & Vehicles |
| 10 | Music |
| 15 | Pets & Animals |
| 17 | Sports |
| 18 | Short Movies |
| 19 | Travel & Events |
| 20 | Gaming |
| 21 | Videoblogging |
| 22 | People & Blogs |
| 23 | Comedy |
| 24 | Entertainment |
| 25 | News & Politics |
| 26 | Howto & Style |
| 27 | Education |
| 28 | Science & Tech |
| 29 | Nonprofits & Activism |

**Çıkış Adımları**:

1. **Initialize**: Metadata + file size ile upload session başlat
2. **Upload**: Video'yu chunks (256KB) halinde yükle
3. **Finalize**: Upload tamamla, videoId döndür

**Supportlenen Format'lar**:
- MP4, MOV, AVI, WMV, FLV, MKV, WEBM
- Min: 1 dakika, Max: 12 saat
- Min: 360p, Recommended: 1080p veya 4K

---

### Video Management

#### Get Video Info

```http
GET /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "video": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Video description",
    "publishedAt": "2025-01-20T10:00:00Z",
    "status": "public",
    "processingStatus": "succeeded",
    "statistics": {
      "views": 1500,
      "likes": 250,
      "comments": 45,
      "favorites": 0
    },
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}
```

#### Get Video List

```http
GET /api/youtube/videos?maxResults=25&pageToken=NEXT_PAGE&order=date
Authorization: Bearer JWT_TOKEN
```

**Query Parametreleri**:
- `maxResults` (int): Sonuç sayısı (default: 25, max: 50)
- `pageToken` (string): Pagination token
- `search` (string): Video arama
- `order` (string): date, rating, relevance, title, videoCount, viewCount

**Response**:
```json
{
  "success": true,
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "description": "Description...",
      "thumbnail": "https://...",
      "publishedAt": "2025-01-20T10:00:00Z"
    }
  ],
  "nextPageToken": "NEXT_PAGE_TOKEN",
  "pageInfo": {
    "totalResults": 150,
    "resultsPerPage": 25
  }
}
```

#### Update Video

```http
PUT /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "New Title",
  "description": "Updated description",
  "tags": ["new", "tags"],
  "categoryId": "24",
  "privacyStatus": "public"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video updated successfully",
  "videoId": "dQw4w9WgXcQ",
  "title": "New Title",
  "status": "public"
}
```

#### Delete Video

```http
DELETE /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

## Analytics

### Video Analytics

```http
GET /api/youtube/analytics/video/:videoId?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer JWT_TOKEN
```

**Query Parametreleri**:
- `startDate` (YYYY-MM-DD): İstatistik başlangıç tarihi (default: 30 gün önce)
- `endDate` (YYYY-MM-DD): İstatistik bitiş tarihi (default: bugün)

**Response**:
```json
{
  "success": true,
  "analytics": {
    "videoId": "dQw4w9WgXcQ",
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "metrics": {
      "views": 5000,
      "watchTime": 2500,
      "averageViewDuration": 30,
      "averageViewPercentage": 50,
      "subscribersGained": 150,
      "likes": 500,
      "comments": 75,
      "shares": 25
    },
    "dailyData": [
      {
        "date": "2025-01-01",
        "views": 150,
        "watchTime": 75,
        "likes": 15,
        "comments": 2,
        "shares": 1
      }
    ]
  }
}
```

**Metrics Açıklamaları**:

| Metrik | Açıklama |
|--------|----------|
| views | Video izleme sayısı |
| watchTime | Toplam izleme süresi (dakika) |
| averageViewDuration | Ortalama izleme süresi (saniye) |
| averageViewPercentage | Ortalama izleme yüzdesi |
| subscribersGained | Kazanılan abone sayısı |
| likes | Video beğeni sayısı |
| comments | Yorum sayısı |
| shares | Paylaşım sayısı |

---

### Channel Analytics

```http
GET /api/youtube/analytics/channel?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "analytics": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "metrics": {
      "views": 50000,
      "watchTime": 25000,
      "averageViewDuration": 30,
      "subscribersGained": 1500,
      "likes": 5000,
      "comments": 750,
      "shares": 250,
      "playlistAdds": 100,
      "playlistRemoves": 25
    },
    "dailyData": [
      {
        "date": "2025-01-01",
        "views": 1500,
        "watchTime": 750,
        "subscribersGained": 45,
        "likes": 150,
        "comments": 20,
        "shares": 5
      }
    ]
  }
}
```

---

### Traffic Sources

```http
GET /api/youtube/analytics/traffic?startDate=2025-01-01&endDate=2025-01-31&videoId=dQw4w9WgXcQ
Authorization: Bearer JWT_TOKEN
```

**Query Parametreleri**:
- `startDate` (YYYY-MM-DD): İstatistik başlangıç tarihi
- `endDate` (YYYY-MM-DD): İstatistik bitiş tarihi
- `videoId` (string, optional): Belirli video için analytics

**Response**:
```json
{
  "success": true,
  "trafficData": {
    "success": true,
    "trafficSources": [
      {
        "source": "EXTERNAL",
        "views": 2500,
        "watchTime": 1250
      },
      {
        "source": "SEARCH",
        "views": 1500,
        "watchTime": 750
      },
      {
        "source": "BROWSE",
        "views": 1000,
        "watchTime": 500
      }
    ]
  }
}
```

**Traffic Source Türleri**:
- EXTERNAL: Harici sayfalardan (başka website'lerden)
- SEARCH: YouTube arama
- BROWSE: YouTube'da gezinme
- PLAYLIST: Playlist'ten
- NOTIFICATION: YouTube notifications
- SUBSCRIBER_FEATURE: Abone özellikleri
- CHANNEL: Channel'dan
- PROMOTED: Promosyon

---

## Token Yönetimi

### Refresh Token

```http
POST /api/youtube/refresh-token
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "ya29...",
  "expiryDate": "2025-01-23T10:00:00Z",
  "tokenType": "Bearer"
}
```

**Not**: Token otomatik olarak 5 dakika kalmışsa yenilenir. Manual yenileme nadiren gereklidir.

### Get Token Status

```http
GET /api/youtube/token-status
Authorization: Bearer JWT_TOKEN
```

**Response**:
```json
{
  "success": true,
  "tokenInfo": {
    "isValid": true,
    "expiresAt": "2025-01-23T10:00:00Z",
    "scopes": [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly"
    ],
    "clientId": "340138855278-...",
    "userId": "...",
    "issuedAt": "2025-01-22T10:00:00Z",
    "expiresIn": 3600,
    "type": "USER"
  }
}
```

---

## Hata Yönetimi

### Yaygın Hatalar

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```
- JWT token eksik veya geçersiz
- Çözüm: `/auth/youtube/login` endpoint'ini çağırarak yeniden authenticate ol

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
- Scope'lar eksik
- Çözüm: Yeniden authenticate ol (youtube.upload scope ekli olmalı)

#### 404 Not Found
```json
{
  "success": false,
  "message": "Video not found"
}
```
- Video ID yanlış veya video silinmiş
- Çözüm: Video ID'yi kontrol et

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```
- Metadata format yanlış
- Çözüm: Request body'yi kontrol et

#### 429 Too Many Requests
- Rate limiting uyarısı
- Çözüm: 60 saniye bekle ve tekrar dene

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "details": "Additional details if available"
}
```

---

## Kod Örnekleri

### JavaScript/Node.js

#### 1. YouTube OAuth Login

```javascript
// Login endpoint'i çağır
window.location.href = '/auth/youtube/login';

// Callback'ten sonra token al
const response = await fetch('/auth/youtube/callback?code=AUTH_CODE');
const data = await response.json();
const jwtToken = data.token;
```

#### 2. Video Yükle

```javascript
const uploadVideo = async (videoPath, metadata) => {
  const token = localStorage.getItem('youtubeToken');
  
  const response = await fetch('/api/youtube/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoPath: videoPath,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        tags: ['youtube', 'tutorial'],
        categoryId: '22',
        privacyStatus: 'private'
      }
    })
  });
  
  const result = await response.json();
  console.log('Video ID:', result.videoId);
};

uploadVideo('/path/to/video.mp4', {
  title: 'My Video',
  description: 'Video description'
});
```

#### 3. Video Analytics Sorgula

```javascript
const getVideoAnalytics = async (videoId) => {
  const token = localStorage.getItem('youtubeToken');
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  
  const response = await fetch(
    `/api/youtube/analytics/video/${videoId}?startDate=${startDate}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const result = await response.json();
  console.log('Views:', result.analytics.metrics.views);
  console.log('Watch Time:', result.analytics.metrics.watchTime);
};

getVideoAnalytics('dQw4w9WgXcQ');
```

#### 4. Channel Analytics Sorgula

```javascript
const getChannelAnalytics = async () => {
  const token = localStorage.getItem('youtubeToken');
  
  const response = await fetch('/api/youtube/analytics/channel', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Total Views:', result.analytics.metrics.views);
  console.log('Subscribers Gained:', result.analytics.metrics.subscribersGained);
};

getChannelAnalytics();
```

### cURL

#### 1. Video Yükle

```bash
curl -X POST \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoPath": "/path/to/video.mp4",
    "metadata": {
      "title": "My Video",
      "description": "Video description",
      "tags": ["youtube", "tutorial"],
      "categoryId": "22",
      "privacyStatus": "private"
    }
  }' \
  "https://ultrarslanoglu.com/api/youtube/upload"
```

#### 2. Video Analytics Sorgula

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/video/dQw4w9WgXcQ"
```

#### 3. Channel Analytics Sorgula

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/channel"
```

#### 4. Traffic Sources Sorgula

```bash
curl -H "Authorization: Bearer JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/analytics/traffic"
```

---

## Best Practices

1. **Token Yönetimi**
   - JWT token'ı localStorage'a kaydet
   - 7 gün sonra yeniden login gerektirir
   - Otomatik token refresh 5 dakika kalmışsa çalışır

2. **Video Yükleme**
   - Resume destekli upload'ı kullan (ağ kesintisine karşı güvenli)
   - 256KB chunks kullan (optimal performance)
   - Büyük videolar için çok zaman alabilir (10GB video ≈ saatler)

3. **Analytics**
   - En az 2-3 saat sonra analytics data görünür
   - 30 gün öncesi data geçmişi al
   - Real-time analytics YouTube'da 24-48 saat gecikmeli

4. **Security**
   - Client secret'ı backend'de tut
   - JWT token'ı HTTPS üzerinde ilet
   - CSRF protection kullan (state parameter)

5. **Rate Limiting**
   - Günlük quota: 10,000 unit (video yükleme = 1600 units)
   - Saatlik rate limit vardır
   - Gerekirse Google'a increase talebinde bulun

---

## İlgili Belgeler

- [YouTube API v3 Documentation](https://developers.google.com/youtube/v3)
- [YouTube Analytics API v2](https://developers.google.com/youtube/analytics/v2)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
