# Meta Data Access Renewal Form - Teknik Analiz Raporu
**Tarih:** 3 Ocak 2026  
**Proje:** Ultrarslanoglu Core - Social Media Hub Integration  
**Meta App ID:** 1044312946768719  

---

## 1. DATA PROCESSORS (Veri İşleyicileri)

### Tanımı
Meta'dan alınan Instagram/Facebook verileri (kullanıcı profili, medya insights, takipçi istatistikleri) işleyen 3rd party servis sağlayıcılar.

### Mevcut Altyapı & Servis Sağlayıcılar

#### **A. Veritabanı Servisleri**

| Servis | Sağlayıcı | Kullanım | Veri Tipi |
|--------|-----------|---------|-----------|
| **MongoDB** | Self-Hosted / MongoDB Atlas (önerilir) | Kullanıcı tokens, Instagram accounts, media metadata saklanması | PII: User ID, email, Instagram account IDs, followers count |
| **PostgreSQL** | Self-Hosted / AWS RDS (önerilir) | Points & rewards sistemi, user transactions | PII: User ID, activity logs |
| **Redis** | Self-Hosted / Redis Cloud (önerilir) | Session caching, rate limiting, temporary data | Session tokens, temporary IDs |

**Kaynak:** `infrastructure/config/docker-compose.yml` (lines 19-92, 72-79)

#### **B. Cloud & Deployment Servisleri**

| Servis | Sağlayıcı | Kullanım | Veri Tipi |
|--------|-----------|---------|-----------|
| **AWS S3** | Amazon Web Services | Dosya uploads (video, images, user-generated content) | Kullanıcı tarafından yüklenen medya, metadata |
| **Docker** | Docker Inc. | Containerization, image storage | Application code, configuration |
| **Email Service** | SendGrid / AWS SES | Veri deletion onay emailleri, user notifications | User email addresses, deletion confirmation codes |

**Kaynak:** `.env.production` (lines 88-95)
```
USE_S3=true
AWS_ACCESS_KEY_ID=CHANGE_ME_AWS_KEY
AWS_SECRET_ACCESS_KEY=CHANGE_ME_AWS_SECRET
AWS_BUCKET_NAME=ultrarslanoglu-uploads
AWS_REGION=eu-west-1

SMTP_HOST=smtp.sendgrid.net
SMTP_PASS=CHANGE_ME_SENDGRID_API_KEY
```

#### **C. Monitoring & Analytics**

| Servis | Sağlayıcı | Kullanım | Veri Tipi |
|--------|-----------|---------|-----------|
| **Sentry** | Sentry.io | Error tracking, performance monitoring | Error logs, stack traces (PII filtered) |
| **Google Analytics** | Google LLC | Platform analytics | Anonymized usage patterns |
| **Datadog** | Datadog Inc. | Infrastructure monitoring | System metrics, logs |

**Kaynak:** `.env.production` (lines 109-112)

#### **D. Social Media Platform APIs (Direct Integration)**

| Platform | API | Veri Akışı | Veri Tipi |
|----------|-----|-----------|-----------|
| **Meta (Facebook/Instagram)** | Graph API v19.0 | OAuth token → Instagram media insights | followers_count, reach, impressions, engagement |
| **Google (YouTube)** | YouTube Data API v3 | OAuth token → Channel analytics | subscribers, video stats, engagement metrics |
| **TikTok** | TikTok Open API | OAuth token → Video analytics | public_metrics, followers |

**Kaynak:** `apps/social-hub/config/index.js` (lines 50-90)

---

### **Özet: Data Processors Listesi**

```
✅ MONGODB ATLAS (Önerilen) - Data Storage
✅ AWS S3 - File Storage  
✅ SENDGRID - Email Notifications
✅ SENTRY.IO - Error Monitoring
✅ GOOGLE ANALYTICS - Usage Analytics
✅ DATADOG - Infrastructure Monitoring
✅ DOCKER HUB - Container Registry
```

