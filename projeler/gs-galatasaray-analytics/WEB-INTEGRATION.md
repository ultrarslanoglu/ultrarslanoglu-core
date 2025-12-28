# 🌐 Web Entegrasyon Rehberi

Galatasaray Analytics Platform'u web sitenize entegre etme adım adım kılavuzu.

## 📋 İçindekiler

1. [Next.js Bileşen Entegrasyonu](#nextjs-bileşen-entegrasyonu)
2. [API Ayarları](#api-ayarları)
3. [Sayfa Oluşturma](#sayfa-oluşturma)
4. [Stil Özelleştirmesi](#stil-özelleştirmesi)
5. [Production Deployment](#production-deployment)

---

## Next.js Bileşen Entegrasyonu

### Adım 1: Bileşeni İçe Aktar

`pages/galatasaray.tsx` veya herhangi bir Next.js sayfasında:

```typescript
import GalatasarayDashboard from '@/components/GalatasarayDashboard';

export default function GalatasarayPage() {
  return (
    <div className="container mx-auto">
      <h1>Galatasaray Analytics</h1>
      <GalatasarayDashboard />
    </div>
  );
}
```

### Adım 2: Kütüphaneleri Yükle

```bash
npm install next react plotly react-leaflet axios
```

### Adım 3: Tailwind CSS Ayarla

`tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        galatasaray: {
          red: '#DC143C',
          gold: '#FFD700',
        }
      }
    }
  }
}
```

---

## API Ayarları

### Adım 1: Environment Variables

`.env.local`:

```bash
# Flask API adresi
NEXT_PUBLIC_GALATASARAY_API=http://localhost:5002
# Production için:
# NEXT_PUBLIC_GALATASARAY_API=https://api.galatasaray.example.com
```

### Adım 2: CORS Konfigürasyonu

Flask API'de (`main.py`):

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # Development
            "https://example.com",    # Production
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "max_age": 3600
    }
})
```

### Adım 3: Error Handling

Bileşen zaten error handling'i içeriyor:

```typescript
if (error) {
  return (
    <div className="bg-red-50 p-8 rounded-lg border-2 border-red-200">
      <h3 className="text-red-800 font-bold">Hata: {error}</h3>
      <button onClick={fetchData}>Tekrar Dene</button>
    </div>
  );
}
```

---

## Sayfa Oluşturma

### Seçenek 1: Basit Sayfa

`pages/galatasaray.tsx`:

```typescript
import GalatasarayDashboard from '@/components/GalatasarayDashboard';

export default function GalatasarayPage() {
  return (
    <main className="min-h-screen bg-white">
      <h1 className="text-4xl font-bold text-red-600 p-6">
        🟡 Galatasaray Analytics
      </h1>
      <GalatasarayDashboard />
    </main>
  );
}
```

### Seçenik 2: Layout ile

`pages/_app.tsx`:

```typescript
import type { AppProps } from 'next/app';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
```

`pages/galatasaray.tsx`:

```typescript
import GalatasarayDashboard from '@/components/GalatasarayDashboard';

GalatasarayPage.layout = 'galatasaray'; // Custom layout

export default function GalatasarayPage() {
  return <GalatasarayDashboard />;
}
```

---

## Stil Özelleştirmesi

### Renk Şeması Değiştirme

`components/GalatasarayDashboard.tsx` içinde, class names değiştir:

```typescript
// Kırmızı yerine farklı renk
className="bg-gradient-to-br from-purple-500 to-purple-600"

// Galatasaray rengini sakla
className="bg-gradient-to-br from-red-500 to-red-600"  // Orjinal
```

### Dark Mode Desteği

```typescript
import { useTheme } from 'next-themes';

const { theme } = useTheme();

return (
  <div className={theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'}>
    {/* Content */}
  </div>
);
```

### Custom Bileşen Yapısı

Bileşeni parçalara böl:

```typescript
// components/GalatasarayDashboard/index.tsx
export { default } from './Dashboard';

// components/GalatasarayDashboard/Dashboard.tsx
// Ana bileşen

// components/GalatasarayDashboard/PlayerCard.tsx
// Oyuncu kartı

// components/GalatasarayDashboard/StatsCard.tsx
// İstatistik kartı
```

---

## Production Deployment

### Azure App Service Deployment

1. **Flask API Deployment:**

```bash
# Azure CLI ile login
az login

# Kaynak grubu ve app service oluştur
az group create -n galatasaray-rg -l eastus
az appservice plan create -n galatasaray-plan -g galatasaray-rg --sku B1 --is-linux
az webapp create -n galatasaray-api -g galatasaray-rg --plan galatasaray-plan --runtime "PYTHON|3.9"

# Code deploy et
git remote add azure <your-azure-git-url>
git push azure main
```

2. **Next.js Website Deployment:**

```bash
# Vercel deployment
npm install -g vercel
vercel

# Azure Static Web Apps
az staticwebapp create -n galatasaray-web -g galatasaray-rg -s . -l eastus
```

### Environment Variables (Production)

`.env.production`:

```bash
NEXT_PUBLIC_GALATASARAY_API=https://galatasaray-api.azurewebsites.net
```

### Docker Production Setup

`docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  galatasaray-api:
    image: galatasaray-api:latest
    ports:
      - "5002:5002"
    environment:
      FLASK_ENV: production
      USE_COSMOS_DB: "true"
      COSMOS_ENDPOINT: "${COSMOS_ENDPOINT}"
      COSMOS_KEY: "${COSMOS_KEY}"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - galatasaray-api
```

---

## API Rate Limiting

Production'da rate limiting ekle:

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/players')
@limiter.limit("50 per hour")
def get_players():
    # ...
```

---

## Monitoring & Logging

### Application Insights (Azure)

```python
from opencensus.ext.flask.flask_middleware import FlaskMiddleware
from opencensus.ext.azure.trace_exporter import AzureExporter

trace_config = trace.config.Config()
trace_config.exporter = AzureExporter(
    connection_string="InstrumentationKey=..."
)

FlaskMiddleware(app, config=trace_config)
```

### Sentry Error Tracking

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()]
)
```

---

## Test Deployment

### Local Test

```bash
# Docker production ortamında test et
docker-compose -f docker-compose.prod.yml up -d

# Health check
curl http://localhost:5002/health

# API test
curl http://localhost:5002/api/players | jq
```

### Staging Environment

```bash
# Staging branchına deploy et
git checkout -b staging
git push origin staging

# Staging ortamını test et
curl https://staging.galatasaray.example.com/api/players
```

---

## Security Checklist

- [ ] HTTPS aktif (SSL/TLS)
- [ ] CORS properly configured
- [ ] API key validation
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Rate limiting active
- [ ] Logging enabled
- [ ] Monitoring configured
- [ ] Backup strategy defined

---

## Troubleshooting

### API bağlantısı başarısız

```bash
# CORS hatası?
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     http://localhost:5002/api/players

# Firewall kontrolü
telnet localhost 5002
```

### Performance sorunları

```python
# Response caching ekle
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/players')
@cache.cached(timeout=3600)
def get_players():
    # ...
```

### Database connection issues

```bash
# MongoDB connection string kontrol et
mongosh "mongodb://localhost:27017"

# Cosmos DB bağlantısı test et
az cosmosdb list -o table
```

---

## Support & Documentation

- GitHub Issues: `/issues`
- API Documentation: `/docs` (Swagger)
- Deployment Guide: `DEPLOYMENT.md`
- FAQ: `README.md#FAQ`

---

🟡 **Entegrasyon başarıyla tamamlandı!** 🟡

İlgili sorular için GitHub Issues'te iletişime geçin.
