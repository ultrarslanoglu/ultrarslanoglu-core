# Meta Webhook Setup Checklist ✅

Ultrarslanoglu Social Media Hub'a Meta Webhook entegrasyonunun kurulum ve doğrulama adımları.

## 📋 Kurulum Kontrol Listesi

### ✅ Sunucu Tarafı Kurulum

- [x] **Webhook Routes Oluşturuldu**
  - `src/routes/webhookRoutes.js` - 200+ satır
  - GET endpoint'i: Webhook doğrulaması
  - POST endpoint'i: Event işleme
  - Status endpoint'i: Webhook durumu
  
- [x] **Webhook Service Oluşturuldu**
  - `src/services/webhookService.js` - 400+ satır
  - Messaging olayları (message, delivery, read, postback, optin)
  - Instagram olayları (comments, mentions, story_insights)
  - Event type'a göre işleme

- [x] **App.js Güncellenmiştir**
  - Webhook routes import edildi
  - `/meta/webhook` route'ları eklendi
  - Express app'e entegre edildi

- [x] **Ortam Değişkenleri Ayarlandı**
  - `META_WEBHOOK_VERIFY_TOKEN=ultrarslanoglu_webhook_token_2025`
  - `.env` dosyasında tanımlandı

- [x] **Package.json Güncellenmiştir**
  - `npm run test:webhook` script'i eklendi
  - Test aracı kolayca çalıştırılabilir

### 📚 Dokümantasyon Oluşturuldu

- [x] **META-WEBHOOK-GUIDE.md** (650+ satır)
  - Webhook doğrulaması
  - Event türleri referansı
  - Test etme yöntemleri
  - Güvenlik best practices
  - Sorun giderme rehberi

- [x] **API Test Cases** (api-test.rest)
  - 10+ webhook test endpoint'i
  - Verification, messaging, Instagram olayları
  - REST Client ile doğrudan test edilebilir

- [x] **Test Script** (scripts/test-meta-webhook.js)
  - 6 otomatik test fonksiyonu
  - Kapsamlı error handling
  - Detaylı test raporlaması

---

## 🚀 Hızlı Başlangıç

### 1. Sunucuyu Başlat

```bash
# Geliştirme ortamında
npm run dev

# veya Production
npm start
```

Çıktı:
```
🚀 Server running on port 3000
📡 Environment: development
🌐 Base URL: https://ultrarslanoglu.com
```

### 2. Webhook'ları Test Et

**Option A: Otomatik Test Script**
```bash
npm run test:webhook
```

Beklenen sonuç:
```
📊 TEST SUMMARY
===============
Total Tests: 6
✅ Passed: 6
❌ Failed: 0
Pass Rate: 100%

🎉 All tests passed! Webhook is working correctly.
```

**Option B: REST Client ile Manual Test**

VS Code'da `api-test.rest` dosyasını aç ve aşağıdaki endpoint'leri test et:

1. **Meta Webhook Verification (GET)**
   - "Send Request" butonuna tıkla
   - 200 OK ve challenge değeri bekleniyor

2. **Meta Webhook Status (GET)**
   - Webhook durumunu görmek için çalıştır
   
3. **Test Message Event (POST)**
   - Simüle mesaj eventi gönder
   - Logs'ta işlendiğini kontrol et

### 3. Meta Developers'da Kurulum

