# 🔐 Facebook Giriş Durumu Kontrolü - Uygulama Kılavuzu

## 📋 Genel Bakış

Bu kılavuz, Facebook SDK'nı kullanarak kullanıcının giriş durumunu kontrol etme, login/logout işlemlerini yönetme ve token'ları backend'e güvenli şekilde iletme sürecini anlatır.

---

## 🔄 Giriş Durumu Kontrol Akışı

### 1. **Sayfa Yüklendiğinde**
```javascript
FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});
```

**Olası Yanıtlar:**
- `connected` - Kullanıcı Facebook'a ve uygulamaya giriş yapmış
- `not_authorized` - Kullanıcı Facebook'a giriş yapmış ama uygulamaya değil
- `unknown` - Kullanıcı Facebook'a giriş yapmamış

### 2. **Response Yapısı**
```json
{
    "status": "connected",
    "authResponse": {
        "accessToken": "EAAB5c7...",
        "expiresIn": 5184000,
        "signedRequest": "...",
        "userID": "1234567890"
    }
}
```

---

## 🛠️ Uygulanan İşlevler

### 1. **checkLoginStatus()**
Sayfa yüklendikten sonra giriş durumunu kontrol eder.

```javascript
checkLoginStatus() → handleLoginResponse() → 3 seçenek
  ├─ handleUserConnected()      // Giriş yapmış
  ├─ handleUserNotAuthorized()  // Uygulamaya eriş yok
  └─ handleUserNotLoggedIn()    // Facebook'a giriş yok
```

### 2. **handleUserConnected()**
Kullanıcı başarıyla bağlı olduğunda:

```javascript
✅ Token'ı localStorage'a kaydet
✅ Kullanıcı bilgilerini al (FB.api)
✅ User info bölümünü göster
✅ Platform'ları göster
✅ Token'ı backend'e gönder
✅ Logout button'u göster
```

**LocalStorage'da Kaydedilen Veriler:**
```javascript
fbAccessToken  // Facebook access token
fbUserId       // Kullanıcı ID
fbLoginTime    // Login zamanı
jwtToken       // Backend tarafından verilen JWT
```

### 3. **handleLogin()**
Kullanıcı login button'a tıkladığında:

```javascript
FB.login(function(response) {
    handleLoginResponse(response);
}, { 
    scope: 'public_profile,email,instagram_basic' 
});
```

**İstenen Permissions:**
- `public_profile` - Profil bilgileri
- `email` - Email adresi
- `instagram_basic` - Instagram erişimi

### 4. **handleLogout()**
Kullanıcı logout button'a tıkladığında:

```javascript
FB.logout() → localStorage temizle → Backend'e bildir → UI sıfırla
```

### 5. **getUserInfo()**
Kullanıcının profil resmini, adını ve emailini alır:

```javascript
FB.api('/me', { fields: 'id,name,email,picture.width(50).height(50)' })
  ├─ Profil fotoğrafını göster
  ├─ Adı göster
  ├─ Email'i göster
  └─ Backend'e ilet
```

### 6. **sendTokenToBackend()**
Token'ı backend'e gönderir ve oturum oluşturur:

```javascript
POST /auth/meta/verify-token
{
    "accessToken": "EAAB5c7...",
    "userId": "1234567890",
    "userInfo": {
        "id": "1234567890",
        "name": "Kullanıcı Adı",
        "email": "user@example.com",
        "picture": { "data": { "url": "..." } }
    }
}
```

**Response:**
```json
{
    "success": true,
    "user": {
        "id": "user_123",
        "email": "user@example.com",
        "name": "Kullanıcı Adı",
        "profileImage": "https://..."
    },
    "token": "eyJhbGc...",  // JWT Token
    "connectedPlatforms": [...]
}
```

---

## 📁 Dosya Yapısı

### Frontend
- **public/index.html** - Ana sayfa (giriş durumu kontrolü ve UI)
  - Facebook SDK'nı yükle
  - Giriş durumunu kontrol et
  - Login/logout işlemlerini yönet
  - User info göster

### Backend
- **src/routes/authRoutes.js** - Authentication route'ları
  - `POST /auth/meta/verify-token` - Token doğrulama
  - `POST /auth/meta/logout` - Logout işlemi
  - `GET /auth/status` - Bağlı platformlar
  
- **src/models/User.js** - Kullanıcı modeli
- **src/models/Token.js** - Token modeli

---

## 🔒 Güvenlik Özellikleri

### 1. **Token Yönetimi**
- ✅ Token'lar localStorage'a "güvenli" şekilde kaydediliyor
- ✅ Token'lar backend'de de kaydediliyor
- ✅ JWT token kullanlıyor (session yerine tercih)
- ✅ Token geçerlilik tarihi kontrol ediliyor

