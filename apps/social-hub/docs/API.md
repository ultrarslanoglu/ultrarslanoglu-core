# API Dokümantasyonu

## Genel Bilgiler

**Base URL**: `https://ultrarslanoglu.com`

**API Version**: v1

**Authentication**: JWT Bearer Token veya Session Cookie

## Authentication Header

Tüm korumalı endpoint'ler için:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

veya session cookie ile otomatik authentication.

## Response Formatları

### Başarılı Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Hata Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## HTTP Status Codes

- `200` OK - Başarılı
- `201` Created - Oluşturuldu
- `400` Bad Request - Geçersiz istek
- `401` Unauthorized - Kimlik doğrulama gerekli
- `403` Forbidden - Yetkisiz erişim
- `404` Not Found - Bulunamadı
- `429` Too Many Requests - Rate limit aşıldı
- `500` Internal Server Error - Sunucu hatası

---

## 🔐 Authentication Endpoints

### TikTok OAuth

#### Start OAuth Flow
```http
GET /auth/tiktok/login
```

Kullanıcıyı TikTok OAuth sayfasına yönlendirir.

**Response**: Redirect to TikTok

---

#### OAuth Callback
```http
GET /auth/tiktok/callback?code=CODE&state=STATE
```

TikTok'tan dönen callback.

**Query Parameters**:
- `code` (string) - Authorization code
- `state` (string) - CSRF state

**Response**: Redirect to dashboard

---

#### Revoke Connection
```http
POST /auth/tiktok/revoke
```

TikTok bağlantısını kaldırır.

**Response**:
```json
{
  "success": true,
  "message": "TikTok connection revoked"
}
```

---

### Meta (Instagram/Facebook) OAuth

#### Start OAuth Flow
```http
GET /auth/meta/login
```

#### OAuth Callback
```http
GET /auth/meta/callback?code=CODE&state=STATE
```

#### Revoke Connection
```http
POST /auth/meta/revoke
```

---

### YouTube OAuth

#### Start OAuth Flow
```http
GET /auth/youtube/login
```

#### OAuth Callback
```http
GET /auth/youtube/callback?code=CODE&state=STATE
```

#### Revoke Connection
```http
POST /auth/youtube/revoke
```

---

### X (Twitter) OAuth

#### Start OAuth Flow
```http
GET /auth/x/login
```

#### OAuth Callback
```http
GET /auth/x/callback?code=CODE&state=STATE
```

#### Revoke Connection
```http
POST /auth/x/revoke
```

---

### Get Auth Status
```http
GET /auth/status
```

Kullanıcının bağlı platformlarını listeler.

**Response**:
```json
{
  "success": true,
  "connectedPlatforms": [
    {
      "platform": "tiktok",
      "connectedAt": "2025-12-22T10:00:00.000Z",
      "isActive": true
    }
  ]
}
```

---

## 📤 Upload Endpoints

### Analyze Content
```http
POST /api/upload/analyze
```

İçerik analizi yapar ve AI önerileri döndürür.

**Request Body**:
```json
{
  "title": "Video başlığı",
  "description": "Detaylı açıklama",
  "tags": ["tag1", "tag2"],
  "hashtags": ["hashtag1", "hashtag2"]
}
```

**Response**:
```json
{
  "success": true,
  "decision": {
    "score": 85,
    "confidence": 0.87,
    "recommendations": [
      "Focus on top performing platforms: tiktok, youtube",
      "Optimal time for publishing - proceed immediately"
    ],
    "suggestedPlatforms": ["tiktok", "youtube", "instagram"],
    "suggestedTiming": "2025-12-22T19:00:00.000Z",
    "contentOptimizations": [
      "Add trending hashtags to increase reach"
    ]
  }
}
```

---

### Upload to Single Platform
```http
POST /api/upload/single
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `video` (file) - Video dosyası
- `platform` (string) - Platform adı (tiktok, instagram, youtube, x)
- `title` (string) - Video başlığı
- `description` (string) - Açıklama
- `tags` (JSON string) - Etiketler
- `hashtags` (JSON string) - Hashtag'ler
- `privacy` (string) - Gizlilik ayarı (platform'a göre değişir)

**Response**:
```json
{
  "success": true,
  "uploadId": "upload_id_here",
  "message": "Upload started",
  "status": "processing"
}
```

---

### Upload to Multiple Platforms
```http
POST /api/upload/multiple
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `video` (file) - Video dosyası
- `platforms` (JSON string) - Platform listesi `["tiktok", "youtube"]`
- `title` (string) - Video başlığı
- `description` (string) - Açıklama
- `tags` (JSON string) - Etiketler

