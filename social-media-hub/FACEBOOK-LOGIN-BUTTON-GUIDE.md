# 🔘 Facebook Resmi Giriş Düğmesi (fb:login-button) - Kılavuz

## 📋 Genel Bakış

Facebook'un resmi `<fb:login-button>` bileşeni, özel CSS yazılması gerekmeden anında ve güvenli bir şekilde giriş/çıkış işlevselliği sağlar. XFBML (Facebook Markup Language) olarak adlandırılır.

---

## 🎨 HTML Bileşeni

### Temel Yapı
```html
<fb:login-button 
    scope="public_profile,email,instagram_basic"
    onlogin="checkLoginState();"
    onlogout="handleLogoutButton();">
</fb:login-button>
```

### Attribute'ler

| Attribute | Açıklama | Örnek |
|-----------|----------|-------|
| `scope` | İstenen permissions | `public_profile,email,instagram_basic` |
| `onlogin` | Login başarılı olduğunda çalışacak fonksiyon | `checkLoginState()` |
| `onlogout` | Logout gerçekleştiğinde çalışacak fonksiyon | `handleLogoutButton()` |
| `auth-type` | Authentication türü | `rerequest` / `reauthenticate` |
| `auto-logout-link` | Logout link'i göster mi? | `true` / `false` |
| `size` | Düğme boyutu | `small` / `medium` / `large` / `xlarge` |

---

## 🔄 İş Akışı

### 1. **Sayfa Yükleme**
```
Sayfa Yüklendi
    ↓
SDK Başlatılıyor
    ↓
XFBML Parse Ediliyor
    ↓
fb:login-button Render Ediliyor
    ↓
Kullanıcı "Facebook ile Giriş"'i Görebilir
```

### 2. **Giriş Düğmesine Tıklama**
```
Kullanıcı Düğmeye Tıklar
    ↓
Facebook Dialog Açılır
    ↓
Kullanıcı Facebook'ta Giriş Yapar
    ↓
Permissions Onayı Alınır
    ↓
onlogin Attribute Fonksiyonu Çağrılır
    ↓
checkLoginState() Fonksiyonu Çalışır
    ↓
FB.getLoginStatus() Çağrılır
    ↓
statusChangeCallback() Çalışır
```

### 3. **Çıkış Düğmesine Tıklama**
```
Kullanıcı Düğmeye Tıklar
    ↓
Facebook Oturumu Kapatılır
    ↓
onlogout Attribute Fonksiyonu Çağrılır
    ↓
handleLogoutButton() Fonksiyonu Çalışır
    ↓
LocalStorage Temizlenir
    ↓
UI Sıfırlanır
```

---

## 🔐 Callback Fonksiyonları

### checkLoginState() - Giriş Durumunu Kontrol Et

```javascript
/**
 * Facebook Giriş Düğmesi tarafından çağrılan callback
 * Kullanıcı giriş yaptığında veya çıktığında otomatik olarak çalışır
 */
function checkLoginState() {
    console.log('🔐 checkLoginState() çağrıldı - Giriş durumu kontrol ediliyor...');
    
    // Facebook'tan mevcut giriş durumunu al
    FB.getLoginStatus(function(response) {
        console.log('📊 FB.getLoginStatus() Response:', response);
        statusChangeCallback(response);
    });
}
```

**Ne Yapar:**
1. Giriş düğmesine tıklandığında otomatik olarak çalışır
2. `FB.getLoginStatus()` ile mevcut durumu kontrol eder
3. `statusChangeCallback()` ile sonuçları işler

---

### statusChangeCallback() - Durum Değişikliğini İşle

```javascript
/**
 * Giriş durumu değiştiğinde çağrılan callback
 * @param {Object} response - Facebook response nesnesi
 */
function statusChangeCallback(response) {
    console.log('📋 statusChangeCallback çağrıldı');
    
    if (response.status === 'connected') {
        // ✅ Kullanıcı bağlı
        handleUserConnected(response.authResponse);
    } else if (response.status === 'not_authorized') {
        // ⚠️ Uygulamaya erişim yok
        handleUserNotAuthorized();
    } else {
        // ❌ Facebook'a giriş yok
        handleUserNotLoggedIn();
    }
}
```