### 2. **CORS & HTTPS**
- ✅ CORS başlıkları kontrol ediliyor
- ✅ Production'da HTTPS zorunlu
- ✅ Secure cookies kullanılıyor

### 3. **Session Management**
- ✅ Session yönetimi Express-session ile
- ✅ CSRF koruması
- ✅ Session timeout'u set edilmiş

### 4. **Input Validation**
- ✅ Email doğrulama
- ✅ Token format doğrulama
- ✅ User ID doğrulama

---

## 🧪 Test Etme

### 1. **Tarayıcıda Test**
```bash
1. http://localhost:3000 açıkla
2. "Facebook ile Giriş" butonuna tıkla
3. Facebook giriş sayfasında diz
4. Uygulamaya akses izni ver
5. Ana sayfaya yönlendir
```

### 2. **Browser Console'da**
```javascript
// Giriş durumunu kontrol et
FB.getLoginStatus((response) => console.log(response));

// Token'ı görmek için
localStorage.getItem('fbAccessToken');
localStorage.getItem('jwtToken');

// User bilgilerini görmek için
fetch('/auth/status').then(r => r.json()).then(console.log);
```

### 3. **Network Tab'ında**
1. DevTools açıkla (F12)
2. Network tab'ına git
3. Login işlemini gözlemle
4. `/auth/meta/verify-token` request'ini kontrol et
5. Response'ı incele

---

## 🐛 Hata Ayıklama

### Problem: "The app is not configured for web"
**Çözüm:**
1. Meta Developers Dashboard'a git
2. Uygulamayı seç
3. Ayarlar > Temel Bilgiler
4. Uygulama Türü'nü "Web" yap

### Problem: "App not set up"
**Çözüm:**
1. App ID'nin doğru olduğunu kontrol et
2. Redirect URI'yi kontrol et: `https://ultrarslanoglu.com/auth/meta/callback`
3. Facebook Login ürünü aktif olduğunu kontrol et

### Problem: Token localStorage'da kaydedilmiyor
**Çözüm:**
```javascript
// Console'a gir ve test et
localStorage.setItem('test', 'value');
localStorage.getItem('test');
// "value" dödünmesi gerekli
```

### Problem: Backend logout çalışmıyor
**Çözüm:**
```javascript
// Session destroy'u kontrol et
fetch('/auth/meta/logout', {method: 'POST'})
  .then(r => r.json())
  .then(console.log);
```

---

## 📊 Durum Akışı Diyagramı

```
┌─────────────────────────────────┐
│   Sayfa Yüklendi                │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ FB.getLoginStatus() Çağırıldı   │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────┬─────────────────┐
        ▼             ▼                 ▼
    connected    not_authorized      unknown
        │             │                 │
        ▼             ▼                 ▼
   getUserInfo() showLoginBtn()   showLoginBtn()
        │             │                 │
        ▼             ▼                 ▼
   showUserInfo() hideUserInfo()  hideUserInfo()
        │             │                 │
        ▼             │                 │
   sendToken()        │                 │
   to Backend         │                 │
        │             │                 │
        ▼             │                 │
   showPlatforms()    │                 │
        │             │                 │
        ▼             ▼                 ▼
    ┌─ User Ready ────┴─────────────────┘
    │
    └─► Platforms Visible
    └─► Logout Button Visible
```

---

## 📱 Mobil Uyumluluk

Frontend kodu tamamen responsive:
- ✅ Mobile-first tasarım
- ✅ Touch-friendly buttons
- ✅ Responsive grid layout
- ✅ Mobile SDK desteği

---

## 🚀 Sonraki Adımlar

1. **Instagram Login Entegrasyonu**
   - Instagram Business Account bağlama
   - Media yükleme

2. **Token Yenileme**
   - Access token'ı otomatik yenileme
   - Refresh token yönetimi

3. **Multi-Platform Login**
   - Diğer platform'lar ile birlikte kullanma
   - Platform birleştirme

4. **Analytics Tracking**
   - Login event'lerini track et
   - User behavior analytics

---

## 📚 Kaynaklar

- [Facebook SDK Dokümantasyonu](https://developers.facebook.com/docs/facebook-login)
- [FB.getLoginStatus Reference](https://developers.facebook.com/docs/facebook-login/web)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)

---

## 🔄 Version Bilgisi

- **Created**: 24 Aralık 2025
- **Facebook SDK Version**: v19.0
- **Node.js**: >= 18.0.0
- **Express**: >= 4.0.0

---

**🎯 Amaç**: Facebook SDK'yla güvenli ve kolay bir şekilde kullanıcı giriş işlemlerini yönetmek ve sosyal medya hesaplarını birleştirmek.
