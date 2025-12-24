# Meta (Facebook + Instagram) Webhook Integration

## 📌 Overview

Bu dokümantasyon, Ultrarslanoglu Social Media Hub'a Meta (Facebook + Instagram) webhook entegrasyonunun kurulum ve kullanımını açıklar.

**Webhook Endpoint:** `https://ultrarslanoglu.com/meta/webhook`  
**Verify Token:** `ultrarslanoglu_webhook_token_2025`  
**Protocol:** HTTPS (Güvenlilik için zorunlu)

---

## 🔧 Endpoint Yapısı

### Webhook Routes

```javascript
// src/routes/webhookRoutes.js
- GET  /meta/webhook         // Webhook doğrulaması (verification)
- POST /meta/webhook         // Webhook olayları alma (event handling)
- GET  /meta/webhook/status  // Webhook durumunu kontrol et
```

### Webhook Service

```javascript
// src/services/webhookService.js
- processMessagingEvent()    // Messaging olaylarını işle
- processInstagramEvent()    // Instagram olaylarını işle
- handleMessage()            // Gelen mesajları işle
- handleDelivery()           // Teslimat bildirimi
- handleRead()               // Okundu bildirimi
- handlePostback()           // Buton ve hızlı yanıtlar
- handleInstagramComment()   // Instagram yorumları
```

---

## 🔐 Webhook Doğrulaması (GET)

Meta, webhook'u kurduğunuzda doğrulama için bir GET isteği gönderir.

### İstek Parametreleri

```
GET https://ultrarslanoglu.com/meta/webhook?
    hub.mode=subscribe&
    hub.verify_token=ultrarslanoglu_webhook_token_2025&
    hub.challenge=RANDOM_STRING_123
```

| Parameter | Açıklama |
|-----------|----------|
| `hub.mode` | Always `subscribe` |
| `hub.verify_token` | Token doğrulamak için gönderilen kod |
| `hub.challenge` | Echo etmek için random string |

### Başarılı Yanıt (200)

```
HTTP/1.1 200 OK
RANDOM_STRING_123
```

Eğer token eşleşirse, `hub.challenge` parametresinin değerini döndürmelisiniz.

### Hata Yanıtları

```javascript
// Token eşleşmezse
403 Forbidden

// Parametreler eksikse
400 Bad Request

// Server hatası
500 Internal Server Error
```

### İmplementasyon

```javascript
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const VERIFY_TOKEN = 'ultrarslanoglu_webhook_token_2025';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
    logger.info('✅ Webhook verified');
  } else {
    res.sendStatus(403);
    logger.warn('❌ Webhook verification failed');
  }
});
```

---

## 📨 Webhook Olayları (POST)

Meta, olaylar gerçekleştiğinde POST isteği gönderir.

### İstek Formatı

```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1234567890,
      "messaging": [
        {
          "sender": { "id": "USER_ID" },
          "recipient": { "id": "PAGE_ID" },
          "timestamp": 1234567890,
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Merhaba! 👋"
          }
        }
      ]
    }
  ]
}
```

### Yanıt

Her POST isteğine **mutlaka 200 OK** döndürmelisiniz:

```json
{
  "status": "received"
}
```

Meta, yanıt almazsa webhook'u 60 saniye sonra yeniden gönderir.

---

## 📑 Olaylar Referansı

### 1. Messaging (Mesajlaşma) Olayları

#### Message (Gelen Mesaj)

```json
{
  "sender": { "id": "1234567890" },
  "recipient": { "id": "9876543210" },
  "timestamp": 1234567890123,
  "message": {
    "mid": "mid.123456",
    "text": "Selam!",
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "https://example.com/image.jpg"
        }
      }
    ]
  }
}
```

İşleme:
```javascript
async handleMessage(message, senderId, recipientId, pageId, timestamp) {
  const text = message.text;
  const attachments = message.attachments;
  
  // Mesajı veritabanına kaydet
  // Bildirim gönder
  // Otomatik yanıt gönder
}
```

#### Delivery (Teslimat Bildirimi)