**Not:** Şu anda `CHANGE_ME` değerler var. Production deployment'da bu servisler kullanılmalı.

---

## 2. RESPONSIBLE ENTITY (Sorumlu Tüzel Kişi)

### Tanımı
Meta verilerinin kontrolünden ve işlemesinden sorumlu olan tüzel kişi (şirket, kurum).

### Tespit Edilen Bilgiler

#### **A. Sorumlu Kuruluş Kimliği**

| Alan | Değer | Kaynak |
|------|-------|--------|
| **Kuruluş Adı** | Ultrarslanoglu (belirtilmemiş, tahmin: şahıs veya Ltd./Inc.) | `.env.production` - FACEBOOK_CONTACT_EMAIL: `info@ultrarslanoglu.com` |
| **Domain** | ultrarslanoglu.com | `.env.production` - FACEBOOK_APP_DOMAIN, META_APP_DOMAIN, NEXT_PUBLIC_SITE_URL |
| **İletişim Email** | info@ultrarslanoglu.com | `.env.production`, social-hub config |
| **Ülke** | Türkiye (tahmin - .com TLD, Türkçe dokümantasyon) | Domain ve `NEXTAUTH_URL=https://ultrarslanoglu.com` |

**Kaynak:** `.env.production` (lines 51-57)
```dotenv
FACEBOOK_CONTACT_EMAIL=info@ultrarslanoglu.com
FACEBOOK_PRIVACY_POLICY_URL=https://ultrarslanoglu.com/privacy-policy.html
FACEBOOK_TERMS_URL=https://ultrarslanoglu.com/terms-of-service.html
FACEBOOK_DATA_DELETION_URL=https://ultrarslanoglu.com/data-deletion.html
```

#### **B. Privacy & Legal Pages (Mevcut)**

| Sayfa | URL | Durum | Dosya |
|------|-----|-------|-------|
| **Privacy Policy** | https://ultrarslanoglu.com/privacy-policy.html | ✅ Var | `social-hub/public/privacy-policy.html` (8KB) |
| **Terms of Service** | https://ultrarslanoglu.com/terms-of-service.html | ✅ Var | `social-hub/public/terms-of-service.html` (8KB) |
| **Data Deletion** | https://ultrarslanoglu.com/data-deletion.html | ✅ Var | `social-hub/public/data-deletion.html` (5KB) |

**Kaynak:** `social-hub/public/` directory

#### **C. Privacy Policy İçeriği Özeti**

```
✅ Meta (TikTok, Instagram, Facebook, YouTube, X) veri paylaşımı açıklandı
✅ Kullanıcı hakları (access, delete, revoke connections) belirtildi
✅ Üçüncü taraf servislere veri paylaşımı açıklandı
✅ Data deletion hakkı (30 günlük süre) belirtildi
❓ Ülke/Bölge bilgisi eksik (GDPR, KVKK, vs.)
```

**Kaynak:** `social-hub/public/privacy-policy.html` (lines 45-65)

### **Eksik Bilgiler**

```
⚠️ ŞIRKET YAPISI: Limited Şirket mi? Şahsi İşletme mi? Detay yok
⚠️ TAX ID / KDV: Vergi numarası tanımlanmamış
⚠️ YASAL ADRES: Fiziksel adres bilgisi yok
⚠️ LEGAL REPRESENTATIVE: İmza yetkili kişi adı yok
⚠️ GDPR REPRESENTATIVE: EU GDPR representative belirtilmemiş (türkiye de de KVKK)
```

---

## 3. PUBLIC AUTHORITY REQUESTS (Kamu Otoritesi Talepleri)

### Tanımı
Son 12 ay içinde devlet/mahkeme/düzenleyici otoritelerden veri taleplerine (subpoena, warrant, etc.) cevap verilip verilmediği.

### Kod & Dokümantasyonda Bulunduklarım

#### **A. Hazırlıklı Mekanizmalar**

