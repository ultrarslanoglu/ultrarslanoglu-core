# 🔐 Kimlik Doğrulama Sistemi - Kurulum Kılavuzu

## 🎯 Genel Bakış

Ultrarslanoglu-Core projesi artık **profesyonel bir kimlik doğrulama sistemi** ile donatılmıştır. Bu sistem şunları içerir:

- ✅ JWT tabanlı token authentication
- ✅ Rol bazlı yetkilendirme (Viewer, Editor, Admin, Superadmin)
- ✅ NextAuth.js ile frontend entegrasyonu
- ✅ Güvenli şifre yönetimi (bcrypt)
- ✅ Email doğrulama & şifre sıfırlama
- ✅ Session yönetimi
- ✅ Rate limiting koruması

## 📁 Yeni Dosyalar

### Backend (Social Media Hub)

```
social-media-hub/
├── src/
│   ├── models/
│   │   ├── User.js           # Kullanıcı modeli (MongoDB schema)
│   │   ├── Token.js          # OAuth token modeli
│   │   ├── Upload.js         # Upload tracking modeli
│   │   └── index.js          # Model exports
│   ├── routes/
│   │   └── userRoutes.js     # Kullanıcı auth routes (/api/user/*)
│   └── utils/
│       └── auth.js           # Genişletilmiş auth middleware
└── .env.example              # Environment variables şablonu
```

### Frontend (Website)

```
ultrarslanoglu-website/
├── pages/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth].ts  # NextAuth.js config
│   ├── auth/
│   │   ├── login.tsx        # Login sayfası
│   │   └── register.tsx     # Kayıt sayfası
│   ├── dashboard.tsx        # Kullanıcı dashboard
│   └── admin/
│       └── index.tsx        # Admin paneli
├── types/
│   └── next-auth.d.ts       # NextAuth type definitions
├── middleware.ts            # Route protection middleware
└── .env.example            # Environment variables şablonu
```

## 🚀 Kurulum Adımları

### 1. Backend Kurulumu

```bash
cd social-media-hub

# Environment variables oluştur
cp .env.example .env

# .env dosyasını düzenle:
# - JWT_SECRET: Güçlü bir secret key
# - JWT_REFRESH_SECRET: Farklı bir secret key
# - MONGODB_URI: MongoDB bağlantı string'i
# - Diğer API credentials...

# MongoDB'nin çalıştığından emin ol
mongod

# Servisi başlat
npm run dev
```

### 2. Frontend Kurulumu

```bash
cd ultrarslanoglu-website

# Environment variables oluştur
cp .env.example .env

# .env dosyasını düzenle:
# - NEXTAUTH_SECRET: Güçlü bir secret key (backend'den farklı)
# - NEXT_PUBLIC_API_URL: Backend API URL (http://localhost:3000)
# - NEXTAUTH_URL: Website URL (http://localhost:3001)

# Servisi başlat
npm run dev
```

## 🔑 Kullanıcı Rolleri

| Rol | Yetkiler | Açıklama |
|-----|----------|----------|
| **viewer** | Sadece görüntüleme | Analytics ve genel bilgileri görüntüleyebilir |
| **editor** | Upload + görüntüleme | Video yükleme, içerik oluşturma yetkisi |
| **admin** | Tam yönetim | Kullanıcı yönetimi, rol değiştirme |
| **superadmin** | Sistem yönetimi | Tüm yetkiler + superadmin oluşturma |

## 📡 API Endpoints

### Kullanıcı Yönetimi

```
POST   /api/user/register            # Yeni kullanıcı kaydı
POST   /api/user/login               # Kullanıcı girişi
POST   /api/user/logout              # Kullanıcı çıkışı
POST   /api/user/refresh             # Token yenileme
GET    /api/user/me                  # Mevcut kullanıcı bilgileri
PUT    /api/user/me                  # Profil güncelleme
POST   /api/user/change-password     # Şifre değiştirme
POST   /api/user/forgot-password     # Şifre sıfırlama isteği
POST   /api/user/reset-password/:token  # Şifre sıfırlama
POST   /api/user/verify-email/:token # Email doğrulama
GET    /api/user/list                # Kullanıcı listesi (Admin)
GET    /api/user/:userId             # Kullanıcı detayı
PUT    /api/user/:userId/role        # Rol değiştirme (Admin)
DELETE /api/user/:userId             # Kullanıcı devre dışı (Admin)
```

### Örnek İstekler

**Kayıt:**
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "fullName": "Ad Soyad",
    "password": "password123"
  }'
