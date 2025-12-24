# Meta Webhook Flow Diyagramları

## 1. Webhook Doğrulama (Verification) Akışı

```
Meta Servers (Development.Facebook.com)
│
├─ GET /meta/webhook?
│  ├─ hub.mode=subscribe
│  ├─ hub.verify_token=xxx
│  └─ hub.challenge=RANDOM123
│
↓
Your App (ultrarslanoglu.com)
│
├─ GET /meta/webhook
│  └─ webhookRoutes.js → router.get('/webhook', ...)
│     ├─ Parametreleri oku
│     ├─ Token kontrol et (VERIFY_TOKEN eşleş mi?)
│     │  ├─ ✅ EVET  → 200 OK + RANDOM123
│     │  └─ ❌ HAYIR → 403 Forbidden
│     └─ Logging ve error handling
│
↓
Meta Servers
│
├─ Response: 200 OK + RANDOM123
└─ ✅ Webhook doğrulandı!
```

---

## 2. Webhook Event İşleme (POST) Akışı

```
Meta Servers
│
├─ POST /meta/webhook (Event Payload)
│  ├─ Headers:
│  │  ├─ Content-Type: application/json
│  │  └─ X-Hub-Signature: sha256=xxx (optional)
│  │
│  └─ Body: JSON Event
│     ├─ object: "page" | "instagram"
│     └─ entry: [
│        ├─ id: entity_id
│        ├─ time: timestamp
│        ├─ messaging: [] (messaging events)
│        └─ changes: [] (Instagram events)
│
↓
Your App
│
├─ POST /meta/webhook
│  └─ webhookRoutes.js → router.post('/webhook', ...)
│
├─ 1. Event Validation
│  └─ object === 'page' || 'instagram'? ✅
│
├─ 2. Entry Processing
│  └─ forEach entry in body.entry:
│
├─ 3. Event Routing
│  ├─ Messaging Event?
│  │  └─ webhookService.processMessagingEvent()
│  │     ├─ handleMessage() → message event
│  │     ├─ handleDelivery() → delivery receipt
│  │     ├─ handleRead() → read receipt
│  │     ├─ handlePostback() → button click
│  │     └─ handleOptIn() → user permission
│  │
│  └─ Instagram Event?
│     └─ webhookService.processInstagramEvent()
│        ├─ handleInstagramComment()
│        ├─ handleInstagramMention()
│        ├─ handleInstagramStoryInsights()
│        └─ handleInstagramFeed()
│
├─ 4. Response
│  └─ 200 OK { status: "received" }
│
└─ 5. Async Processing
   ├─ Database save
   ├─ Logging
   ├─ Notifications
   └─ Analytics
```

---

## 3. Messaging Event Türleri

```
INCOMING MESSAGE EVENT
├─ sender: { id: "USER_ID" }
├─ recipient: { id: "PAGE_ID" }
├─ timestamp: 1234567890000
└─ message: {
   ├─ mid: "msg_1"
   ├─ text: "Merhaba!" (optional)
   └─ attachments: [] (optional)
      ├─ type: "image|video|audio|file"
      └─ payload: { url: "..." }
   
   │
   ↓ handleMessage()
   │
   ├─ Database save
   ├─ User lookup
   ├─ Notification send
   └─ Auto-reply (optional)


DELIVERY NOTIFICATION EVENT
├─ sender: { id: "USER_ID" }
├─ recipient: { id: "PAGE_ID" }
└─ delivery: {
   ├─ mids: ["msg_1", "msg_2"]
   └─ watermark: 1234567890000
   
   │
   ↓ handleDelivery()
   │
   ├─ Update message status → "delivered"
   ├─ Update watermark
   └─ Logging


READ RECEIPT EVENT
├─ sender: { id: "USER_ID" }
├─ recipient: { id: "PAGE_ID" }
└─ read: {
   └─ watermark: 1234567890000
   
   │
   ↓ handleRead()
   │
   ├─ Update message status → "read"
   ├─ Update timestamp
   └─ Analytics


POSTBACK EVENT (BUTTON CLICK)
├─ sender: { id: "USER_ID" }
├─ recipient: { id: "PAGE_ID" }
└─ postback: {
   ├─ payload: "ACTION_NAME"
   └─ title: "Button Text" (optional)
   
   │
   ↓ handlePostback()
   │
   ├─ Parse payload
   ├─ Execute action
   ├─ Send response
   └─ Logging


OPT-IN EVENT
├─ sender: { id: "USER_ID" }
├─ recipient: { id: "PAGE_ID" }
└─ optin: {
   └─ ref: "CUSTOMER_MATCH_REF"
   
   │
   ↓ handleOptIn()
   │
   ├─ User subscription → enabled
   ├─ Database update
   └─ Welcome message
```