**Olası Durum Değerleri:**

| Status | Anlam | authResponse |
|--------|-------|--------------|
| `connected` | Bağlı | ✅ Var |
| `not_authorized` | Uygulamaya erişim yok | ❌ Yok |
| `unknown` | Facebook'a giriş yok | ❌ Yok |

---

### handleLogoutButton() - Çıkış İşlemini Yönet

```javascript
/**
 * Logout Düğmesi callback'i
 */
function handleLogoutButton() {
    console.log('🚪 Logout Düğmesi tıklandı');
    
    // LocalStorage temizle
    localStorage.removeItem('fbAccessToken');
    localStorage.removeItem('fbUserId');
    localStorage.removeItem('jwtToken');
    
    // UI sıfırla
    hideUserInfo();
    hidePlatforms();
    
    // Backend'e logout bildir
    fetch('/auth/meta/logout', {method: 'POST'})
        .then(res => res.json())
        .then(data => console.log('✅ Logout başarılı'));
}
```

**Ne Yapar:**
1. Düğmeye tıklandığında otomatik olarak çalışır
2. LocalStorage'ı temizler
3. UI'ı sıfırlar
4. Backend'e logout bildirir

---

## 📊 Response Yapısı

### Connected Response
```json
{
    "status": "connected",
    "authResponse": {
        "accessToken": "EAAB5c7zC...",
        "expiresIn": 5184000,
        "signedRequest": "...",
        "userID": "1234567890"
    }
}
```

### Not Authorized Response
```json
{
    "status": "not_authorized",
    "authResponse": null
}
```

### Unknown Response
```json
{
    "status": "unknown",
    "authResponse": null
}
```

---

## 🎯 Kullanıcı Akışı (User Journey)

### Senaryo 1: İlk Ziyaret
```
1. Kullanıcı sayfa ziyaret eder
2. SDK yükle edilir
3. fb:login-button render edilir
4. "Facebook ile Giriş" butonu gösterilir
5. Kullanıcı butona tıklar
6. Facebook dialog açılır
7. Kullanıcı giriş yapar
8. Permissions verilir
9. onlogin callback çalışır
10. User info gösterilir
11. Platformlar gösterilir
```

### Senaryo 2: Zaten Giriş Yapmış
```
1. Kullanıcı sayfa ziyaret eder
2. SDK yüklenirken mevcut session kontrol edilir
3. Session bulunursa otomatik giriş yapılır
4. User info gösterilir
5. Platformlar gösterilir
6. Çıkış butonu gösterilir
```

### Senaryo 3: Çıkış Yapma
```
1. Kullanıcı çıkış butonuna tıklar
2. Facebook oturumu kapatılır
3. onlogout callback çalışır
4. LocalStorage temizlenir
5. "Facebook ile Giriş" butonu tekrar gösterilir
```

---

## 🔒 Güvenlik Özellikleri

### XFBML Avantajları
- ✅ Facebook tarafından resmi olarak desteklenir
- ✅ Tüm güvenlik özellikleri entegre edilmiştir
- ✅ Otomatik CSRF koruması
- ✅ Session management otomatik
- ✅ Token refresh otomatik

### Best Practices
- ✅ Sensitive bilgileri localStorage'da şifrele
- ✅ JWT token'ı httpOnly cookie'de sakla
- ✅ Backend'de token doğrula
- ✅ HTTPS'te çalıştır
- ✅ Scopes'ı minimum tutun

---

## 🧪 Console Çıktısı

Login yapıldığında console'da şunları görürsünüz:

```javascript
📄 Facebook Giriş Script'i yüklendi
✅ Sayfa tam yüklendi
🚀 Facebook SDK'sı başlatılıyor...
✅ Facebook SDK başlatıldı
🔄 FB.getLoginStatus() çağrılıyor...
🔐 checkLoginState() çağrıldı - Giriş durumu kontrol ediliyor...
📊 FB.getLoginStatus() Response: {...}
📋 statusChangeCallback çağrıldı
✅ handleUserConnected çağrıldı
📱 Access Token: EAAB5c7zC...
👤 User ID: 1234567890
⏰ Expires In: 5184000 saniye
📥 Kullanıcı bilgileri alınıyor...
👤 Kullanıcı Bilgileri Alındı: {...}
📤 Token backend'e gönderiliyor...
✅ Token backend'e başarıyla gönderildi
🔐 JWT Token kaydedildi
```