**Response**:
```json
{
  "success": true,
  "uploadId": "upload_id_here",
  "message": "Upload started",
  "platforms": ["tiktok", "youtube"],
  "status": "processing"
}
```

---

### Schedule Upload
```http
POST /api/upload/schedule
```

**Content-Type**: `multipart/form-data`

**Form Data**:
- `video` (file) - Video dosyası
- `platforms` (JSON string) - Platform listesi
- `title` (string) - Video başlığı
- `description` (string) - Açıklama
- `publishAt` (ISO string) - Yayın zamanı

**Response**:
```json
{
  "success": true,
  "uploadId": "upload_id_here",
  "message": "Upload scheduled",
  "publishAt": "2025-12-23T19:00:00.000Z",
  "platforms": ["tiktok", "youtube"]
}
```

---

### Get Upload Status
```http
GET /api/upload/status/:uploadId
```

**Response**:
```json
{
  "success": true,
  "uploadId": "upload_id",
  "overallStatus": "published",
  "platforms": [
    {
      "platform": "tiktok",
      "status": "success",
      "url": "https://tiktok.com/@user/video/123456",
      "uploadedAt": "2025-12-22T10:30:00.000Z"
    },
    {
      "platform": "youtube",
      "status": "success",
      "url": "https://youtube.com/watch?v=abc123",
      "uploadedAt": "2025-12-22T10:31:00.000Z"
    }
  ]
}
```

---

### Get Upload History
```http
GET /api/upload/history?page=1&limit=20
```

**Query Parameters**:
- `page` (number) - Sayfa numarası (default: 1)
- `limit` (number) - Sayfa başına kayıt (default: 20)

