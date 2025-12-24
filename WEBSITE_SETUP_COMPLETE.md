# 🎉 Ultrarslanoglu Website Setup - TAMAMLANDI

Website başarıyla oluşturuldu ve **Docker'da çalışıyor**! 🚀

## ✅ Şu anda çalışan:

### Website Servisleri

| Servis | URL | Durum | Port |
|--------|-----|-------|------|
| **Ultrarslanoglu Website** | http://localhost:3001 | ✅ ÇALIŞIYOR | 3001 |
| **API Health Check** | http://localhost:3001/api/health | ✅ SAĞLAM | 3001 |
| **MongoDB** | mongodb://localhost:27017 | ✅ ÇALIŞIYOR | 27017 |
| **Redis** | redis://localhost:6379 | ✅ ÇALIŞIYOR | 6379 |

### Next.js Features (Aktif)

- ✅ Hot reload (dosya değişimi = otomatik tarayıcı yenileme)
- ✅ TypeScript type-safety
- ✅ Tailwind CSS branding (Galatasaray renkleri)
- ✅ API routes (/api/health)
- ✅ React components (Layout, Pages)
- ✅ Health checks

---

## 🌐 Domain Mapping Kurulumu (Opsiyonel)

### Windows'da ultrarslanoglu.local kullanmak istersen:

**Admin olarak PowerShell aç ve şunu çalıştır:**

```powershell
$hostFile = "C:\Windows\System32\drivers\etc\hosts"
$entries = @(
    "127.0.0.1 ultrarslanoglu.local",
    "127.0.0.1 www.ultrarslanoglu.local",
    "127.0.0.1 api.local",
    "127.0.0.1 api.ultrarslanoglu.local"
)
$content = Get-Content $hostFile -Raw
$newContent = $content
foreach ($entry in $entries) {
    if ($content -notmatch [regex]::Escape($entry)) {
        $newContent += "`r`n$entry"
    }
}
Set-Content -Path $hostFile -Value $newContent -Force
Write-Host "✓ Hosts file updated!"
```

**VEYA manuel yöntemi kullan:**
1. Notepad'i Admin olarak aç
2. File → Open → `C:\Windows\System32\drivers\etc\hosts`
3. Dosyanın sonuna ekle:
```
127.0.0.1 ultrarslanoglu.local
127.0.0.1 www.ultrarslanoglu.local
127.0.0.1 api.local
127.0.0.1 api.ultrarslanoglu.local
```
4. Kaydet

**Sonra test et:**
```
http://ultrarslanoglu.local:3001
```

---

## 🛠️ Canlı Geliştirme (Hot Reload)

### Nasıl çalışır?

1. **VSCode'da dosya düzenle** (örnek: `ultrarslanoglu-website/pages/index.tsx`)
2. **Kaydet** (Ctrl+S)
3. **Browser otomatik yenilenir** - yeni kod anında görünsün

### Dosya yapısı:

```
ultrarslanoglu-website/
├── pages/              # React sayfaları
│   ├── index.tsx      # HOME PAGE
│   ├── _app.tsx
│   ├── _document.tsx
│   └── api/
│       └── health.ts  # API endpoint
├── components/        # React bileşenleri
│   └── Layout.tsx     # Sayfa şablonu
├── styles/           # CSS
│   └── globals.css   # Global stiller
├── public/           # Statik dosyalar
├── package.json      # Bağımlılıklar
├── tsconfig.json     # TypeScript
├── next.config.js    # Next.js config
└── Dockerfile.dev    # Development image
```

---

## 📝 Docker Komutları

### Website'i görüntüle:

```bash
cd d:\source\ultrarslanoglu-core

# Logs'ları canlı izle
docker-compose logs -f ultrarslanoglu-website

# Servisleri listele
docker-compose ps

# Container'a gir (debug)
docker-compose exec ultrarslanoglu-website sh
```

### Yeniden başlat:

```bash
# Sadece website
docker-compose restart ultrarslanoglu-website

# Tüm servisler
docker-compose restart
```

---

## 🎨 Özelleştirme Rehberi

### Renkleri değiştir (Galatasaray → Senin brand'ın)

`ultrarslanoglu-website/tailwind.config.js` aç:

```javascript
theme: {
  colors: {
    'galatasaray-yellow': '#FFCD00',  // ← Bunu değiştir
    'galatasaray-red': '#FE4646',     // ← Bunu değiştir
    'galatasaray-dark': '#1a1a1a',    // ← Bunu değiştir
  }
}
```

### Logo/Favicon ekle

