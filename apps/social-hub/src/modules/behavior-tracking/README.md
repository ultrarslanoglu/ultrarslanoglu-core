# Kullanıcı Davranış Takip Modülü

Gerçek zamanlı kullanıcı etkileşim izleme sistemi. Socket.io ile canlı event streaming, MongoDB'de kalıcılık ve REST API analytics dashboard'u.

## 📋 Özellikler

### 1. **Gerçek Zamanlı Event Streaming**
- Socket.io WebSocket bağlantıları
- Redis adapter ile distributed tracking
- 12+ event türü desteği
- Otomatik batch işleme

### 2. **Event Türleri**
- `page_view` - Sayfa görüntülemeleri
- `click` - Kullanıcı tıklamaları
- `scroll` - Kaydırma hareketleri
- `form_submit` - Form gönderimleri
- `video_play` / `video_pause` - Video oynatma
- `search` - Arama işlemleri
- `like`, `comment`, `share` - Sosyal etkileşimler
- `follow` / `unfollow` - Takip işlemleri
- `custom` - Özel event'ler

### 3. **Veri Kalıcılığı**
- MongoDB şemaları (3 collection)
- Otomatik TTL indexleri (90 gün event, 180 gün session)
- Bileşik indexler (performans optimizasyonu)
- Veri denetleme ve arşivleme

### 4. **Analytics Dashboard API**
- 10+ REST API endpoint'i
- Filtreleme ve sayfalandırma
- Gerçek zamanlı metrikler
- Heatmap verisi
- CSV/JSON export

### 5. **Güvenlik**
- JWT token authentication
- Rate limiting
- Sensitive field redaction (password, card vb.)
- CORS koruması
- HMAC-based Socket.io auth

## 🚀 Başlangıç

### 1. Kurulum

```bash
# Gerekli paketler
npm install socket.io @socket.io/redis-adapter redis geoip-lite uuid

# oder Yarn
yarn add socket.io @socket.io/redis-adapter redis geoip-lite uuid
```

### 2. Express App'e Entegrasyon

```javascript
// app.js
const http = require('http');
const express = require('express');
const Redis = require('ioredis');
const { initializeBehaviorTracking } = require('./src/modules/behavior-tracking');

const app = express();
const httpServer = http.createServer(app);
const redisClient = new Redis(process.env.REDIS_URL);

// Davranış izlemesi başlat
(async () => {
  const behaviorServer = await initializeBehaviorTracking(
    app,
    httpServer,
    redisClient
  );
})();

httpServer.listen(3000, () => {
  console.log('Server started on port 3000');
});
```

### 3. Frontend SDK Entegrasyonu

```html
<!-- HTML'de Socket.io ve SDK'yı yükle -->
<script src="https://cdn.socket.io/4.5.4/socket.io.js"></script>
<script src="/modules/behavior-tracking/behavior-tracker-sdk.js"></script>

<!-- SDK'yı başlat -->
<script>
  BehaviorTracker.init({
    socketUrl: 'http://localhost:3000',
    authToken: 'user_jwt_token',
    debug: true
  });
</script>
```

## 📡 API Endpoints

### Genel Analytics
```
GET /api/analytics/overview?startDate=2024-01-01&endDate=2024-01-31
```
Yanıt:
```json
{
  "success": true,
  "data": {
    "totalEvents": 15234,
    "uniqueUsers": 1205,
    "uniqueSessions": 3421,
    "eventsByType": [
      { "_id": "page_view", "count": 5234 },
      { "_id": "click", "count": 3421 }
    ],
    "eventsByCategory": [...]
  }
}
```

### Event Listesi
```
GET /api/analytics/events?userId=xxxxx&eventType=click&limit=50&skip=0
```

### Kullanıcı Analytics
```
GET /api/analytics/user/:userId?startDate=2024-01-01&endDate=2024-01-31
```

### Sayfa Heatmap'i
```
GET /api/analytics/heatmap?url=/product&startDate=2024-01-01
```

### Gerçek Zamanlı Metrikler
```
GET /api/analytics/metrics?interval=1hour
```

### Top Sayfalar
```
GET /api/analytics/top-pages?limit=10
```

### Cihaz İstatistikleri
```
GET /api/analytics/devices?startDate=2024-01-01
```

### Oturumlar
```
GET /api/analytics/sessions?status=active&limit=50
```

### Veri Export
```
POST /api/analytics/export
Content-Type: application/json

{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "format": "json|csv"
}
```

## 🎯 SDK Kullanımı

### Sayfa Görüntülemesi
```javascript
BehaviorTracker.trackEvent('pageView', {
  url: window.location.href,
  title: document.title,
  metadata: { custom: 'data' }
});
```

### Form Gönderimi
```javascript
const formData = { name: 'John', email: 'john@example.com' };
BehaviorTracker.trackFormSubmit('contact-form', formData, 2500);
```

### Video İzleme
```javascript
BehaviorTracker.trackVideoEvent('video-1', 'play', {
  title: 'Video Title',
  duration: 300,
  currentTime: 45
});
```

### Arama
```javascript
BehaviorTracker.trackSearch('machine learning', 245, 'product', 1200);
```

### Sosyal Etkileşim
```javascript
BehaviorTracker.trackSocialInteraction('like', 'post-123', {
  contentType: 'post',
  contentOwnerId: 'user-456'
});
```

### Özel Event
```javascript
BehaviorTracker.trackCustomEvent('premium_feature_used', {
  featureId: 'feature-1',
  duration: 5000
}, ['premium', 'analytics']);
```

## 🗄️ MongoDB Şemaları

