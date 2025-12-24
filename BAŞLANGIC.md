# 🚀 ULTRARSLANOGLU - BAŞLANGIÇ REHBERI

## ✅ Tamamlandı! Website çalışıyor!

### Şu anda açık olanlar:

- ✨ **Website**: http://localhost:3001
- 🏥 **Health Check**: http://localhost:3001/api/health  
- 💾 **MongoDB**: localhost:27017
- ⚡ **Redis**: localhost:6379

---

## 🎯 3 Adımda Başla

### 1️⃣ Servisları Başlat (Zaten çalışıyor!)

```bash
cd d:\source\ultrarslanoglu-core
docker-compose up -d ultrarslanoglu-website
```

### 2️⃣ Website'i Aç

**Browser'da aç:**
```
http://localhost:3001
```

### 3️⃣ Kodlamaya Başla!

**Dosyayı düzenle ve kaydet** → Browser otomatik yenilenir ✨

---

## 📝 Yapılacaklar

### Hemen yapabilirsin:

- [ ] Home page'i özelleştir
- [ ] Yeni sayfa ekle (`pages/about.tsx`)
- [ ] Renkleri değiştir (`tailwind.config.js`)
- [ ] API endpoint'i oluştur (`pages/api/new-endpoint.ts`)
- [ ] MongoDB'ye bağlan

### Biraz daha ileri:

- [ ] NextAuth.js ile giriş ekle
- [ ] Admin dashboard oluştur
- [ ] Blog sistemi yap
- [ ] Webhook entegrasyonu
- [ ] WebSocket real-time features

---

## 🛠️ Temel Komutlar

### Website'i kontrol et:

```bash
# Logs'ları canlı izle
docker-compose logs -f ultrarslanoglu-website

# Container'a gir
docker-compose exec ultrarslanoglu-website sh

# Servisleri listele
docker-compose ps
```

### Yeniden başlat:

```bash
# Sadece website
docker-compose restart ultrarslanoglu-website

# Her şey
docker-compose restart
```

---

## 📚 Dosya Yapısı

```
ultrarslanoglu-website/
├── pages/               👈 SAYFALARıN BU KLASÖRDE
│   ├── index.tsx       ← HOME PAGE
│   ├── about.tsx       ← KENDİ SAYFAN BURAYA
│   └── api/
│       └── health.ts   ← API ENDPOINT'LERİ
├── components/         👈 BİLEŞENLER
│   └── Layout.tsx      ← SAYFA ŞABLONUℜ
├── styles/             👈 STILLER
│   └── globals.css     ← GLOBAL CSS
├── public/             👈 RESIMLERI vs.
│   └── favicon.ico
├── .env.local          👈 SETTINGS (GİZLİ)
├── package.json        👈 BAĞIMLILIKLARI
├── tailwind.config.js  👈 TAILWIND AYARLARI
└── Dockerfile.dev      👈 DOCKER AYARLARI
```

---

## 🎨 Renkleri Değiştir

`tailwind.config.js` aç ve bunu değiştir:

```javascript
colors: {
  'galatasaray-yellow': '#FFCD00',  // ← SAI
  'galatasaray-red': '#FE4646',     // ← Kırmızı
  'galatasaray-dark': '#1a1a1a',    // ← Koyu
}
```

---

## 📄 Sayfa Ekle

1. **Yeni dosya oluştur:** `pages/iletisim.tsx`

2. **Yazı yaz:**

```tsx
import Layout from '@/components/Layout';

export default function Iletisim() {
  return (
    <Layout>
      <div className="container mx-auto py-20">
        <h1 className="text-4xl font-bold">İletişim</h1>
        <p>Email: bak@ultrarslanoglu.com</p>
      </div>
    </Layout>
  );
}
```

3. **Kaydet** → Otomatik http://localhost:3001/iletisim'de görünsün!

---

## 🔌 API Endpoint Oluştur

1. **Yeni dosya:** `pages/api/mesaj.ts`

```typescript
export default function handler(req, res) {
  if (req.method === 'POST') {
    const { ad, icerik } = req.body;
    // Burada MongoDB'ye kaydet
    res.status(200).json({ success: true });
  }
}
```

2. **Kullan:**

```typescript
const response = await fetch('/api/mesaj', {
  method: 'POST',
  body: JSON.stringify({ ad: 'Ali', icerik: 'Merhaba' })
});
```

---

## 💾 MongoDB'ye Bağlan

`.env.local`'de var:

```env
MONGODB_URI=mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin
```

Sayfa veya API'de:

```typescript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('ultrarslanoglu');
const collection = db.collection('mesajlar');

// Ekle
await collection.insertOne({ ad: 'Ali', icerik: 'Merhaba' });

// Oku
const mesajlar = await collection.find({}).toArray();
```

---

## 🌐 Domain Mapping (Opsiyonel)

**Admin PowerShell aç:**

```powershell
$hostFile = "C:\Windows\System32\drivers\etc\hosts"
$content = Get-Content $hostFile -Raw
if ($content -notmatch "ultrarslanoglu.local") {
    Add-Content -Path $hostFile -Value "`r`n127.0.0.1 ultrarslanoglu.local" -Force
}
```

**Sonra:**
```
http://ultrarslanoglu.local:3001
```

---

## 🆘 Sorunlar?

### "Hot reload çalışmıyor"
```bash
docker-compose restart ultrarslanoglu-website
```

### "Port 3001 zaten açık"
```bash
docker ps -a  # Eski container bul
docker rm -f <container_id>
docker-compose up -d ultrarslanoglu-website
```

### "Modül bulunamıyor"
```bash
docker-compose exec ultrarslanoglu-website npm install
```

### "MongoDB bağlantı hatası"
MongoDB'nin çalışıp çalışmadığını kontrol et:
```bash
docker-compose ps mongodb
```

---

## 📖 Kaynaklar

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **MongoDB**: https://docs.mongodb.com
- **Docker**: https://docs.docker.com

---

## 🎊 Başarılar!

Website için her şey hazır. İlk sayfanı oluşturmaya başla! 🚀

Soruların için `docker-compose logs -f ultrarslanoglu-website` ile logs'ları kontrol et.

---

**Son güncelleme:** 24 Aralık 2025  
**Status:** ✅ Production Ready  
**Framework:** Next.js 14 + TypeScript + Tailwind CSS