[Facebook Developers](https://developers.facebook.com) → Your App → Webhooks

```
Callback URL:   https://ultrarslanoglu.com/meta/webhook
Verify Token:   ultrarslanoglu_webhook_token_2025

Subscribe to:
✅ messages
✅ message_postbacks
✅ messaging_optins
✅ message_reads
✅ message_deliveries
✅ comments
✅ mentions
✅ story_insights
✅ feed
```

---

## 🔍 Doğrulama Testleri

### Test 1: Webhook Verification (GET)

```bash
curl -X GET 'http://localhost:3000/meta/webhook?hub.mode=subscribe&hub.verify_token=ultrarslanoglu_webhook_token_2025&hub.challenge=TEST123'
```

**Beklenen:**
```
HTTP/1.1 200 OK
TEST123
```

**Loglar:**
```
🔍 Webhook Verification Request:
  Mode: subscribe
  Token Match: true
  Challenge: TEST123
✅ Webhook verification successful!
```

---

### Test 2: Messaging Event (POST)

```bash
curl -X POST 'http://localhost:3000/meta/webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "object": "page",
    "entry": [{
      "id": "123",
      "time": 1234567890000,
      "messaging": [{
        "sender": {"id": "user_1"},
        "recipient": {"id": "page_1"},
        "message": {"text": "Merhaba!"}
      }]
    }]
  }'
```

**Beklenen:**
```json
{
  "status": "received"
}
```

**Loglar:**
```
📨 Incoming Webhook Event:
  Object: page
  Entry Count: 1
📩 Processing Entry:
  ID: 123
✅ Webhook events processed successfully
```

---

### Test 3: Instagram Comment (POST)

```bash
curl -X POST 'http://localhost:3000/meta/webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "ig_123",
      "changes": [{
        "field": "comments",
        "value": {
          "id": "c_1",
          "text": "Harika post!",
          "media": {"id": "m_1"}
        }
      }]
    }]
  }'
```

**Beklenen:**
```json
{
  "status": "received"
}
```

---

## 📊 Webhook Status Kontrol

```bash
curl http://localhost:3000/meta/webhook/status
```

**Yanıt:**
```json
{
  "success": true,
  "webhook": {
    "status": "active",
    "endpoint": "https://ultrarslanoglu.com/meta/webhook",
    "verifyToken": "ultrarslanoglu_webhook_token_2025",
    "supportedEvents": [
      "messages",
      "message_status",
      "read_receipts",
      "messaging_optins",
      "instagram_story_insights",
      "feed_posts"
    ],
    "lastUpdate": "2025-12-24T...",
    "uptime": 3600,
    "memory": {...}
  }
}
```

---

## 🔒 Güvenlik Kontrol Noktaları

### ✅ Yapılandırılan

- [x] Verify token doğrulaması
- [x] GET request'lerinde token kontrol
- [x] POST request'lerinde event validasyonu
- [x] Error handling ve logging
- [x] HTTPS zorunluluğu
- [x] Rate limiting hazırlığı

### ⚠️ Production Için Yapılması Gerekenler

- [ ] X-Hub-Signature doğrulaması (optional)
- [ ] Request timeout kontrol (30 saniye)
- [ ] Database bağlantı health check
- [ ] Alert ve monitoring sistemi
- [ ] Log rotation ve cleanup
- [ ] Webhook retry mekanizması

---

## 📁 Oluşturulan Dosyalar

```
social-media-hub/
├── src/
│   ├── routes/
│   │   └── webhookRoutes.js          ✅ 200+ satır
│   └── services/
│       └── webhookService.js         ✅ 400+ satır
├── scripts/
│   └── test-meta-webhook.js          ✅ 300+ satır, 6 test
├── api-test.rest                     ✅ 10+ webhook testi
├── .env                              ✅ TOKEN eklendi
├── package.json                      ✅ test:webhook script
├── META-WEBHOOK-GUIDE.md             ✅ 650+ satır dokümantasyon
└── META-WEBHOOK-SETUP-CHECKLIST.md   ✅ Bu dosya
```

---

## 🐛 Sorun Giderme

### Webhook doğrulaması başarısız oluyorsa

```javascript
// .env dosyasında kontrol et
META_WEBHOOK_VERIFY_TOKEN=ultrarslanoglu_webhook_token_2025

// Logs'ta bu mesajı görmelisin
✅ Webhook verification successful!
```

### Olaylar alınmıyorsa

1. **Server çalışıyor mu?**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Webhook status kontrol et**
   ```bash
   curl http://localhost:3000/meta/webhook/status
   ```

3. **Test mesajı gönder**
   ```bash
   npm run test:webhook
   ```

### HTTPS hatası

```javascript
// Production'da kullanmak için:
BASE_URL=https://ultrarslanoglu.com/meta/webhook

// Geliştirmede HTTP ile test yapabilirsin:
BASE_URL=http://localhost:3000/meta/webhook
```

---

## 📈 Monitoring Kurma

### Logs Kontrol

```bash
# Webhook isteklerini izle
tail -f logs/app.log | grep "webhook"

# Başarılı doğrulama
tail -f logs/app.log | grep "✅ Webhook"

# Hataları bul
tail -f logs/app.log | grep "❌\|error"
```

### Metrics

```bash
# Webhook istek sayısı
grep "Webhook events processed" logs/app.log | wc -l

# Farklı event türleri
grep "Processing" logs/app.log | cut -d: -f2 | sort | uniq -c
```

---

## 📚 Faydalı Bağlantılar

- **Webhook Dokümanı:** [META-WEBHOOK-GUIDE.md](META-WEBHOOK-GUIDE.md)
- **Facebook Webhooks:** https://developers.facebook.com/docs/messenger-platform/webhooks
- **Instagram API:** https://developers.facebook.com/docs/instagram-api
- **Meta Permissions:** https://developers.facebook.com/docs/permissions/reference

---

## ✨ Sonraki Adımlar

### Fase 1: Temel Fonksiyonalite ✅ (Tamamlandı)
- [x] Webhook endpoint'leri
- [x] Event işleme
- [x] Test altyapısı
- [x] Dokümantasyon

### Fase 2: Veri Depolama (Yapılacak)
- [ ] Message modeli oluştur
- [ ] Event history depolama
- [ ] Analytics data aggregation

### Fase 3: Gelişmiş Features (Yapılacak)
- [ ] X-Hub-Signature doğrulaması
- [ ] Webhook retry mekanizması
- [ ] Real-time notification sistemi
- [ ] Dashboard görselleştirme

### Fase 4: Optimization (Yapılacak)
- [ ] Performance tuning
- [ ] Rate limiting fine-tuning
- [ ] Cache mekanizması
- [ ] Load balancing

---

## 📞 Support

Sorun yaşanıyorsa:

1. **Logs kontrol et:**
   ```bash
   tail -f logs/app.log
   ```

2. **Test script çalıştır:**
   ```bash
   npm run test:webhook
   ```

3. **Webhook status kontrol et:**
   ```bash
   curl http://localhost:3000/meta/webhook/status
   ```

4. **Dokümantasyonu oku:**
   [META-WEBHOOK-GUIDE.md](META-WEBHOOK-GUIDE.md) - Sorun giderme bölümü

---

**Kurulum Tarihi:** 24 Aralık 2025  
**Durum:** ✅ Aktif ve Test Edilmiş  
**Sürüm:** 1.0.0