**Response**:
```json
{
  "success": true,
  "uploads": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### Delete Upload
```http
DELETE /api/upload/:uploadId
```

**Response**:
```json
{
  "success": true,
  "message": "Upload deleted"
}
```

---

## 📊 Analytics Endpoints

### Get All Platform Analytics
```http
GET /api/analytics/all
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "tiktok": {
      "platform": "tiktok",
      "videos": [ ... ],
      "summary": {
        "totalVideos": 25,
        "totalViews": 150000,
        "totalLikes": 12000,
        "averageEngagement": 8.5
      }
    },
    "instagram": { ... },
    "youtube": { ... },
    "x": { ... }
  },
  "overallSummary": {
    "totalContent": 80,
    "totalEngagement": 45000
  }
}
```

---

### Get TikTok Analytics
```http
GET /api/analytics/tiktok?videoIds=id1,id2
```

**Query Parameters**:
- `videoIds` (string, optional) - Virgülle ayrılmış video ID'leri

**Response**:
```json
{
  "success": true,
  "platform": "tiktok",
  "videos": [
    {
      "videoId": "123456",
      "title": "Video başlığı",
      "views": 50000,
      "likes": 4000,
      "comments": 200,
      "shares": 150,
      "engagement": 8.7,
      "url": "https://..."
    }
  ],
  "creator": {
    "displayName": "Username",
    "followers": 10000,
    "totalVideos": 50
  },
  "summary": { ... }
}
```

---

### Get Instagram Analytics
```http
GET /api/analytics/instagram?accountId=IG_ACCOUNT_ID
```

---

### Get YouTube Analytics
```http
GET /api/analytics/youtube?videoIds=id1,id2
```

---

### Get X (Twitter) Analytics
```http
GET /api/analytics/x?tweetIds=id1,id2
```

---

### Sync Upload Analytics
```http
POST /api/analytics/sync/:uploadId
```

Belirli bir upload'ın analytics verilerini tüm platformlardan çeker ve günceller.

**Response**:
```json
{
  "success": true,
  "analytics": {
    "views": 75000,
    "likes": 6000,
    "comments": 300,
    "shares": 250,
    "engagement": 8.73,
    "lastSyncedAt": "2025-12-22T12:00:00.000Z"
  }
}
```

---

### Get Platform Trends
```http
GET /api/analytics/trends/:platform?days=30
```

**Path Parameters**:
- `platform` (string) - Platform adı

**Query Parameters**:
- `days` (number) - Analiz günü (default: 30)

**Response**:
```json
{
  "success": true,
  "platform": "tiktok",
  "days": 30,
  "trend": "growing",
  "averageEngagement": 9.2,
  "totalContent": 25,
  "recommendation": "Great momentum! Continue your current content strategy."
}
```

---

### Platform Comparison
```http
GET /api/analytics/comparison
```

Platformlar arası karşılaştırma yapar.

**Response**:
```json
{
  "success": true,
  "comparison": {
    "platforms": {
      "tiktok": {
        "totalContent": 25,
        "totalEngagement": 15000,
        "averageEngagement": 9.2
      }
    },
    "rankings": [
      {
        "platform": "tiktok",
        "score": 9.2,
        "totalEngagement": 15000
      },
      {
        "platform": "youtube",
        "score": 7.5,
        "totalEngagement": 12000
      }
    ]
  }
}
```

---

### Export Analytics
```http
GET /api/analytics/export?format=json
```

**Query Parameters**:
- `format` (string) - Export formatı: `json` veya `csv`

---

## Rate Limiting

**Genel API Limitler**:
- 100 istek / 15 dakika

**Auth Endpoint Limitler**:
- 5 istek / 15 dakika

**Upload Endpoint Limitler**:
- 20 upload / saat

Rate limit aşıldığında `429 Too Many Requests` döner.

---

## Webhook'lar (İleride Eklenecek)

Platform event'lerini dinlemek için webhook endpoint'leri:

```http
POST /webhooks/tiktok
POST /webhooks/meta
POST /webhooks/youtube
POST /webhooks/x
```

---

## Error Codes

| Code | Açıklama |
|------|----------|
| `AUTH_REQUIRED` | Kimlik doğrulama gerekli |
| `INVALID_TOKEN` | Geçersiz veya süresi dolmuş token |
| `PLATFORM_NOT_CONNECTED` | Platform bağlı değil |
| `UPLOAD_FAILED` | Upload başarısız |
| `FILE_TOO_LARGE` | Dosya çok büyük (max 500MB) |
| `INVALID_PLATFORM` | Geçersiz platform |
| `RATE_LIMIT_EXCEEDED` | Rate limit aşıldı |
| `ANALYTICS_SYNC_FAILED` | Analytics senkronizasyonu başarısız |

---

## 🎵 TikTok Specific Endpoints

### Share Kit

#### Generate Share URL
```http
GET /api/tiktok/share?url=URL&title=TITLE&hashtags=TAGS
```

TikTok Share Kit URL'i oluşturur.

**Query Parameters**:
- `url` (string, optional) - Paylaşılacak URL
- `title` (string, optional) - Video başlığı
- `hashtags` (string, optional) - Virgülle ayrılmış hashtag'ler

**Response**:
```json
{
  "success": true,
  "shareUrl": "https://www.tiktok.com/share?url=...",
  "message": "Share URL generated. Redirect user to this URL to initiate TikTok sharing."
}
```

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/share?url=https://example.com/video&title=Amazing%20Video&hashtags=viral,trending"
```

---

#### Share Redirect
```http
POST /api/tiktok/share/redirect
```

Kullanıcıyı TikTok Share sayfasına yönlendirir.

**Request Body**:
```json
{
  "url": "https://example.com/video",
  "title": "Amazing Video",
  "hashtags": ["viral", "trending"]
}
```

**Response**: HTTP 302 Redirect to TikTok Share URL

---

### Video Management

#### Get Video List
```http
GET /api/tiktok/videos?cursor=CURSOR&maxCount=20
```

Kullanıcının TikTok videolarını listeler.

**Query Parameters**:
- `cursor` (string, optional) - Pagination cursor
- `maxCount` (number, optional) - Video sayısı (default: 20, max: 20)

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/videos?maxCount=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Video Analytics
```http
GET /api/tiktok/video/:videoId/analytics
```