---

## 4. Instagram Event Türleri

```
INSTAGRAM COMMENT EVENT
└─ changes[0]: {
   ├─ field: "comments"
   └─ value: {
      ├─ id: "COMMENT_ID"
      ├─ text: "Harika post!"
      ├─ from: { id: "USER_ID" }
      └─ media: { id: "MEDIA_ID" }
   
   │
   ↓ handleInstagramComment()
   │
   ├─ Store comment
   ├─ Trigger notification
   ├─ Sentiment analysis
   ├─ Duplicate check
   └─ Analytics


INSTAGRAM MENTION EVENT
└─ changes[0]: {
   ├─ field: "mentions"
   └─ value: {
      ├─ media: { id: "MEDIA_ID" }
      └─ from: { id: "USER_ID" }
   
   │
   ↓ handleInstagramMention()
   │
   ├─ Store mention
   ├─ Highlight notification
   └─ Analytics


INSTAGRAM STORY INSIGHTS EVENT
└─ changes[0]: {
   ├─ field: "story_insights"
   └─ value: {
      ├─ story_id: "STORY_ID"
      ├─ exits: 5
      ├─ impressions: 20
      ├─ replies: 2
      ├─ backbutton_taps: 1
      └─ taps_forward: 3
   
   │
   ↓ handleInstagramStoryInsights()
   │
   ├─ Store metrics
   ├─ Update analytics
   └─ Generate reports


INSTAGRAM FEED EVENT
└─ changes[0]: {
   ├─ field: "feed"
   └─ value: {
      ├─ media_id: "MEDIA_ID"
      ├─ caption: "Caption text"
      └─ timestamp: 1234567890000
   
   │
   ↓ handleInstagramFeed()
   │
   ├─ Update feed cache
   ├─ Sync content
   └─ Analytics
```

---

## 5. Data Flow - Komple Örnek

```
Meta Platform
│
├─ User: "Ayşe" (@ayse_xyz)
│  └─ Sends message: "Merhaba!" to Business Page
│
↓ MESSAGE EVENT
│
Your Server (Port 3000)
├─ POST /meta/webhook
│  └─ Content-Type: application/json
│     └─ Body:
│        {
│          "object": "page",
│          "entry": [{
│            "id": "PAGE_ID_123",
│            "time": 1703385600000,
│            "messaging": [{
│              "sender": {"id": "USER_AYSE"},
│              "recipient": {"id": "PAGE_ID_123"},
│              "timestamp": 1703385600000,
│              "message": {
│                "mid": "msg_001",
│                "text": "Merhaba!"
│              }
│            }]
│          }]
│        }
│
↓ PROCESS
│
├─ 1. Validate: object === "page" ✅
├─ 2. Route: Messaging event found
├─ 3. Process: handleMessage() başla
├─ 4. Database: Message kaydet
│  ├─ user_id: AYSE_123
│  ├─ platform: "meta"
│  ├─ text: "Merhaba!"
│  ├─ status: "received"
│  └─ timestamp: 1703385600000
├─ 5. Logging: 📨 Message received
└─ 6. Response: 200 OK { status: "received" }
│
↓
│
├─ Next Step: Notification
│  ├─ Send push notification
│  ├─ Email alert
│  └─ Dashboard update
│
└─ Next Step: Auto-Reply (optional)
   ├─ Check sentiment
   ├─ Generate response
   └─ Send via Messenger API


↓ DELIVERY & READ
│
├─ Msg Status: "delivered" (auto)
├─ Msg Status: "read" (when user reads)
└─ Analytics: "message_received"
```

---

## 6. Error Handling Flow

```
Invalid Webhook Request
│
├─ Verification Error?
│  ├─ Token mismatch
│  │  └─ 403 Forbidden
│  ├─ Missing parameters
│  │  └─ 400 Bad Request
│  └─ Logging
│
├─ Event Processing Error?
│  ├─ Try-catch block
│  ├─ Log error details
│  ├─ Return 200 OK (prevent retry)
│  └─ Alert monitoring
│
├─ Database Error?
│  ├─ Log exception
│  ├─ Retry logic
│  ├─ Fallback storage
│  └─ Alert admin
│
└─ Server Error?
   ├─ 500 Internal Server Error
   ├─ Log stack trace
   ├─ Alert monitoring
   └─ Disable webhook (optional)
```

---

## 7. Testing Flow

