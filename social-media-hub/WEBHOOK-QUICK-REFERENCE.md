# 🚀 Meta Webhook - Hızlı Referans

## Endpoint'ler

```
GET  https://ultrarslanoglu.com/meta/webhook          # Verification
POST https://ultrarslanoglu.com/meta/webhook          # Events
GET  https://ultrarslanoglu.com/meta/webhook/status   # Status
```

## Verify Token

```
ultrarslanoglu_webhook_token_2025
```

## Test Komutları

```bash
# Webhook test'i çalıştır
npm run test:webhook

# Server başlat
npm start

# Verification testi (cURL)
curl -X GET 'http://localhost:3000/meta/webhook?hub.mode=subscribe&hub.verify_token=ultrarslanoglu_webhook_token_2025&hub.challenge=TEST123'

# Status kontrol et
curl http://localhost:3000/meta/webhook/status

# Test mesajı gönder
curl -X POST 'http://localhost:3000/meta/webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "object": "page",
    "entry": [{
      "id": "123",
      "messaging": [{
        "sender": {"id": "user_1"},
        "message": {"text": "Merhaba!"}
      }]
    }]
  }'
```

## Dosya Referansı

| Dosya | Satır | Amaç |
|-------|-------|------|
| `src/routes/webhookRoutes.js` | 200+ | Webhook route'ları |
| `src/services/webhookService.js` | 400+ | Event işleme |
| `scripts/test-meta-webhook.js` | 300+ | Test script (6 test) |
| `api-test.rest` | 100+ | REST Client testleri |
| `.env` | 1 | `META_WEBHOOK_VERIFY_TOKEN` |
| `package.json` | 1 | `npm run test:webhook` |

## Event Türleri

### Messaging (Facebook)
- `message` - Gelen mesaj
- `delivery` - Teslimat bildirimi
- `read` - Okundu bildirimi
- `postback` - Buton tıklaması
- `optin` - Kullanıcı izni

### Instagram
- `comments` - Post yorumları
- `mentions` - Etiketlenmeler
- `story_insights` - Hikaye istatistikleri
- `feed` - Feed güncellemeleri

## Response

```json
{
  "status": "received"
}
```

**HTTP Status:** 200 OK (zorunlu)

## Sorun Giderme

```bash
# Logları izle
tail -f logs/app.log | grep webhook

# Token kontrol et
echo $META_WEBHOOK_VERIFY_TOKEN

# Server çalışıyor mu?
curl http://localhost:3000/health

# Webhook status
curl http://localhost:3000/meta/webhook/status
```

## Dokümantasyon

- 📖 **Tüm Detaylar:** [META-WEBHOOK-GUIDE.md](META-WEBHOOK-GUIDE.md)
- ✅ **Kurulum:** [META-WEBHOOK-SETUP-CHECKLIST.md](META-WEBHOOK-SETUP-CHECKLIST.md)
- 📊 **Diyagramlar:** [WEBHOOK-FLOW-DIAGRAMS.md](WEBHOOK-FLOW-DIAGRAMS.md)
- 📋 **Özet:** [WEBHOOK-IMPLEMENTATION-SUMMARY.md](WEBHOOK-IMPLEMENTATION-SUMMARY.md)

## Meta App Ayarları

https://developers.facebook.com/apps/YOUR_APP_ID/webhooks

```
Callback URL:   https://ultrarslanoglu.com/meta/webhook
Verify Token:   ultrarslanoglu_webhook_token_2025

Subscribe to:
- messages
- message_postbacks
- messaging_optins
- message_reads
- message_deliveries
- comments
- mentions
- story_insights
- feed
```

## Environment Variables

```env
META_WEBHOOK_VERIFY_TOKEN=ultrarslanoglu_webhook_token_2025
META_WEBHOOK_SECRET=your-meta-webhook-secret
```

## Test Durumu

```
✅ Webhook Verification      PASS
✅ Invalid Token             PASS
✅ Messaging Event           PASS
✅ Instagram Event           PASS
✅ Multiple Events           PASS
✅ Webhook Status            PASS

Pass Rate: 100%
```

## Handler Fonksiyonları

```javascript
// src/services/webhookService.js

async processMessagingEvent(event, pageId)
async processInstagramEvent(change, pageId)

// Messaging Handlers
async handleMessage(message, senderId, recipientId, pageId, timestamp)
async handleDelivery(delivery, senderId, recipientId, pageId)
async handleRead(read, senderId, recipientId, pageId)
async handlePostback(postback, senderId, recipientId, pageId)
async handleOptIn(optin, senderId, recipientId, pageId)
async handleStandby(standby, senderId, recipientId, pageId)

// Instagram Handlers
async handleInstagramComment(value, pageId)
async handleInstagramMessageComment(value, pageId)
async handleInstagramMention(value, pageId)
async handleInstagramStoryInsights(value, pageId)
async handleInstagramFeed(value, pageId)
```

## GET Request (Verification)

```
Request:
GET /meta/webhook?
    hub.mode=subscribe&
    hub.verify_token=XXX&
    hub.challenge=RANDOM

Response:
HTTP/1.1 200 OK
RANDOM
```

## POST Request (Event)

```
Request:
POST /meta/webhook
Content-Type: application/json

{
  "object": "page|instagram",
  "entry": [{
    "id": "entity_id",
    "time": 1234567890000,
    "messaging": [...] or
    "changes": [...]
  }]
}

Response:
HTTP/1.1 200 OK
{
  "status": "received"
}
```

---

**Son Güncelleme:** 24 Aralık 2025  
**Sürüm:** 1.0.0