Belirli bir videonun analytics'ini getirir.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/video/video_123/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Creator Analytics
```http
GET /api/tiktok/creator/analytics
```

Creator profil istatistiklerini getirir.

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/creator/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Check Publish Status
```http
GET /api/tiktok/publish/status/:publishId
```

Video publish durumunu kontrol eder.

**Path Parameters**:
- `publishId` (string) - Publish ID (upload sırasında döner)

**Response**:
```json
{
  "success": true,
  "publishId": "v_pub_12345",
  "status": "PUBLISH_COMPLETE",
  "failReason": null,
  "videoId": "video_123",
  "shareUrl": "https://tiktok.com/@user/video/123"
}
```

**Status Values**:
- `PUBLISH_COMPLETE` - Video başarıyla yayınlandı
- `PROCESSING_DOWNLOAD` - TikTok video'yu indiriyor
- `PROCESSING_UPLOAD` - Video işleniyor
- `FAILED` - Yayınlama başarısız

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/publish/status/v_pub_12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Video Comments
```http
GET /api/tiktok/video/:videoId/comments?cursor=CURSOR&count=50
```

Video yorumlarını listeler.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Query Parameters**:
- `cursor` (string, optional) - Pagination cursor
- `count` (number, optional) - Yorum sayısı (default: 50)

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/video/video_123/comments?count=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Update Video Privacy
```http
PUT /api/tiktok/video/:videoId/privacy
```

Video privacy ayarlarını günceller.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Request Body**:
```json
{
  "privacyLevel": "MUTUAL_FOLLOW_FRIENDS"
}
```

**Valid Privacy Levels**:
- `PUBLIC_TO_EVERYONE` - Herkes görebilir
- `MUTUAL_FOLLOW_FRIENDS` - Sadece karşılıklı takipçiler
- `SELF_ONLY` - Sadece kullanıcı (private)

**Response**:
```json
{
  "success": true,
  "videoId": "video_123",
  "privacyLevel": "MUTUAL_FOLLOW_FRIENDS",
  "message": "Privacy level update initiated"
}
```

**Example**:
```bash
curl -X PUT "https://ultrarslanoglu.com/api/tiktok/video/video_123/privacy" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privacyLevel": "MUTUAL_FOLLOW_FRIENDS"}'
```

---

#### Delete Video
```http
DELETE /api/tiktok/video/:videoId
```

Video'yu siler.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Response**:
```json
{
  "success": true,
  "message": "Video deletion initiated"
}
```

**Example**:
```bash
curl -X DELETE "https://ultrarslanoglu.com/api/tiktok/video/video_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Meta (Facebook/Instagram) Specific Endpoints

### Instagram Endpoints

#### Get Instagram Accounts
```http
GET /api/meta/instagram/accounts
```

Kullanıcının Instagram Business hesaplarını listeler.

**Response**:
```json
{
  "success": true,
  "accounts": [
    {
      "pageId": "page_123",
      "instagramId": "ig_account_123",
      "username": "ultrarslanoglu",
      "profilePicture": "https://...",
      "followersCount": 25000
    }
  ]
}
```

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/instagram/accounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Instagram Media List
```http
GET /api/meta/instagram/:accountId/media?limit=25
```

Instagram hesabının medya listesini getirir.

**Path Parameters**:
- `accountId` (string) - Instagram Business Account ID

**Query Parameters**:
- `limit` (number, optional) - Medya sayısı (default: 25)

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/instagram/ig_account_123/media?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Instagram Media Insights
```http
GET /api/meta/instagram/media/:mediaId/insights?metrics=impressions,reach,likes
```

Instagram media insights getirir.

**Path Parameters**:
- `mediaId` (string) - Instagram media ID

**Query Parameters**:
- `metrics` (string, optional) - Virgülle ayrılmış metrikler

**Available Metrics**:
- impressions, reach, likes, comments, shares, saves, plays, total_interactions

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/instagram/media/media_123/insights?metrics=impressions,reach,likes,comments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Instagram Account Insights
```http
GET /api/meta/instagram/account/:accountId/insights?metrics=follower_count,impressions&period=day
```

Instagram account insights getirir.

**Path Parameters**:
- `accountId` (string) - Instagram Business Account ID

**Query Parameters**:
- `metrics` (string, optional) - Virgülle ayrılmış metrikler
- `period` (string, optional) - day, week, days_28 (default: day)

**Available Metrics**:
- impressions, reach, follower_count, profile_views, website_clicks

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/instagram/account/ig_account_123/insights?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Facebook Endpoints

#### Get Facebook Pages
```http
GET /api/meta/facebook/pages
```

Kullanıcının Facebook Page'lerini listeler.

**Response**:
```json
{
  "success": true,
  "pages": [
    {
      "id": "page_123",
      "name": "Ultrarslanoglu Page",
      "access_token": "page_token"
    }
  ]
}
```

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/facebook/pages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Facebook Page Insights
```http
GET /api/meta/facebook/page/:pageId/insights?metrics=page_impressions&period=day
```

Facebook Page insights getirir.

**Path Parameters**:
- `pageId` (string) - Facebook Page ID

**Query Parameters**:
- `metrics` (string, optional) - Virgülle ayrılmış metrikler
- `period` (string, optional) - day, week, days_28 (default: day)

**Available Metrics**:
- page_impressions, page_engaged_users, page_video_views, page_fan_adds, page_post_engagements

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/facebook/page/page_123/insights?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Token Management

#### Refresh Meta Token
```http
POST /api/meta/refresh-token
```

Long-lived token'ı manuel olarak yeniler.

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expiresAt": "2026-02-20T10:00:00Z"
}
```