```
Test Suite: npm run test:webhook
│
├─ TEST 1: Verification (GET)
│  ├─ Request: GET /meta/webhook?hub.mode=subscribe&...
│  ├─ Expected: 200 OK + challenge
│  └─ Assertion: response.data === challenge
│
├─ TEST 2: Invalid Token (GET)
│  ├─ Request: GET /meta/webhook?hub.verify_token=invalid&...
│  ├─ Expected: 403 Forbidden
│  └─ Assertion: response.status === 403
│
├─ TEST 3: Message Event (POST)
│  ├─ Request: POST /meta/webhook (message payload)
│  ├─ Expected: 200 OK { status: "received" }
│  └─ Assertion: response.status === 200
│
├─ TEST 4: Instagram Event (POST)
│  ├─ Request: POST /meta/webhook (Instagram payload)
│  ├─ Expected: 200 OK { status: "received" }
│  └─ Assertion: response.status === 200
│
├─ TEST 5: Multiple Events (POST)
│  ├─ Request: POST /meta/webhook (3 events in one entry)
│  ├─ Expected: 200 OK { status: "received" }
│  └─ Assertion: All events processed
│
└─ TEST 6: Status Endpoint (GET)
   ├─ Request: GET /meta/webhook/status
   ├─ Expected: 200 OK + webhook status
   └─ Assertion: response.data.webhook.status === "active"


SUMMARY
├─ Total: 6 tests
├─ Passed: 6/6
├─ Failed: 0/6
└─ Pass Rate: 100% ✅
```

---

## 8. Database Schema (Örnek)

```
Message Collection
├─ _id: ObjectId
├─ user_id: ObjectId
├─ sender_id: String (Meta User ID)
├─ platform: "meta"
├─ page_id: String
├─ text: String
├─ attachments: [
│  ├─ type: "image|video|audio"
│  └─ url: String
│ ]
├─ status: "received|delivered|read"
├─ metadata: {
│  ├─ mid: String (Message ID)
│  ├─ watermark: Number
│  └─ source: "messaging|comment"
│ }
├─ created_at: Date
├─ updated_at: Date
└─ is_archived: Boolean


EventLog Collection
├─ _id: ObjectId
├─ webhook_request_id: String
├─ event_type: "message|delivery|read|postback|comment|mention"
├─ platform: "meta"
├─ payload: Object (Original event)
├─ status: "processed|error"
├─ error_message: String (if error)
├─ processed_at: Date
└─ duration_ms: Number
```

---

## 9. Monitoring & Alerting

```
Webhook Monitor
│
├─ ✅ Event Received
│  ├─ Log: "📨 Incoming event"
│  ├─ Increment: received_count++
│  └─ Alert: If too many (DDoS?)
│
├─ 🔍 Event Processing
│  ├─ Log: "Processing event type"
│  ├─ Metric: processing_time_ms
│  └─ Alert: If > 30 seconds
│
├─ ✅ Event Processed
│  ├─ Log: "✅ Event processed"
│  ├─ Increment: processed_count++
│  └─ Update: last_event_time
│
├─ ❌ Event Error
│  ├─ Log: "❌ Error processing"
│  ├─ Increment: error_count++
│  ├─ Alert: PagerDuty/Slack
│  └─ Send: Support ticket
│
└─ 📊 Metrics Dashboard
   ├─ Events/hour: 150
   ├─ Success rate: 99.8%
   ├─ Avg response time: 245ms
   ├─ Errors/hour: 1
   └─ Status: ✅ Healthy
```

---

## 10. Production Deployment Checklist

```
Pre-Deployment Validation
├─ ✅ Code Review
├─ ✅ Unit Tests (6/6 pass)
├─ ✅ Integration Tests
├─ ✅ Security Check (SSL, tokens)
├─ ✅ Load Testing
└─ ✅ Documentation

Deployment Steps
├─ 1. Backup Database
├─ 2. Deploy Code
├─ 3. Verify SSL Certificate
├─ 4. Update Webhook URL (if needed)
├─ 5. Test Webhook Connection
├─ 6. Enable Monitoring
├─ 7. Notify Teams
└─ 8. Monitor Logs (24 hours)

Post-Deployment
├─ Monitor error rates
├─ Check performance metrics
├─ Verify all events are processing
├─ Review logs for issues
└─ Prepare rollback plan (if needed)

Rollback Plan
├─ Stop new deployments
├─ Revert to previous version
├─ Update webhook URL
├─ Test verification
├─ Notify teams
└─ Root cause analysis
```

---

**Diyagram Sürümü:** 1.0  
**Güncelleme Tarihi:** 24 Aralık 2025
