# 🚀 Ultrarslanoglu Proje Başlatma Rehberi

## ✅ Tamamlanan İşlemler

### 1. **Bağımlılıklar Yüklendi**
- ✅ Backend (Social Media Hub): 600 paket
- ✅ Frontend (Website): 736 paket

### 2. **Veritabanı & Cache**
- ✅ MongoDB 7.0 çalışıyor (Port: 27017)
- ✅ Redis 7-alpine çalışıyor (Port: 6379)
- Şifreler:
  - MongoDB User: `admin`
  - MongoDB Password: `ultrarslanoglu2025`

### 3. **Backend Çalışıyor** 
- 🟢 **Status**: Aktif
- 📍 **URL**: http://localhost:3000
- 🔧 **Framework**: Express.js + Node.js
- 🗄️ **Database**: MongoDB Connected ✅
- 🔐 **Authentication**: JWT + Refresh Tokens
- 📊 **API**: 13+ Auth Endpoints

### 4. **Frontend Çalışıyor**
- 🟢 **Status**: Aktif  
- 📍 **URL**: http://localhost:3001
- ⚛️ **Framework**: Next.js 14 + React 18
- 🔐 **Auth**: NextAuth.js + JWT
- 🎨 **Styling**: Tailwind CSS

---

## 📋 Sistem Özeti

### Backend Endpoints (Hazır)

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | Kullanıcı girişi |
| POST | `/api/auth/refresh` | Token yenileme |
| POST | `/api/auth/logout` | Çıkış |
| GET | `/api/user/me` | Profil bilgisi |
| PUT | `/api/user/me` | Profil güncelleme |
| POST | `/api/auth/change-password` | Şifre değişimi |
| POST | `/api/auth/forgot-password` | Şifremi unuttum |
| POST | `/api/auth/reset-password` | Şifre sıfırlama |
| GET | `/api/user` | Tüm kullanıcılar (Admin) |
| PUT | `/api/user/:id/role` | Rol ata (Admin) |
| DELETE | `/api/user/:id` | Kullanıcı sil (Admin) |

### Frontend Sayfaları (Hazır)

- 🔓 **Public Pages**
  - `/auth/login` - Giriş sayfası
  - `/auth/register` - Kayıt sayfası

- 🔐 **Protected Pages**
  - `/dashboard` - Kullanıcı dashboard'ı
  - `/admin` - Admin paneli (Role: admin/superadmin)

---

## 🔧 Ortam Konfigürasyonu

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/ultrarslanoglu_social
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this-in-production
```

---

## 🧪 API Test Örnekleri

### Kayıt İşlemi
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "SecurePassword123!"
  }'
```

### Giriş İşlemi
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

---

## 📝 Güvenlik Özellikleri

✅ **Şifreleme**: bcryptjs (12 rounds)
✅ **Token**: JWT + Refresh Token (15m + 30d)
✅ **Rate Limiting**: 5/15m auth, 100/15m api
✅ **Account Locking**: 5 failed attempts = 2h ban
✅ **CORS Protection**: Sadece localhost:3001
✅ **Role-Based Access**: 4 tier system (viewer/editor/admin/superadmin)

---

## 🚦 Hızlı Kontrol

### 1. Backend Sağlık Kontrolü
```bash
curl http://localhost:3000
```

### 2. Frontend Erişimi
```
http://localhost:3001
```

### 3. MongoDB Bağlantı Testi
```bash
cd social-media-hub
node scripts/test-mongodb.js
```

### 4. Docker Container Durumu
```bash
docker ps
```

---

## 📦 Docker Container'ları

| Container | Image | Status | Port |
|-----------|-------|--------|------|
| ultrarslanoglu-mongodb | mongo:7.0 | 🟢 Running | 27017 |
| ultrarslanoglu-redis | redis:7-alpine | 🟢 Running | 6379 |

---

## 🛑 Gerekli İşlemler (Prodüksiyona Gitmeden Önce)

- [ ] `.env` dosyalarındaki dummy değerleri güncelle
- [ ] JWT_SECRET ve NEXTAUTH_SECRET için güçlü anahtarlar oluştur
- [ ] OAuth provider credentiallarını ekle (TikTok, Meta, YouTube, X)
- [ ] SMTP bilgilerini konfigüre et (email gönderimi için)
- [ ] MongoDB'yi production host'una taşı
- [ ] CORS_ORIGIN'i production domain'ine değiştir
- [ ] HTTPS sertifikası ekle
- [ ] Rate limiting değerlerini optimise et
- [ ] Logging ve monitoring ayarla

---

## 📞 Destek

Sorunlar için lütfen kontrol edin:
1. Backend logs: Terminal output'unda
2. Frontend logs: Browser console'da (F12)
3. Database status: `docker logs ultrarslanoglu-mongodb`
4. Redis status: `docker logs ultrarslanoglu-redis`

---

**Oluşturulma Tarihi**: 28 Aralık 2025
**Proje**: Ultrarslanoglu - Galatasaray Dijital Liderlik Portalı
**Durum**: 🟢 **Tam Operasyonel**
