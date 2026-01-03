# 🤖 Otomasyon Araçları

## 📋 Genel Bakış
Bu klasör, Galatasaray dijital ekosistemindeki rutin görevleri otomatikleştiren araçları ve betikleri barındırır. **gs-automation-tools** projesinin temel kaynak kod modüllerini içerir.

## 🎯 Amaç
- Sosyal medya içerik yayınlama süreçlerini otomatikleştirme
- Veri toplama ve işleme görevlerini zamanlamaya alma
- Platform API'leri ile entegrasyon yönetimi
- Rutin analiz ve raporlama işlemlerini otomatikleştirme
- İçerik moderasyonu ve takip görevlerini yönetme

## 🏗️ Yapı
```
otomasyon/
├── README.md                 # Bu dosya
├── social_media/            # Sosyal medya otomasyonu
│   ├── instagram_bot.py     # Instagram otomasyon
│   ├── tiktok_scheduler.py  # TikTok zamanlayıcı
│   ├── youtube_uploader.py  # YouTube yükleme
│   └── facebook_poster.py   # Facebook paylaşım
├── data_collection/         # Veri toplama
│   ├── scraper.py          # Web scraping
│   ├── api_fetcher.py      # API veri toplama
│   └── sentiment_analyzer.py # Duygu analizi
├── scheduling/              # Zamanlama
│   ├── cron_jobs.py        # Zamanlanmış görevler
│   ├── task_queue.py       # Görev kuyruğu
│   └── worker_pool.py      # İşçi havuzu
└── utils/                   # Yardımcı araçlar
    ├── rate_limiter.py     # Hız sınırlayıcı
    ├── retry_handler.py    # Yeniden deneme
    └── notification.py     # Bildirimler
```

## 🚀 Kullanım Senaryoları

### 1. İçerik Zamanlama
```python
from otomasyon.scheduling import ContentScheduler

scheduler = ContentScheduler()
scheduler.schedule_post(
    platform="instagram",
    content=video_path,
    caption="Matchday highlights!",
    publish_time="2025-01-20 19:00:00"
)
```

### 2. Veri Toplama
```python
from otomasyon.data_collection import SocialScraper

scraper = SocialScraper()
mentions = scraper.get_brand_mentions(
    keywords=["Galatasaray", "#GS", "#UltraAslan"],
    platforms=["twitter", "instagram"],
    limit=1000
)
```

### 3. Toplu Paylaşım
```python
from otomasyon.social_media import MultiPlatformPoster

poster = MultiPlatformPoster()
poster.post_to_all(
    content=video_file,
    caption={"instagram": "...", "tiktok": "...", "youtube": "..."},
    platforms=["instagram", "tiktok", "youtube"]
)
```

## 🔧 Özellikler

### ✅ Mevcut Özellikler
- Sosyal medya API entegrasyonları (Instagram, TikTok, YouTube, Facebook)
- Zamanlanmış görev yönetimi (Celery + Redis)
- Veri toplama ve scraping araçları
- Rate limiting ve hata yönetimi
- Webhook entegrasyonları

### 🔜 Gelecek Özellikler
- AI destekli otomasyon kararları
- Akıllı içerik optimizasyonu
- Otomatik yanıt sistemleri
- Performans takibi ve uyarılar
- A/B test otomasyonu

## 📦 Bağımlılıklar
- **Celery**: Asenkron görev kuyruğu
- **Redis**: Task broker ve cache
- **APScheduler**: Zamanlama
- **Instagrapi**: Instagram API
- **Tweepy**: Twitter API
- **Google API Client**: YouTube API
- **Selenium**: Web otomasyon
- **BeautifulSoup4**: Web scraping

## 🔐 Güvenlik
- API anahtarları `.env` dosyasında saklanır
- Rate limiting ile API limitlerini koruma
- Proxy kullanımı ile IP engelleme önleme
- Session yönetimi ve token rotation
- Güvenli webhook doğrulaması

## 📊 Performans
- Paralel işlem desteği (multi-threading)
- Task queue ile yük dağıtımı
- Önbellekleme stratejileri
- Veritabanı optimizasyonları
- Hata toleransı ve retry mekanizmaları

## 🧪 Test
```bash
# Tüm testleri çalıştır
pytest kaynak/otomasyon/tests/

# Belirli bir modülü test et
pytest kaynak/otomasyon/tests/test_social_media.py

# Coverage raporu
pytest --cov=kaynak/otomasyon
```

## 📝 Dokümantasyon
Detaylı API dokümantasyonu için `../dokumanlar/teknik/otomasyon.md` dosyasına bakın.

## 🤝 Katkı
Yeni otomasyon araçları eklemek için:
1. İlgili klasörde modül oluştur
2. Unit testler ekle
3. Dokümantasyonu güncelle
4. Pull request aç

## 📞 İletişim
Sorularınız için: [GitHub Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)