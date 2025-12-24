# Website README
# Ultrarslanoglu Website

## 🎬 Hakkında
Ultrarslanoglu, Galatasaray'ın dijital liderlik platformu olan ultrarslanoglu-core'un web arayüzüdür. Next.js ile oluşturulmuş modern, responsive ve hızlı bir websitedir.

## 🚀 Teknolojiler
- **Next.js 14**: React framework
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety
- **React Hook Form**: Form handling
- **SWR**: Data fetching
- **Docker**: Containerization

## 📦 Kurulum

### Yerel Geliştirme
```bash
# Dependencies yükle
npm install

# Dev server'ı başlat
npm run dev

# http://localhost:3001 açılacak
```

### Production Build
```bash
# Build
npm run build

# Başlat
npm start
```

### Docker ile
```bash
# Dev ortamında
docker build -f Dockerfile.dev -t ultrarslanoglu-website-dev .
docker run -p 3001:3001 -v $(pwd):/app ultrarslanoglu-website-dev

# Production ortamında
docker build -f Dockerfile -t ultrarslanoglu-website .
docker run -p 3001:3001 ultrarslanoglu-website
```

## 📁 Yapı
```
ultrarslanoglu-website/
├── pages/              # Next.js pages ve API routes
├── components/         # React bileşenleri
├── styles/            # Global stiller
├── public/            # Statik dosyalar
├── Dockerfile         # Production image
├── Dockerfile.dev     # Development image
└── package.json
```

## 🔗 API Entegrasyonları
Website şu servislere bağlanabilir:
- MongoDB (27017)
- Tüm Python projeleri (Flask APIs)
- Social Media Hub (Node.js)

## 🧪 Test
```bash
npm run lint        # Linting
npm test           # Unit tests
npm run type-check # TypeScript check
```

## 📝 Environment Variables
- `NEXT_PUBLIC_SITE_URL`: Website URL
- `NEXT_PUBLIC_API_URL`: API endpoint
- `MONGODB_URI`: MongoDB bağlantı
- `NEXTAUTH_SECRET`: Auth secret

## 🌐 Deployment
Production'da şu adresler kullanılır:
- https://ultrarslanoglu.com (main website)
- https://api.ultrarslanoglu.com (API gateway)

---
Detaylı dokümantasyon: [dokumanlar/](../dokumanlar/)