| Alan | Durum | Detay |
|------|-------|-------|
| **Data Retention Policy** | ✅ Kısmi | Backup retention 30 gün (`.env.production` BACKUP_RETENTION_DAYS=30) |
| **Data Deletion Capability** | ✅ Mevcut | Meta, TikTok, Google OAuth tokens + user data silme implement edilmiş |
| **Audit Logging** | ✅ Mevcut | Winston logger + JSON log format (`LOG_FORMAT=json`) |
| **Legal Request Response Framework** | ❌ YOK | Kodda kamu taleplerine yanıt prosedürü yok |

**Kaynak:** `.env.production` (lines 121-126)

#### **B. Veri Silme Endpoint (Data Deletion)**

Meta için kamu taleplerine yanıt kapsamında veri silme mekanizması mevcut:

```javascript
// Dosya: apps/social-hub/src/routes/metaRoutes.js (line 222-294)

POST /api/meta/data-deletion
{
  "signed_request": "FACEBOOK_SIGNED_REQUEST" // Facebook callback
  OR
  "email": "user@example.com"                   // Manual request
}

// İşlem:
1. Token'ları bul (platformUserId veya email ile)
2. Token'ları pasif yap (isActive = false)
3. User'ın connectedPlatforms'dan platform sil
4. Confirmation code döndür
```

**Kaynak:** `social-hub/src/routes/metaRoutes.js` (lines 253-294)

#### **C. Logging & Audit Trail**

```javascript
// Data deletion log örneği:
logger.info('Facebook data deletion request', { facebookUserId });
logger.info('Data deletion completed', { facebookUserId, confirmationCode });
logger.info('Manual data deletion completed', { email });
```

**Kaynak:** `social-hub/src/routes/metaRoutes.js` (lines 230, 242, 280)

#### **D. Gerektiğinde Çekilen Veriler**

User'dan çekilebilecek Meta veriler:
- Instagram followers, media, insights
- Facebook pages, engagement metrics
- OAuth tokens
- Kullanıcı profil bilgileri

```javascript
// apps/social-hub/src/services/analytics.js
getInstagramStats(userId) → followers, impressions, reach, likes
getTikTokStats(userId) → video analytics, engagement
getYouTubeStats(userId) → channel stats, video performance
```

**Kaynak:** `social-hub/src/services/analytics.js` (lines 60-180)

### **Eksik Bilgiler**

```
❌ SUBPOENA/WARRANT RESPONSE PROCEDURE: Yasal taleplere yanıt prosedürü yok
❌ LEGAL HOLD PROCESS: Veri saklama emri alma prosedürü yok
❌ GOVERNMENT RESPONSE LOG: Kamu talepleri kaydı yok
❌ COMPLIANCE OFFICER: Veri protection officer atanmış mı? Bilgi yok
❌ SLA FOR LEGAL REQUESTS: Yanıt süresi belirtilmemiş
```

---

## 4. POLICIES (Politikalar)

### Tanımı
Yazılı politikalar: kamu otoritesi taleplerine karşı güvenlik, yasal uyum, veri minimizasyonu, taleplerin belgelenmesi.

### Tespit Edilen Politikalar

#### **A. Yazılı Politikalar (Mevcut)**

| Politika | Dosya | Durum | İçerik |
|----------|-------|-------|--------|
| **Privacy Policy** | `social-hub/public/privacy-policy.html` | ✅ Var | Veri kullanımı, paylaşım, haklar, cookies |
| **Terms of Service** | `social-hub/public/terms-of-service.html` | ✅ Var | Hizmet şartları, sorumluluk sınırı |
| **Data Deletion Policy** | `social-hub/public/data-deletion.html` | ✅ Var | 30 günlük silme süreci, Meta requirement |
| **Documentation Policies** | `social-hub/docs/META-SUMMARY.md` | ✅ Kısmi | Data deletion, webhooks, compliance açıklamalar |

#### **B. Veri Minimizasyonu Politikası**

✅ **Mevcut (Partial Implementation):**

