# Deployment Guide

Bu döküman, Ultrarslanoglu Social Media Hub'ın production ortamına deploy edilmesi için gereken adımları içerir.

## 🎯 Deployment Seçenekleri

### 1. VPS / Dedicated Server (Önerilen)
### 2. Docker Container
### 3. Cloud Platforms (AWS, Azure, Google Cloud)
### 4. Serverless (Lambda + API Gateway)

---

## 🚀 VPS Deployment (Ubuntu 22.04)

### Adım 1: Sunucu Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Node.js kurulumu (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MongoDB kurulumu
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# MongoDB'yi başlat
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx kurulumu
sudo apt install -y nginx

# PM2 kurulumu (process manager)
sudo npm install -g pm2

# Git kurulumu
sudo apt install -y git
```

### Adım 2: Proje Klonlama

```bash
# Deployment dizini oluştur
sudo mkdir -p /var/www
cd /var/www

# Repository'yi klonla
sudo git clone https://github.com/ultrarslanoglu/ultrarslanoglu-core.git
cd ultrarslanoglu-core/social-media-hub

# Dosya izinlerini ayarla
sudo chown -R $USER:$USER /var/www/ultrarslanoglu-core
```

### Adım 3: Environment Konfigürasyonu

```bash
# .env dosyası oluştur
cp .env.example .env
nano .env
```

Production `.env` ayarları:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://ultrarslanoglu.com

MONGODB_URI=mongodb://localhost:27017/ultrarslanoglu_social
REDIS_URL=redis://localhost:6379

SESSION_SECRET=GÜÇLÜ-BİR-SECRET-KEY-BURAYA
JWT_SECRET=GÜÇLÜ-BİR-JWT-SECRET-BURAYA

# Platform credentials
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
# ... diğer platform credentials
```

### Adım 4: Bağımlılıkları Yükle

```bash
npm install --production
```

### Adım 5: PM2 ile Başlat

```bash
# Uygulamayı başlat
pm2 start src/app.js --name social-media-hub

# Startup script oluştur (reboot sonrası otomatik başlat)
pm2 startup systemd
# Çıkan komutu çalıştır

# Mevcut konfigürasyonu kaydet
pm2 save

# Status kontrol
pm2 status
pm2 logs social-media-hub
```

### Adım 6: Nginx Reverse Proxy Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/ultrarslanoglu.com
```

Nginx konfig:

```nginx
server {
    listen 80;
    server_name ultrarslanoglu.com www.ultrarslanoglu.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ultrarslanoglu.com www.ultrarslanoglu.com;

    # SSL sertifikaları (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/ultrarslanoglu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ultrarslanoglu.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location /public {
        alias /var/www/ultrarslanoglu-core/social-media-hub/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /.well-known {
        alias /var/www/ultrarslanoglu-core/social-media-hub/public/.well-known;
    }

    # Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Upload size limit
    client_max_body_size 500M;
}
```

Konfigürasyonu aktifleştir:

```bash
# Symlink oluştur
sudo ln -s /etc/nginx/sites-available/ultrarslanoglu.com /etc/nginx/sites-enabled/

# Test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### Adım 7: SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# Sertifika al
sudo certbot --nginx -d ultrarslanoglu.com -d www.ultrarslanoglu.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### Adım 8: Firewall Ayarları

```bash
# UFW kur ve aktifleştir
sudo apt install -y ufw

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Status kontrol
sudo ufw status
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/ultrarslanoglu_social
    depends_on:
      - mongodb
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  mongodb:
    image: mongo:6
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongodb_data:
```

Başlatma:

```bash
docker-compose up -d
```

---

## ☁️ AWS Deployment

### EC2 + RDS MongoDB

1. EC2 instance oluştur (Ubuntu 22.04)
2. RDS MongoDB Atlas veya DocumentDB kullan
3. S3 bucket oluştur (video storage için)
4. CloudFront CDN ayarla
5. Route 53 ile DNS yapılandır
6. VPS deployment adımlarını takip et

### Elastic Beanstalk

```bash
# EB CLI kur
pip install awsebcli

# Uygulama başlat
eb init -p node.js-18 social-media-hub

# Environment oluştur
eb create production-env

# Deploy
eb deploy
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Logs
pm2 logs social-media-hub
pm2 logs social-media-hub --lines 100

# Restart
pm2 restart social-media-hub

# Memory/CPU usage
pm2 show social-media-hub
```

### Log Rotation

```bash
# PM2 log rotation modülü
pm2 install pm2-logrotate

# Ayarlar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Database Backup

```bash
#!/bin/bash
# backup.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/mongodb"

mkdir -p $BACKUP_DIR

mongodump --db ultrarslanoglu_social --out $BACKUP_DIR/$TIMESTAMP

# 7 günden eski backupları sil
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Cron job ekle:

```bash
crontab -e

# Her gün 02:00'de backup al
0 2 * * * /path/to/backup.sh
```

### Health Check

```bash
# Otomatik health check script
#!/bin/bash
# healthcheck.sh

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)

if [ $RESPONSE -ne 200 ]; then
    echo "App unhealthy, restarting..."
    pm2 restart social-media-hub
    
    # Slack/Email notification gönder
    curl -X POST -H 'Content-type: application/json' \
         --data '{"text":"Social Media Hub restarted!"}' \
         YOUR_SLACK_WEBHOOK_URL
fi
```

Cron job:

```bash
# Her 5 dakikada health check
*/5 * * * * /path/to/healthcheck.sh
```

---

## 🔒 Security Checklist

- [ ] `.env` dosyası güvenli ve git'te yok
- [ ] HTTPS/SSL aktif
- [ ] Firewall kuralları ayarlı
- [ ] MongoDB authentication aktif
- [ ] Rate limiting ayarlı
- [ ] CORS doğru yapılandırılmış
- [ ] Security headers (Helmet.js) aktif
- [ ] Regular security updates
- [ ] Backup stratejisi uygulanıyor
- [ ] Monitoring ve alerting aktif

---

## 🚨 Troubleshooting

### Uygulama başlamıyor

```bash
# Logları kontrol et
pm2 logs social-media-hub --err

# Port kullanımda mı?
sudo lsof -i :3000

# MongoDB çalışıyor mu?
sudo systemctl status mongod
```

### High Memory Usage

```bash
# Memory kullanımını kontrol et
pm2 show social-media-hub

# Node.js memory limit artır
pm2 delete social-media-hub
pm2 start src/app.js --name social-media-hub --max-memory-restart 1G
pm2 save
```

### Upload Issues

```bash
# Disk alanı kontrolü
df -h

# Uploads klasörü izinleri
sudo chmod 755 uploads/
sudo chown -R $USER:$USER uploads/
```

---

## 📞 Support

Sorun yaşarsanız:
- GitHub Issues: [Create issue](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)
- Email: support@ultrarslanoglu.com