---

## ⚙️ Konfigürasyon

### SDK Başlatma
```javascript
FB.init({
    appId      : '1044312946830625',
    cookie     : true,          // Session cookie'si aktif
    xfbml      : true,          // XFBML bileşenleri işle
    version    : 'v19.0'        // SDK versiyonu
});
```

### Button Özellikleri
```html
<fb:login-button 
    scope="public_profile,email,instagram_basic"  <!-- Permissions -->
    onlogin="checkLoginState();"                   <!-- Login callback -->
    onlogout="handleLogoutButton();"               <!-- Logout callback -->
    size="medium"                                   <!-- Düğme boyutu -->
    auto-logout-link="false">                      <!-- Logout link göster mi -->
</fb:login-button>
```

---

## 🛠️ Troubleshooting

### Sorun: Düğme Gösterilmiyor
```javascript
// Çözüm: XFBML'i yeniden parse et
FB.XFBML.parse();

// veya sayfa yüklendikten sonra bekle
setTimeout(() => {
    FB.XFBML.parse();
}, 1000);
```

### Sorun: Callback Çalışmıyor
```javascript
// Emin ol ki callback fonksiyonu global scope'ta
window.checkLoginState = function() {
    // Bu çalışacak
};

// Veya HTML'de tam yolu belirt
onlogin="window.checkLoginState();"
```

### Sorun: Token Gösterilmiyor
```javascript
// localStorage yerine server-side session kullan
// veya HTTPS'te çalıştır

// Check: localStorage.getItem('fbAccessToken')
```

---

## 📚 Örnek Implementasyon

```html
<!DOCTYPE html>
<html>
<head>
    <title>Facebook Login Example</title>
</head>
<body>
    <div id="fb-root"></div>
    
    <!-- Facebook Giriş Düğmesi -->
    <fb:login-button 
        scope="public_profile,email"
        onlogin="checkLoginState();"
        onlogout="handleLogoutButton();">
    </fb:login-button>
    
    <!-- Kullanıcı Bilgileri -->
    <div id="userInfo" style="display:none;">
        <img id="userPic">
        <p id="userName"></p>
        <p id="userEmail"></p>
    </div>
    
    <script async defer crossorigin="anonymous" 
        src="https://connect.facebook.net/tr_TR/sdk.js#xfbml=1&version=v19.0&appId=YOUR_APP_ID">
    </script>
    
    <script>
        window.fbAsyncInit = function() {
            FB.init({
                appId: 'YOUR_APP_ID',
                cookie: true,
                xfbml: true,
                version: 'v19.0'
            });
        };
        
        function checkLoginState() {
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    // Kullanıcı bağlı
                    FB.api('/me', {fields: 'id,name,email,picture'}, function(user) {
                        document.getElementById('userName').textContent = user.name;
                        document.getElementById('userEmail').textContent = user.email;
                        document.getElementById('userPic').src = user.picture.data.url;
                        document.getElementById('userInfo').style.display = 'block';
                    });
                }
            });
        }
        
        function handleLogoutButton() {
            document.getElementById('userInfo').style.display = 'none';
        }
    </script>
</body>
</html>
```

---

## 🎯 Önemli Noktalar

1. **Otomatik Yönetim**: fb:login-button giriş/çıkış durumunu otomatik olarak yönetir
2. **Callback Fonksiyonları**: onlogin/onlogout attribute'leri callback belirtir
3. **XFBML Parsing**: SDK XFBML bileşenlerini otomatik olarak render eder
4. **Session Handling**: Cookie-based session otomatik yönetilir
5. **Global Scope**: Callback fonksiyonları window scope'ta olmalı

---

**🎯 Sonuç**: Facebook'un resmi `<fb:login-button>` bileşeni, karmaşık giriş işlemlerini basitleştirir ve güvenlik sağlar!