```javascript
// Meta scope limitation:
scope: 'public_profile,email,pages_show_list,pages_read_engagement,
        pages_manage_posts,instagram_basic,instagram_content_publish,
        instagram_manage_insights'
        
// Instagram fields (selective):
- followers_count, reach, impressions, engagement (public metrics only)
- NO private messages, NO account credentials beyond token
```

**Kaynak:** `social-hub/config/index.js` (line 51-67)

#### **C. Token & Security Politikası**

✅ **Mevcut:**

```dotenv
# Güvenlik protokolleri:
JWT_SECRET=<32+ chars>
SESSION_SECRET=<32+ chars>
NEXTAUTH_SECRET=<32+ chars>

# Rate limiting:
RATE_LIMIT_WINDOW_MS=900000  # 15 dakika
RATE_LIMIT_MAX_REQUESTS=100

# TLS/SSL:
USE_SSL=true
SSL_CERT_PATH=/etc/nginx/certs/fullchain.pem
SSL_KEY_PATH=/etc/nginx/certs/privkey.pem
```

**Kaynak:** `.env.production` (lines 32-43, 104-107, 114-117)

#### **D. Data Retention & Deletion Politikası**

✅ **Mevcut (Kısmi):**

```dotenv
# Backup retention:
BACKUP_RETENTION_DAYS=30
BACKUP_SCHEDULE=0 2 * * *  # Her gün 02:00

# Data persistence:
KEEP_DATA_ON_DOWN=true  # Production'da koruma
```

**Kaynak:** `.env.production` (lines 119-126)

```javascript
// Meta Data Deletion Endpoint (30 günlük süre):
// public/data-deletion.html, line 47-51
"Note: This process may take up to 30 days to complete. 
You will receive a confirmation email once the deletion is finished."
```

**Kaynak:** `social-hub/public/data-deletion.html` (lines 47-51)

#### **E. Logging & Audit Politikası**

✅ **Mevcut:**

```dotenv
LOG_LEVEL=warning  # Production
LOG_FORMAT=json    # Structured logging

# Monitoring:
SENTRY_DSN=<sentry-key>
GOOGLE_ANALYTICS_ID=<ga4-id>
DATADOG_API_KEY=<datadog-key>
```

**Kaynak:** `.env.production` (lines 102-112)

```javascript
// Winston logger kullanımı:
logger.info('Data deletion completed', { facebookUserId, confirmationCode });
logger.info('Meta OAuth successful for user ${userId}');
logger.error('Data deletion error:', error);
```

**Kaynak:** `social-hub/src/routes/metaRoutes.js` (lines 230, 242, 280)

### **Eksik Politikalar**

```
❌ GOVERNMENTAL REQUEST RESPONSE POLICY
   - Yazılı prosedür: Mahkeme emri aldığında ne yapılacak?
   - Bildirim yükümlülüğü: User'a bildirilecek mi?
   - Deadline: Ne kadar sürede cevap verilecek?

❌ TRANSPARENCY REPORT POLICY
   - Devlet taleplerini yıllık rapor etme politikası yok
   - Public disclosure yapılacak mı?

❌ CROSS-BORDER DATA TRANSFER POLICY
   - Data ABD/EU/Türkiye tarafından işleniyorsa, nasıl korunuyor?
   - Privacy Shield, Standard Contractual Clauses var mı?

❌ INCIDENT RESPONSE POLICY
   - Data breach oldığında ne yapılacak?
   - User notification prosedürü yok (yazılı olarak)

❌ THIRD-PARTY PROCESSOR AGREEMENT
   - AWS, SendGrid, Sentry ile DPA (Data Processing Agreement) var mı?
   - Documentation yok
```

---

## 5. META DATA ACCESS RENEWAL FORM - HAZIRLIK ÖZETI

### **Doldurulacak Alanlar & Tavsiyeler**

#### **Bölüm 1: RESPONSIBLE ENTITY**