```json
{
  "sender": { "id": "1234567890" },
  "recipient": { "id": "9876543210" },
  "delivery": {
    "mids": ["mid.1", "mid.2"],
    "watermark": 1234567890
  }
}
```

İşleme:
```javascript
async handleDelivery(delivery, senderId, recipientId, pageId) {
  const mids = delivery.mids;
  // Mesaj durumunu "delivered" olarak işaretle
}
```

#### Read (Okundu Bildirimi)

```json
{
  "sender": { "id": "1234567890" },
  "recipient": { "id": "9876543210" },
  "read": {
    "watermark": 1234567890
  }
}
```

İşleme:
```javascript
async handleRead(read, senderId, recipientId, pageId) {
  const watermark = read.watermark;
  // Mesaj durumunu "read" olarak işaretle
}
```

#### Postback (Buton Tıklaması)

```json
{
  "sender": { "id": "1234567890" },
  "recipient": { "id": "9876543210" },
  "postback": {
    "payload": "USER_CLICKED_BUTTON"
  }
}
```

İşleme:
```javascript
async handlePostback(postback, senderId, recipientId, pageId) {
  const payload = postback.payload;
  // Payload'a göre işlem yap
}
```

#### Opt-in (Kullanıcı İzin Verdi)

```json
{
  "sender": { "id": "1234567890" },
  "recipient": { "id": "9876543210" },
  "optin": {
    "ref": "OPTIONAL_CUSTOMER_MATCHING_REF"
  }
}
```

İşleme:
```javascript
async handleOptIn(optin, senderId, recipientId, pageId) {
  const ref = optin.ref;
  // Kullanıcıyı abone olarak işaretle
}
```

### 2. Instagram Olayları

#### Comments (Yorumlar)

```json
{
  "object": "instagram",
  "entry": [
    {
      "id": "IG_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "COMMENT_ID",
            "text": "Harika bir post! 💙",
            "from": { "id": "USER_ID" },
            "media": { "id": "MEDIA_ID" }
          }
        }
      ]
    }
  ]
}
```

İşleme:
```javascript
async handleInstagramComment(value, pageId) {
  const mediaId = value.media?.id;
  const commentText = value.text;
  
  // Yorumu veritabanına kaydet
  // Bildirim gönder
  // Sentiment analizi yap
}
```

#### Mentions (Etiketlenmeler)

```json
{
  "field": "mentions",
  "value": {
    "media": { "id": "MEDIA_ID" },
    "from": { "id": "USER_ID" }
  }
}
```

#### Story Insights (Hikaye İstatistikleri)

```json
{
  "field": "story_insights",
  "value": {
    "story_id": "STORY_ID",
    "exits": 5,
    "impressions": 20,
    "replies": 2
  }
}
```

#### Message Comments (Mesaj Yorumları)

```json
{
  "field": "message_comments",
  "value": {
    "id": "COMMENT_ID",
    "text": "Cevabınız nedir?",
    "from": { "id": "USER_ID" }
  }
}
```

---

## 🧪 Webhook Test Etme

### Yerel Ortamda Test

```bash
# 1. Server'ı başlat
npm start

# 2. Webhook testini çalıştır
npm run test:webhook

# Çıktı:
# 📋 TEST 1: Webhook Verification (GET)
# ✅ PASS: Webhook verification successful
# 
# 📋 TEST 2: Invalid Token Verification
# ✅ PASS: Invalid token properly rejected (403)
# 
# 📋 TEST 3: Messaging Event (POST)
# ✅ PASS: Messaging event processed (200)
# ...
```

### REST Client ile Test

`api-test.rest` dosyasında webhook testleri bulunmaktadır:

```rest
### Meta Webhook Verification
GET http://localhost:3000/meta/webhook?hub.mode=subscribe&hub.verify_token=ultrarslanoglu_webhook_token_2025&hub.challenge=RANDOM_CHALLENGE

### Meta Webhook Status
GET http://localhost:3000/meta/webhook/status

### Meta Webhook - Test Message Event
POST http://localhost:3000/meta/webhook
Content-Type: application/json

{
  "object": "page",
  "entry": [
    {
      "id": "123456789",
      "time": 1234567890000,
      "messaging": [
        {
          "sender": { "id": "user_123" },
          "recipient": { "id": "page_123" },
          "timestamp": 1234567890000,
          "message": {
            "mid": "msg_1",
            "text": "Merhaba! Bu bir test mesajıdır."
          }
        }
      ]
    }
  ]
}

### Meta Webhook - Test Instagram Comment
POST http://localhost:3000/meta/webhook
Content-Type: application/json

{
  "object": "instagram",
  "entry": [
    {
      "id": "ig_123456789",
      "time": 1234567890000,
      "changes": [
        {
          "field": "comments",
          "value": {
            "id": "comment_123",
            "text": "Çok güzel bir post! 🌟",
            "from": { "id": "user_456" },
            "media": { "id": "media_789" }
          }
        }
      ]
    }
  ]
}
```

---

## 📊 Meta App'te Webhook Kurulumu

### Adım 1: App Oluştur veya Seç