### UserBehaviorEvent
```javascript
{
  eventId: String,           // Unique ID
  userId: ObjectId,          // User reference
  sessionId: String,         // Session identifier
  eventType: String,         // Event type
  eventCategory: String,     // Category (engagement, navigation, etc.)
  url: String,              // Page URL
  data: {
    elementId: String,
    elementClass: String,
    elementText: String,
    mouseCoordinates: { x, y },
    scrollPosition: { x, y },
    customMetadata: {}
  },
  metrics: {
    responseTime: Number,
    loadTime: Number,
    renderTime: Number
  },
  timestamp: Date,           // Server time
  clientTime: Date,         // Client time
  duration: Number,         // Event duration
  status: String,           // success/warning/error
  archived: Boolean,        // For retention
  createdAt: Date,
  updatedAt: Date
}
```

### UserSession
```javascript
{
  sessionId: String,        // Unique session ID
  userId: ObjectId,         // User reference
  startTime: Date,
  endTime: Date,
  duration: Number,         // milliseconds
  userAgent: String,
  ipAddress: String,
  deviceType: String,       // mobile/tablet/desktop
  browser: String,
  pageViews: Number,
  interactions: Number,
  status: String,           // active/idle/ended
  pages: [{
    url: String,
    title: String,
    enteredAt: Date,
    exitedAt: Date,
    timeSpent: Number
  }],
  eventSummary: {
    totalEvents: Number,
    byType: {},
    byCategory: {}
  }
}
```

### BehaviorAnalytics
```javascript
{
  date: Date,               // Daily aggregate
  totalUsers: Number,
  newUsers: Number,
  returningUsers: Number,
  activeSessions: Number,
  totalEvents: Number,
  eventsByType: {},
  eventsByCategory: {},
  avgSessionDuration: Number,
  avgPageViewsPerSession: Number,
  bounceRate: Number,
  deviceBreakdown: {},
  browserBreakdown: {},
  topCountries: [{ country, count }],
  peakHour: Number,
  errorRate: Number
}
```

## 🔒 Güvenlik

### Authentication
```javascript
// JWT token ile
BehaviorTracker.init({
  authToken: 'eyJhbGciOiJIUzI1NiIs...'
});

// Token yenileme
BehaviorTracker.setAuthToken(newToken);
```

### Sensitive Field Redaction
Otomatik olarak şu alanlar maskelenir:
- `password` → `[REDACTED]`
- `credit_card` → `[REDACTED]`
- `ssn`, `cvv`, `token`, `apiKey`, `secret`

### Rate Limiting
- Per user: 100 connections/minute
- Per session: Configurable batch limits
- Backpressure handling: Automatic queue management

## 📊 Örnek Dashboard Queries

```javascript
// Son 7 günde en aktif kullanıcılar
db.user_behavior_events.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
    }
  },
  {
    $group: {
      _id: '$userId',
      eventCount: { $sum: 1 },
      uniqueSessions: { $addToSet: '$sessionId' }
    }
  },
  { $sort: { eventCount: -1 } },
  { $limit: 10 }
]);

// Sayfa başına geçirilen ortalama süre
db.user_behavior_events.aggregate([
  { $match: { eventType: 'page_view' } },
  {
    $group: {
      _id: '$url',
      avgTime: { $avg: '$data.timeOnPage' },
      viewCount: { $sum: 1 }
    }
  },
  { $sort: { avgTime: -1 } }
]);
```

## 🛠️ Konfigürasyon

### Environment Variables
```bash
# .env
REDIS_URL=redis://localhost:6379
MONGO_URI=mongodb://localhost:27017/behavior_tracking
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
BEHAVIOR_TRACKING_DEBUG=true
```

### Socket.io Seçenekleri
```javascript
{
  cors: {
    origin: process.env.ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6, // 1MB
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
}
```

## 📈 Performans Optimizasyonları

1. **Batch Processing**
   - Default 10 event batch size
   - 5000ms timeout for smaller batches
   - Configurable per SDK instance

2. **Database Indexing**
   - Single field indexes: userId, sessionId, eventType, timestamp
   - Compound indexes: (userId, timestamp), (sessionId, timestamp)
   - TTL indexes for automatic data cleanup

3. **Redis Caching**
   - Active session caching (1 hour TTL)
   - Event deduplication
   - Rate limit tracking

4. **Socket.io Optimization**
   - Redis adapter for horizontal scaling
   - Message compression
   - Binary protocol support

## 🔧 Troubleshooting

### Socket bağlantısı yok
```javascript
// Debug modunu aç
BehaviorTracker.init({ debug: true });

// Browser console'da socket.io mesajlarını gör
```

### Event'ler kaydedilmiyor
```javascript
// Redis bağlantısını kontrol et
redis-cli ping

// MongoDB bağlantısını kontrol et
mongosh "mongodb://localhost:27017"
```

### Yüksek CPU kullanımı
```javascript
// Event batch size'ı artır
BehaviorTracker.init({ batchSize: 25 });

// Socket.io ping interval'ını artır
pingInterval: 60000
```

## 📚 İleri Konular

### Custom Event Processing
```javascript
// Handler ekle
const customHandler = async (userId, sessionId, data) => {
  // Custom logic
  return {
    eventId: uuid(),
    eventType: 'custom',
    // ... rest of event data
  };
};
```

### Real-time Analytics Room
```javascript
// Analytics dashboard'unda dinle
socket.on('analytics:update', (data) => {
  console.log('Event received:', data);
  updateDashboard(data);
});
```

### Webhook Integration
```javascript
// Event'ler aşağıdaki sistemlere gönderilebilir:
- Sentry (error tracking)
- Slack (notifications)
- Custom API (your own service)
```

## 📝 License

MIT

## 🤝 Support

Sorularınız için: support@example.com