```
Şirket Adı: Ultrarslanoglu (Ltd./Inc. turu belirt)
Ülke: Turkey (Türkiye)
Yasal Adres: [INFO@ULTRARSLANOGLU.COM'YE KONTROL ET]
Tax ID: [DOLDUR]
Adı Geçen Kişi: [Founder/CEO adı]
Email: info@ultrarslanoglu.com ✅
```

#### **Bölüm 2: DATA PROCESSORS**

```
☑️ Database (MongoDB Atlas veya AWS RDS)
☑️ Cloud Storage (AWS S3)
☑️ Email Service (SendGrid)
☑️ Monitoring (Sentry.io, Datadog)
☑️ Analytics (Google Analytics)

DPA Status: ⚠️ Kontrol et - tüm servislerin DPA'ları var mı?
```

#### **Bölüm 3: PUBLIC AUTHORITY REQUESTS**

```
Son 12 ay içinde talep: NO (veya sayı belirt)
Response procedure: ✅ Data deletion endpoint mevcut
Notification policy: ❓ User'a bildirim yapılıyor mu? Kontrol et
Transparency report: ❌ Yayınlanmıyor
```

#### **Bölüm 4: POLICIES**

```
Privacy Policy: ✅ https://ultrarslanoglu.com/privacy-policy.html
Data Deletion: ✅ https://ultrarslanoglu.com/data-deletion.html
Retention Policy: ✅ 30 günlük backup
Response SLA: ❌ [TANIMLA - ör. 30 gün içinde]
Incident Response: ❌ [YAZILI POLİTİKA HAZIRLA]
```

---

## 6. ÖNERİLER & AKSIYON MADDELERİ

### **ACIL (PRE-RENEWAL):**

- [ ] **Şirket Yapısı:** Ultrarslanoglu'nun yasal statüsü belirlensin (Ltd., Inc., vs.)
- [ ] **Tax ID & Adres:** KVK'ye kayıtlı resmi adres ve vergi numarası alınsın
- [ ] **DPA'lar:** AWS, SendGrid, Sentry, Datadog ile Data Processing Agreements kontrol edilsin
- [ ] **Legal Officer:** GDPR/KVKK sorumlusu atanması (DPO - Data Protection Officer)

### **KISA VADE (30 gün):**

- [ ] **Written Legal Request Response Procedure:** Yazılı prosedür hazırlansin
  - Government request alma
  - User notification mekanizması
  - Response deadline (30-60 gün tavsiye)
  - Logging (kamu talepleri kaydı)

- [ ] **Incident Response Policy:** Yazılı data breach prosedürü
  - Detection, notification, remediation
  - Regulatory reporting

- [ ] **Privacy Policy Updates:** 
  - GDPR/KVKK compliance bilgisi eklensin
  - Data transfer mekanizması açıklansin (ABD/EU)

### **ORTA VADE (90 gün):**

- [ ] **Transparency Report:** Yıllık kamu talepleri raporu hazırlansin
- [ ] **Audit Log Implementation:** Tüm data access operations logging
- [ ] **Backup & Recovery SLA:** RPO/RTO belirtilsin

---

## 7. KAYNAKLAR

### Dokümantasyon Dosyaları
- `.env.production` - Configuration & deployment settings
- `infrastructure/config/docker-compose.yml` - Services & infrastructure
- `apps/social-hub/config/index.js` - Application configuration
- `social-hub/public/privacy-policy.html` - Privacy policy
- `social-hub/public/data-deletion.html` - Data deletion page
- `social-hub/src/routes/metaRoutes.js` - Data deletion implementation

### İlgili Kodlar
- Data deletion: `metaRoutes.js` lines 222-294
- Analytics: `analytics.js` lines 60-180
- Logging: Winston logger throughout codebase

---

**Rapor Hazırlayan:** AI Assistant  
**Analiz Tarihi:** 3 Ocak 2026  
**Son Güncelleme:** 2026-01-03  
**Durum:** DRAFT (Meta renewal öncesi review gerekli)