**Example**:
```bash
curl -X POST "https://ultrarslanoglu.com/api/meta/refresh-token" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Token Status
```http
GET /api/meta/token-status
```

Token durumunu ve debug bilgilerini getirir.

**Response**:
```json
{
  "success": true,
  "tokenInfo": {
    "isValid": true,
    "appId": "1044312946768719",
    "userId": "123456789",
    "expiresAt": "2026-02-20T10:00:00Z",
    "issuedAt": "2025-12-22T10:00:00Z",
    "scopes": ["public_profile", "email", "pages_show_list", ...],
    "type": "USER"
  }
}
```

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/meta/token-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Data Deletion (Facebook Requirement)

#### Submit Data Deletion Request
```http
POST /api/meta/data-deletion
```

Facebook data deletion callback endpoint (Public - Facebook calls this)

**Request Body (Facebook Callback)**:
```json
{
  "signed_request": "ENCODED_SIGNATURE.PAYLOAD"
}
```

**Request Body (Manual Form)**:
```json
{
  "email": "user@example.com",
  "userId": "optional_facebook_user_id"
}
```

**Response (Facebook Callback)**:
```json
{
  "url": "https://ultrarslanoglu.com/data-deletion-status/123456789_1703001600000",
  "confirmation_code": "123456789_1703001600000"
}
```

**Response (Manual Form)**:
```json
{
  "success": true,
  "message": "Data deletion request received. You will be notified via email."
}
```

---

#### Check Data Deletion Status
```http
GET /api/meta/data-deletion-status/:code
```

Data deletion status sayfası (HTML döndürür)

**Path Parameters**:
- `code` (string) - Confirmation code

**Response**: HTML page

---

### Webhook (Optional)

#### Webhook Verification
```http
GET /api/meta/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

Facebook webhook verification endpoint (Public)

**Query Parameters**:
- `hub.mode` (string) - subscribe
- `hub.verify_token` (string) - ultrarslanoglu_verify_token
- `hub.challenge` (string) - Random string from Facebook

**Response**: Echo back the challenge string

---

#### Webhook Events
```http
POST /api/meta/webhook
```

Facebook webhook events endpoint (Public)

**Request Body**:
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

**Response**: HTTP 200 with "EVENT_RECEIVED"

---

## Test Endpoint'leri (Development)

### Share Kit

#### Generate Share URL
```http
GET /api/tiktok/share?url=URL&title=TITLE&hashtags=TAGS
```

TikTok Share Kit URL'i oluşturur.

**Query Parameters**:
- `url` (string, optional) - Paylaşılacak URL
- `title` (string, optional) - Video başlığı
- `hashtags` (string, optional) - Virgülle ayrılmış hashtag'ler