1. Logo PNG'ini `public/` klasörüne koy
2. `pages/_document.tsx`'de favicon link'ini güncelle:

```tsx
<link rel="icon" href="/your-logo.png" />
```

### Sayfalar ekle

1. `pages/` klasöründe yeni dosya oluştur: `pages/about.tsx`
2. Bir React component yaz
3. Hot reload otomatik yüklenir!

Örnek:
```tsx
// pages/about.tsx
import Layout from '@/components/Layout';

export default function About() {
  return (
    <Layout>
      <div className="container mx-auto py-20">
        <h1 className="text-4xl font-bold mb-4">Hakkında</h1>
        <p>İçerik buraya...</p>
      </div>
    </Layout>
  );
}
```

---

## 🔌 API Entegrasyonu

### Backend servislerine bağlan

`.env.local`'de API URL'ini ayarla:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Sonra kullan:

```typescript
// Sayfa veya component'te
const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/endpoint');
```

### Available APIs

- 🤖 AI Editor: http://localhost:5001
- 📊 Analytics: http://localhost:5002
- ⚙️ Automation: http://localhost:5003
- 🎨 Brand Kit: http://localhost:5004
- 📅 Scheduler: http://localhost:5005
- 📹 Video Pipeline: http://localhost:5006
- 📱 Social Media Hub: http://localhost:3000

---

## 🚀 Production Deploy (İleri)

### Production image oluştur:

```bash
# Sadece website build'le
docker build -f ultrarslanoglu-website/Dockerfile -t ultrarslanoglu-website:prod ./ultrarslanoglu-website

# Çalıştır
docker run -p 3001:3001 ultrarslanoglu-website:prod
```

### Nginx Reverse Proxy (Opsiyonel)

```bash
# Production profili ile başlat
docker-compose --profile production up -d

# Nginx' proxy ettiği servisler:
# - ultrarslanoglu.local → website (3001)
# - api.local → API services (load balanced 5001-5006)
# - social-media.local → social hub (3000)
```

---

## 📊 Kontrolistan

Aşağıdaki maddeleri kontrol et:

- [ ] Website http://localhost:3001 açılıyor
- [ ] Health check sağlıklı: http://localhost:3001/api/health
- [ ] Hot reload çalışıyor (dosya düzenle → tarayıcı yenilenir)
- [ ] Docker logs temiz (hata yok)
- [ ] Hosts dosyası güncellenmiş (opsiyonel)
- [ ] Domain localhost:3001 yerine ultrarslanoglu.local:3001'de çalışıyor

---

## 🆘 Sorun Giderme

### Sorun: "Port 3001 zaten kullanılıyor"

```bash
# Eski container'ı bul ve kaldır
docker ps -a | findstr "3001"
docker stop <container_id>
docker rm <container_id>

# Yeniden başlat
docker-compose up -d ultrarslanoglu-website
```

### Sorun: "Hot reload çalışmıyor"

1. Container'ı restart et:
```bash
docker-compose restart ultrarslanoglu-website
```

2. Tarayıcı cache'ini temizle: `Ctrl+Shift+Delete`

3. Dosya değişimini tekrar yap

### Sorun: "Hosts dosyası güncellenemiyor"

Admin hakları gerekli. PowerShell'i sağ-tıkla → "Run as administrator"

### Sorun: "TypeError: Cannot find module"

```bash
# Container içinde npm install'ı tekrar çalıştır
docker-compose exec ultrarslanoglu-website npm install
```

---

## 📚 Daha Fazla Bilgi

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **React**: https://react.dev
- **Docker Compose**: https://docs.docker.com/compose/

---

## ✨ Sonraki Adımlar

1. **Daha fazla sayfa ekle** → `pages/` klasöründe yeni `.tsx` dosyaları
2. **Database'e bağlan** → MongoDB URI'ni `.env.local`'de ayarla
3. **Kendi API'nı oluştur** → `pages/api/` klasöründe yeni endpoint'ler
4. **Production build et** → `docker build` ile Dockerfile kullan
5. **Kubernetes'e deploy et** → docker images'ı container registry'ye push et

---

## 🎊 Tebrikler!

Website **üretim hazırlığı** tamamlandı. Şimdi kodlamaya başlayabilirsin! 🚀

**Soruların varsa veya yardıma ihtiyacın olursa GitHub Issues'ı kullan.**

---

**Oluşturma tarihi:** 24 Aralık 2025  
**Framework:** Next.js 14 + React 18 + TypeScript  
**Styling:** Tailwind CSS  
**Runtime:** Node.js 18 (Alpine Linux)  
**Status:** ✅ Ready for Development