1. [Facebook Developers](https://developers.facebook.com) sayfasına git
2. "My Apps" → "Create App" (veya mevcut app'i seç)
3. App türü: **Business** seç

### Adım 2: Webhooks Ürününü Ekle

1. Dashboard'da **"Products"** bölümüne git
2. **"Webhooks"** arama ve ekle
3. **Webhook'u Yapılandır:**

   - **Callback URL:** `https://ultrarslanoglu.com/meta/webhook`
   - **Verify Token:** `ultrarslanoglu_webhook_token_2025`
   - **Subscribe to events:**
     - `messages`
     - `messaging_postbacks`
     - `messaging_optins`
     - `message_reads`
     - `message_deliveries`
     - `comments`
     - `mentions`
     - `story_insights`
     - `feed`

### Adım 3: Test Et

1. Webhook'u gönder
2. "Test Subscription" düğmesine tıkla
3. Başarı mesajı gelmesi bekle

### Adım 4: Permissions

Webhook almak için gerekli izinler:

```
pages_manage_messaging      // Mesajları yönet
pages_read_engagement       // İçeriği oku
instagram_manage_messages   // Instagram mesajları
instagram_basic             // Instagram temel verisi
```

---

## 🔒 Güvenlik Best Practices

### 1. HTTPS Kullanın

Webhook endpoint'iniz **HTTPS** protokolü kullanmalıdır.

```javascript
// ❌ HTTP kullananmayın
https://ultrarslanoglu.com/meta/webhook  // ✅

// ✅ HTTPS zorunludur
http://ultrarslanoglu.com/meta/webhook   // ❌
```

### 2. Verify Token Kontrol Edin

Her isteğin verify token'ını kontrol edin:

```javascript
if (req.query['hub.verify_token'] !== VERIFY_TOKEN) {
  res.sendStatus(403);
  return;
}
```

### 3. X-Hub-Signature Doğrulaması

Meta, her webhook isteği ile `X-Hub-Signature` header'ı gönderir:

```javascript
const crypto = require('crypto');

function verifySignature(req, appSecret) {
  const signature = req.headers['x-hub-signature'];
  if (!signature) return false;
  
  const hash = crypto
    .createHmac('sha1', appSecret)
    .update(req.rawBody, 'utf8')
    .digest('hex');
    
  const [algorithm, checksum] = signature.split('=');
  return hash === checksum;
}
```

### 4. Rate Limiting

Webhook isteklerini rate limiting ile koruyun:

```javascript
const rateLimit = require('express-rate-limit');

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 dakika
  max: 100,                 // maksimum 100 istek
  skip: (req) => req.user?.admin // admin'leri skip et
});

app.use('/meta/webhook', webhookLimiter);
```

### 5. Logging

Tüm webhook isteklerini logla:

```javascript
logger.info('Webhook event received', {
  object: body.object,
  entryCount: body.entry?.length,
  timestamp: new Date(),
  ip: req.ip
});
```

---

## 🐛 Sorun Giderme

### Problem: Webhook doğrulaması başarısız

**Nedeni:**
- Verify token yanlış
- Callback URL erişilebilir değil
- HTTPS kullanılmıyor

**Çözümü:**
```javascript
// Token'ı kontrol et
console.log('Expected:', 'ultrarslanoglu_webhook_token_2025');
console.log('Received:', req.query['hub.verify_token']);

// URL'yi test et
curl -X GET 'https://ultrarslanoglu.com/meta/webhook?hub.mode=subscribe&hub.verify_token=ultrarslanoglu_webhook_token_2025&hub.challenge=test123'

// HTTPS kontrol et
openssl s_client -connect ultrarslanoglu.com:443
```

### Problem: Webhook olayları alınmıyor

**Nedeni:**
- Subscribe ettiğiniz event türü yanlış
- Webhook timeout (>30 saniye)
- 200 OK yanıtı döndürülmüyor

**Çözümü:**
```javascript
// Webhook'u hızlı döndür
router.post('/meta/webhook', async (req, res) => {
  // 200 OK hemen döndür
  res.status(200).json({ status: 'received' });
  
  // Sonra işlemeyi başlat
  processWebhookAsync(req.body).catch(logger.error);
});
```

### Problem: "X-Hub-Signature invalid"

**Nedeni:**
- Request body'si değiştirildi
- Raw body kullanılmadı

**Çözümü:**
```javascript
// Raw body middleware kullanın
app.use(express.raw({ type: 'application/json' }));

// Request body'sini parse etmeden önce hash'leyin
const bodyParser = express.json();
app.use((req, res, next) => {
  req.rawBody = req.body;
  next();
}, bodyParser);
```

---

## 📈 Webhook Monitoring

### Logs Kontrol Et

```bash
# Terminal'de logları izle
tail -f logs/app.log | grep webhook

# Webhook başarılarını say
grep "✅ Webhook events processed" logs/app.log | wc -l

# Hataları kontrol et
grep "❌" logs/app.log
```

### Dashboard

Webhook durumunu kontrol etmek için:

```bash
# Webhook status endpoint'ini çağır
curl http://localhost:3000/meta/webhook/status

# Yanıt:
{
  "success": true,
  "webhook": {
    "status": "active",
    "endpoint": "https://ultrarslanoglu.com/meta/webhook",
    "supportedEvents": [
      "messages",
      "message_status",
      "read_receipts",
      ...
    ],
    "uptime": 86400,
    "memory": {...}
  }
}
```

---

## 🚀 Deployment

### Production'da Webhook

1. **SSL Certificate Kontrol Et**
   ```bash
   # Certificate'i doğrula
   openssl x509 -in /etc/ssl/certs/your-cert.pem -text -noout
   ```

2. **Verify Token Kaydet**
   ```bash
   # .env dosyasına ekle
   META_WEBHOOK_VERIFY_TOKEN=ultrarslanoglu_webhook_token_2025
   ```

3. **Rate Limiting Ayarla**
   ```javascript
   // Production ayarları
   const webhookLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 dakika
     max: 1000,                 // maksimum 1000 istek
     skipSuccessfulRequests: true
   });
   ```

4. **Monitoring Kurut**
   - Sentry veya benzer hata tracking
   - Log aggregation (ELK, Datadog)
   - Uptime monitoring

---

## 📚 Kaynak Dosyalar

```
src/
├── routes/
│   └── webhookRoutes.js          # Webhook route'ları
├── services/
│   └── webhookService.js         # Webhook işleme
└── models/
    ├── User.js                   # Kullanıcı modeli
    └── Token.js                  # Token modeli

scripts/
└── test-meta-webhook.js          # Webhook test aracı

api-test.rest                      # REST Client testleri
```

---

## 📖 Faydalı Linkler

- [Meta Webhooks Documentation](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Webhook Events Reference](https://developers.facebook.com/docs/messenger-platform/reference/webhook-events)
- [App Roles & Permissions](https://developers.facebook.com/docs/messenger-platform/reference/permissions-and-features)

---

**Son Güncelleme:** 24 Aralık 2025  
**Sürüm:** 1.0.0  
**Durum:** ✅ Aktif