**Response**:
```json
{
  "success": true,
  "shareUrl": "https://www.tiktok.com/share?url=...",
  "message": "Share URL generated. Redirect user to this URL to initiate TikTok sharing."
}
```

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/share?url=https://example.com/video&title=Amazing%20Video&hashtags=viral,trending"
```

---

#### Share Redirect
```http
POST /api/tiktok/share/redirect
```

Kullanıcıyı TikTok Share sayfasına yönlendirir.

**Request Body**:
```json
{
  "url": "https://example.com/video",
  "title": "Amazing Video",
  "hashtags": ["viral", "trending"]
}
```

**Response**: HTTP 302 Redirect to TikTok Share URL

---

### Video Management

#### Get Video List
```http
GET /api/tiktok/videos?cursor=CURSOR&maxCount=20
```

Kullanıcının TikTok videolarını listeler.

**Query Parameters**:
- `cursor` (string, optional) - Pagination cursor
- `maxCount` (number, optional) - Video sayısı (default: 20, max: 20)

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/videos?maxCount=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Video Analytics
```http
GET /api/tiktok/video/:videoId/analytics
```

Belirli bir videonun analytics'ini getirir.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/video/video_123/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Creator Analytics
```http
GET /api/tiktok/creator/analytics
```

Creator profil istatistiklerini getirir.

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/creator/analytics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Check Publish Status
```http
GET /api/tiktok/publish/status/:publishId
```

Video publish durumunu kontrol eder.

**Path Parameters**:
- `publishId` (string) - Publish ID (upload sırasında döner)

**Response**:
```json
{
  "success": true,
  "publishId": "v_pub_12345",
  "status": "PUBLISH_COMPLETE",
  "failReason": null,
  "videoId": "video_123",
  "shareUrl": "https://tiktok.com/@user/video/123"
}
```

**Status Values**:
- `PUBLISH_COMPLETE` - Video başarıyla yayınlandı
- `PROCESSING_DOWNLOAD` - TikTok video'yu indiriyor
- `PROCESSING_UPLOAD` - Video işleniyor
- `FAILED` - Yayınlama başarısız

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/publish/status/v_pub_12345" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Get Video Comments
```http
GET /api/tiktok/video/:videoId/comments?cursor=CURSOR&count=50
```

Video yorumlarını listeler.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Query Parameters**:
- `cursor` (string, optional) - Pagination cursor
- `count` (number, optional) - Yorum sayısı (default: 50)

**Response**:
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

**Example**:
```bash
curl -X GET "https://ultrarslanoglu.com/api/tiktok/video/video_123/comments?count=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Update Video Privacy
```http
PUT /api/tiktok/video/:videoId/privacy
```

Video privacy ayarlarını günceller.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Request Body**:
```json
{
  "privacyLevel": "MUTUAL_FOLLOW_FRIENDS"
}
```

**Valid Privacy Levels**:
- `PUBLIC_TO_EVERYONE` - Herkes görebilir
- `MUTUAL_FOLLOW_FRIENDS` - Sadece karşılıklı takipçiler
- `SELF_ONLY` - Sadece kullanıcı (private)

**Response**:
```json
{
  "success": true,
  "videoId": "video_123",
  "privacyLevel": "MUTUAL_FOLLOW_FRIENDS",
  "message": "Privacy level update initiated"
}
```

**Example**:
```bash
curl -X PUT "https://ultrarslanoglu.com/api/tiktok/video/video_123/privacy" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privacyLevel": "MUTUAL_FOLLOW_FRIENDS"}'
```

---

#### Delete Video
```http
DELETE /api/tiktok/video/:videoId
```

Video'yu siler.

**Path Parameters**:
- `videoId` (string) - TikTok video ID

**Response**:
```json
{
  "success": true,
  "message": "Video deletion initiated"
}
```

