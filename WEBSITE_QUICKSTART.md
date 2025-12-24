# 🚀 Ultrarslanoglu Website Başlangıç Rehberi

## Sistem Gereksinimleri
- Docker Desktop (çalışır durumda)
- 4GB RAM minimum
- Windows/Linux/Mac

## Hızlı Başlangıç (5 dakika)

### Adım 1: Hosts Dosyasını Güncelle (Windows için)

Administrator olarak Notepad/VS Code açın:
```
C:\Windows\System32\drivers\etc\hosts
```

Şu satırları ekleyin:
```
127.0.0.1 ultrarslanoglu.local
127.0.0.1 www.ultrarslanoglu.local
127.0.0.1 social-media.local
127.0.0.1 api.ultrarslanoglu.local
```

### Adım 2: Docker Compose'u Başlat

```bash
cd d:\source\ultrarslanoglu-core

# Tüm servisleri başlat
docker-compose up -d

# Status'ü kontrol et
docker-compose ps
```

### Adım 3: Website'yi Aç

Tarayıcınızda açın:
- **Website**: http://localhost:3001
- **API**: http://localhost:5001 (AI Editor)
- **Social Hub**: http://localhost:3000

## 🌐 Özel Domain Adresleri

### Hosts Dosyasına Eklediyseniz
- http://ultrarslanoglu.local
- http://www.ultrarslanoglu.local
- http://api.ultrarslanoglu.local

### Nginx ile (Production Setup)
```bash
# Nginx'i ekle
docker-compose --profile production up nginx

# Bundan sonra: http://ultrarslanoglu.local (reverse proxy üzerinden)
```

## 📊 Canlı Geliştirme (Hot Reload)

Website otomatik olarak hot reload desteğine sahiptir. Dosyaları kaydettiğiniz anda:

```bash
# Tarayıcıda otomatik yenileme
http://localhost:3001
```

## 📝 Dosya Yapısı

```
ultrarslanoglu-website/
├── pages/
│   ├── index.tsx          # Ana sayfa
│   ├── _app.tsx           # App wrapper
│   ├── _document.tsx      # HTML template
│   └── api/
│       └── health.ts      # Health check
├── components/
│   └── Layout.tsx         # Sayfa layout'u
├── styles/
│   └── globals.css        # Global CSS + Tailwind
├── public/                # Statik dosyalar
├── Dockerfile             # Production build
├── Dockerfile.dev         # Development build
└── package.json           # Dependencies
```

## 🛠️ Geliştirme Komutları

```bash
# Konteynerda kodu düzenle
cd ultrarslanoglu-website
code .

# Terminal'de değişikleri görmek için
docker-compose logs -f ultrarslanoglu-website

# Build ve test
docker-compose up --build ultrarslanoglu-website

# Tüm servisleri kontrol et
docker-compose ps

# Loglar
docker-compose logs ultrarslanoglu-website
```

## 🔗 Tüm Servislere Erişim

| Servis | URL | Port | Status |
|--------|-----|------|--------|
| 🌐 Website | http://localhost:3001 | 3001 | ✅ |
| 🎬 AI Editor API | http://localhost:5001 | 5001 | ✅ |
| 📊 Analytics API | http://localhost:5002 | 5002 | ✅ |
| 🤖 Automation API | http://localhost:5003 | 5003 | ✅ |
| 🎨 Brand Kit API | http://localhost:5004 | 5004 | ✅ |
| 📅 Scheduler API | http://localhost:5005 | 5005 | ✅ |
| 📹 Pipeline API | http://localhost:5006 | 5006 | ✅ |
| 🌐 Social Media Hub | http://localhost:3000 | 3000 | ✅ |
| 📊 MongoDB | mongodb://localhost:27017 | 27017 | ✅ |
| 💾 Redis | redis://localhost:6379 | 6379 | ✅ |

## 💡 İpuçları

### Hot Reload Çalışmazsa
```bash
# Konteyner'ı yeniden başlat
docker-compose restart ultrarslanoglu-website

# veya logları kontrol et
docker-compose logs ultrarslanoglu-website
```

### Port Çakışması
```bash
# Windows'ta port kontrolü
netstat -ano | findstr :3001

# Linux/Mac'ta
lsof -i :3001

# Process'i kill et
taskkill /PID <PID> /F
```

### Node Modules Cache Sorunu
```bash
# Cache temizle
docker volume rm ultrarslanoglu-core_website_node_modules

# Yeniden build
docker-compose up --build ultrarslanoglu-website
```

## 🚀 Production Deployment

```bash
# Nginx ile production setup
docker-compose --profile production up -d

# Veya manual build
docker build -f ultrarslanoglu-website/Dockerfile -t ultrarslanoglu-website .
docker run -p 3001:3001 ultrarslanoglu-website
```

## 📚 Dokümantasyon

- [Website README](./ultrarslanoglu-website/README.md)
- [Docker Compose](./docker-compose.yml)
- [Nginx Config](./nginx.conf)
- [Main Docs](./dokumanlar/)

## ✅ Kontrol Listesi

- [ ] Docker Desktop çalışıyor
- [ ] Hosts dosyası güncellendi
- [ ] docker-compose up -d çalıştırıldı
- [ ] http://localhost:3001 açıldı
- [ ] Sayfa yüklendi
- [ ] Dosya değişikliği hot reload'ü tetikledi

## 🆘 Sorun Giderme

### Website yüklenmiyorsa
```bash
docker-compose logs ultrarslanoglu-website
curl http://localhost:3001/api/health
```

### MongoDB bağlantı hatası
```bash
docker-compose logs mongodb
# Check credentials: admin / ultrarslanoglu2025
```

### Node modules yüklenmiyorsa
```bash
# Volume temizle ve rebuild
docker-compose down -v
docker-compose up --build ultrarslanoglu-website
```

## 📞 İletişim
Sorunlar için: [GitHub Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)

---
**Happy coding! 🚀**