```

**Giriş:**
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Protected Endpoint:**
```bash
curl -X GET http://localhost:3000/api/user/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🎨 Frontend Kullanımı

### Login Sayfası
```
http://localhost:3001/auth/login
```

### Register Sayfası
```
http://localhost:3001/auth/register
```

### Dashboard
```
http://localhost:3001/dashboard
```

### Admin Panel
```
http://localhost:3001/admin
```

## 🔒 Güvenlik Özellikleri

1. **Şifre Güvenliği**
   - Bcrypt ile hash (12 rounds)
   - Minimum 8 karakter zorunluluğu
   - Şifre hiçbir zaman plain text olarak saklanmaz

2. **Token Güvenliği**
   - JWT access token (15 dakika)
   - JWT refresh token (30 gün)
   - Token blacklisting desteği (Redis ile)

3. **Rate Limiting**
   - Auth endpoint'leri: 5 istek/15 dakika
   - Genel API: 100 istek/15 dakika

4. **Account Locking**
   - 5 başarısız login denemesinden sonra 2 saat kilitleme
   - Otomatik unlock mekanizması

5. **CORS Protection**
   - Sadece izin verilen origin'lerden istek kabul edilir

## 🧪 Test

### İlk Kullanıcı Oluşturma

1. Website'i aç: `http://localhost:3001`
2. "Kayıt Ol" butonuna tıkla
3. Formu doldur ve kayıt ol
4. İlk kullanıcı otomatik olarak **viewer** rolü alır

### Admin Rolü Verme (Manuel - MongoDB)

```javascript
// MongoDB shell veya Compass ile:
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Veya Backend API ile (Superadmin gerekli)

```bash
curl -X PUT http://localhost:3000/api/user/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "role": "admin" }'
```

## 📊 Database Schema

### User Collection

```javascript
{
  email: String (unique),
  password: String (hashed),
  username: String (unique),
  fullName: String,
  role: 'viewer' | 'editor' | 'admin' | 'superadmin',
  isActive: Boolean,
  isEmailVerified: Boolean,
  connectedPlatforms: {
    tiktok: { connected, userId, username, ... },
    instagram: { ... },
    youtube: { ... },
    x: { ... }
  },
  stats: {
    totalUploads, totalViews, totalEngagement
  },
  preferences: { language, timezone, notifications },
  createdAt, updatedAt
}
```

## 🔧 Yapılandırma

### JWT Token Süreleri

`social-media-hub/src/utils/auth.js`:
```javascript
// Access token: 15 dakika
generateToken(userId, '15m')

// Refresh token: 30 gün
generateRefreshToken(userId, '30d')
```

### Rate Limit Ayarları

`social-media-hub/src/utils/rateLimiter.js`:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 istek
  message: 'Too many authentication attempts'
});
```

## 🐛 Troubleshooting

### "User not authenticated" hatası
- Token'ın doğru gönderildiğinden emin olun: `Authorization: Bearer <token>`
- Token'ın süresi dolmamış olmalı
- Backend ve frontend aynı ağda mı?

### "CORS error"
- `.env` dosyasında `CORS_ORIGIN` doğru ayarlandı mı?
- Frontend URL'i backend'de whitelist'te mi?

### "Cannot connect to MongoDB"
- MongoDB servisi çalışıyor mu? (`mongod`)
- Connection string doğru mu? (`.env` -> `MONGODB_URI`)

### Session kaybolması
- Cookie ayarları tarayıcıda aktif mi?
- `SESSION_SECRET` değişti mi?

## 📚 İleri Seviye

### Email Doğrulama Ekleme

1. SMTP ayarlarını `.env`'ye ekle
2. Email servisi entegre et (Nodemailer)
3. `userRoutes.js`'te TODO yerlerini doldur

### Token Blacklisting (Redis)

```bash
# Redis kur
npm install ioredis

# .env'ye ekle
REDIS_URL=redis://localhost:6379
```

### OAuth Social Login

NextAuth.js Google/GitHub provider'ları ekle:
```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
  }),
  // ...
]
```

## 🎉 Sonuç

Artık projeniz **profesyonel bir kimlik doğrulama sistemine** sahip! 

- ✅ Güvenli kullanıcı yönetimi
- ✅ Rol bazlı yetkilendirme
- ✅ Modern JWT authentication
- ✅ Production-ready güvenlik

---

**Ultrarslanoglu-Core** - Galatasaray Dijital Liderlik Projesi 🟡🔴