**Example**:
```bash
curl -X DELETE "https://ultrarslanoglu.com/api/tiktok/video/video_123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📺 YouTube Specific Endpoints

### OAuth 2.0

#### YouTube Login
```http
GET /auth/youtube/login
```

Google OAuth sayfasına redirect eder.

**Response**: HTTP 302 Redirect to Google OAuth

---

#### YouTube Callback
```http
GET /auth/youtube/callback?code=CODE&state=STATE
```

OAuth callback'i işle ve JWT token oluştur.

**Response**:
```json
{
  "success": true,
  "message": "YouTube authentication successful",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "User Name",
    "googleId": "google_id_123",
    "profileImage": "https://..."
  },
  "token": "eyJhbGc...",
  "googleToken": {
    "accessToken": "ya29...",
    "refreshToken": "1/...",
    "expiryDate": "2025-01-23T10:00:00Z",
    "tokenType": "Bearer"
  }
}
```

---

### Channels

#### Get YouTube Channels
```http
GET /api/youtube/channels
Authorization: Bearer JWT_TOKEN
```

Authenticated user'ın YouTube channel'larını listeler.

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

**Example**:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://ultrarslanoglu.com/api/youtube/channels"
```

---

### Video Upload

#### Upload Video to YouTube
```http
POST /api/youtube/upload
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

Video'yu YouTube'a yükle (resumable upload).

**Request Body**:
```json
{
  "videoPath": "/path/to/video.mp4",
  "metadata": {
    "title": "My Awesome Video",
    "description": "Video description",
    "tags": ["youtube", "tutorial"],
    "categoryId": "22",
    "privacyStatus": "private"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video upload initiated",
  "videoId": "dQw4w9WgXcQ",
  "title": "My Awesome Video",
  "privacyStatus": "private",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

---

### Video Management

#### Get Video Info
```http
GET /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
```

Belirli bir video'nun bilgilerini al.

**Response**:
```json
{
  "success": true,
  "video": {
    "id": "dQw4w9WgXcQ",
    "title": "Video Title",
    "description": "Description",
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

---

#### Get Video List
```http
GET /api/youtube/videos?maxResults=25&order=date
Authorization: Bearer JWT_TOKEN
```

User'ın YouTube video'larını listeler.

**Query Parameters**:
- `maxResults` (int, optional) - Sonuç sayısı (default: 25)
- `pageToken` (string, optional) - Pagination token
- `search` (string, optional) - Arama query'si
- `order` (string, optional) - date, rating, relevance, title, videoCount, viewCount

**Response**:
```json
{
  "success": true,
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "description": "Description",
      "thumbnail": "https://i.ytimg.com/vi/...",
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

---

#### Update Video
```http
PUT /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```

Video'nun title, description, tags, privacy'sini güncelle.

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"],
  "privacyStatus": "public"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Video updated successfully",
  "videoId": "dQw4w9WgXcQ",
  "title": "Updated Title",
  "status": "public"
}
```

---

#### Delete Video
```http
DELETE /api/youtube/video/:videoId
Authorization: Bearer JWT_TOKEN
```

Video'yu sil.

**Response**:
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

### Analytics

#### Get Video Analytics
```http
GET /api/youtube/analytics/video/:videoId?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer JWT_TOKEN
```

Video analytics verilerini al.

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
    }
  }
}
```

---

#### Get Channel Analytics
```http
GET /api/youtube/analytics/channel?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer JWT_TOKEN
```

Channel analytics verilerini al.

**Response**:
```json
{
  "success": true,
  "analytics": {
    "metrics": {
      "views": 50000,
      "watchTime": 25000,
      "subscribersGained": 1500,
      "likes": 5000,
      "comments": 750,
      "shares": 250,
      "playlistAdds": 100
    }
  }
}
```

---

#### Get Traffic Sources
```http
GET /api/youtube/analytics/traffic
Authorization: Bearer JWT_TOKEN
```

Traffic sources analytics.

**Response**:
```json
{
  "success": true,
  "trafficData": {
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
      }
    ]
  }
}
```

---

### Token Management

#### Refresh Token
```http
POST /api/youtube/refresh-token
Authorization: Bearer JWT_TOKEN
```

Access token'ı yenile.

**Response**:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "ya29...",
  "expiryDate": "2025-01-23T10:00:00Z"
}
```

---

#### Get Token Status
```http
GET /api/youtube/token-status
Authorization: Bearer JWT_TOKEN
```

Token durumunu kontrol et.

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
    ]
  }
}
```

---

## Test Endpoint'leri (Development)

```http
GET /health              - Health check
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-22T12:00:00.000Z",
  "uptime": 86400,
  "environment": "production"
}
```
