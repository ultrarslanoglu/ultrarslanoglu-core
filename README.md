# Ultrarslanoglu-Core

**Galatasaray Dijital Liderlik Projesi**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/ultrarslanoglu/ultrarslanoglu-core)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](docker-compose.new.yml)

## ⚡ Hızlı Başlangıç

```bash
# Tüm sistemi başlat
docker-compose -f docker-compose.new.yml up -d

# Health check
curl http://localhost:5000/health

# Detaylı başlangıç için
# Bkz: QUICKSTART-V2.md
```

## 🎯 Versiyon 2.0 - Yenilikler

✨ **API Gateway Architecture** - 7 mikroservis → 1 unified API  
📉 **%70 Dosya Azaltma** - 190+ dosya → ~60 dosya  
🚀 **Tek Docker Image** - Kolay deployment ve scaling  
🔧 **Modüler Yapı** - 6 entegre modül (video, AI, analytics, vb.)  
🔐 **JWT Authentication** - Enterprise-grade güvenlik  

[Migration Detayları →](MIGRATION-COMPLETE.md) | [Mimari →](ARCHITECTURE-V2.md)

## 1. Vizyon

Ultrarslanoglu-Core, Galatasaray'ı dünyanın en büyük futbol kulübü haline getirmek için dijital, teknik ve kültürel liderlik vizyonunu hayata geçiren bir platformdur. Bu vizyon, dijital taraftar gücünü mobilize ederek küresel bir marka etkisi yaratmayı, oyuncu iletişimi yoluyla takım ruhunu güçlendirmeyi ve ileri teknoloji entegrasyonları ile futbol deneyimini yeniden tanımlamayı hedefler. Taraftarların tutkusuyla beslenen bu vizyon, Galatasaray'ı sadece bir kulüp olmaktan çıkarıp, dijital çağın lider bir simgesi haline getirecek; global izleyicilere ilham veren, teknolojiyle desteklenen ve sürdürülebilir büyüme odaklı bir ekosistem kuracaktır.

## 🔐 Güvenlik ve Kimlik Doğrulama

Bu proje **profesyonel bir kimlik doğrulama sistemi** ile donatılmıştır:

- ✅ **JWT Token Authentication** - Güvenli ve stateless kimlik doğrulama
- ✅ **Rol Bazlı Yetkilendirme** - Viewer, Editor, Admin, Superadmin rolleri
- ✅ **NextAuth.js Entegrasyonu** - Modern frontend authentication
- ✅ **Şifre Güvenliği** - Bcrypt ile hash, güçlü şifre politikası
- ✅ **Email Doğrulama** - Hesap güvenliği için email verification
- ✅ **Şifre Sıfırlama** - Güvenli password reset akışı
- ✅ **Rate Limiting** - Brute force saldırı koruması
- ✅ **Session Yönetimi** - Güvenli oturum takibi

**Detaylı kurulum için:** [AUTH_SETUP.md](AUTH_SETUP.md)

## 2. Misyon

Ultrarslanoglu markası, Galatasaray taraftarlarını bir araya getiren, oyuncularla doğrudan iletişim kurabilen, kulüp yönetimiyle köprü görevi gören, yenilikçi dijital projeler geliştiren ve küresel Galatasaray kültürünü büyüten bir dijital lider olarak konumlanmaktadır. Bu misyon, tutkuyu teknolojiyle birleştirerek taraftar deneyimini zenginleştirmek, kulübün dijital varlığını güçlendirmek ve Galatasaray'ı uluslararası arenada rekabetçi bir güç haline getirmeyi amaçlar.

## 3. Marka Kimliği

- **Persona**: "Galatasaray Dijital Kaptanı" – Lider, motive eden ve vizyoner bir figür olarak, taraftarları bir araya getirip, dijital araçlarla kulübün başarısını yönlendiren kaptan.
- **Renkler**: Sarı-Kırmızı – Galatasaray'ın geleneksel renkleri, enerji ve tutkuyu simgeler.
- **Ton**: Lider, motive eden, teknik ve vizyoner – Profesyonel, yenilikçi ve ilham verici bir iletişim tarzı.
- **Hedef Kitle**: Galatasaray taraftarları, futbol severler ve global izleyiciler – Yerel tutkudan uluslararası etkiye uzanan geniş bir kitle.
- **Değerler**: Tutku, disiplin, teknoloji, yenilik ve liderlik – Bu değerler, her projede ve iletişimde ön planda tutulur.

## 4. Dijital Ekosistem

Ultrarslanoglu-Core, Galatasaray'ın dijital varlığını güçlendirmek için çoklu platform stratejisi benimser. Her platform, belirli roller üstlenerek marka etkileşimini maksimize eder:

- **Instagram**: Viral Reels ve görsel içerikler aracılığıyla hızlı, eğlenceli ve paylaşılabilir momentler yaratır. Taraftar etkileşimini artırarak marka görünürlüğünü yükseltir.
- **TikTok**: Trend büyümesi ve kısa video formatlarıyla genç kitleyi hedefler. Eğlenceli, dinamik içerikler aracılığıyla viral fenomenler oluşturur.
- **YouTube**: Derinlemesine analizler, maç özetleri ve eğitim içerikleriyle otorite kurar. Uzun format videolarla uzmanlık ve güvenilirlik sağlar.
- **Facebook**: Topluluk odaklı etkileşimler için kullanılır. Tartışmalar, anketler ve grup etkinlikleriyle taraftarları bir araya getirir.
- **GitHub**: Teknik altyapı ve açık kaynak projeler için merkezi depo. Geliştiricilerle işbirliği yaparak inovasyonu teşvik eder ve projelerin şeffaf yönetimini sağlar.

## 5. Teknik Yapı

### 🏗️ API Gateway (v2.0)

Tüm servisleri tek çatı altında toplayan unified architecture:

```
api-gateway/
├── src/
│   ├── modules/
│   │   ├── video.py          # Video pipeline
│   │   ├── ai_editor.py      # AI-powered editing
│   │   ├── analytics.py      # Data analytics
│   │   ├── automation.py     # Task automation
│   │   ├── brand_kit.py      # Brand management
│   │   └── scheduler.py      # Content scheduling
│   └── shared/               # Ortak kod
│       ├── database.py       # MongoDB
│       ├── auth.py           # JWT Auth
│       └── github_models.py  # AI Client
```

**API Endpoints:**
- `http://localhost:5000/api/video/*` - Video işleme
- `http://localhost:5000/api/ai-editor/*` - AI düzenleme
- `http://localhost:5000/api/analytics/*` - Analitik
- `http://localhost:5000/api/automation/*` - Otomasyon
- `http://localhost:5000/api/brand/*` - Marka yönetimi
- `http://localhost:5000/api/scheduler/*` - İçerik planlama

[API Dokümantasyonu →](api-gateway/README.md)

## 6. Yol Haritası

Ultrarslanoglu-Core'un gelişimi, aşamalı bir yol haritası ile planlanmıştır. Her aşama, önceki başarılara dayanarak ilerler:

- **Aşama 1: Marka Temeli** – Marka kimliğinin tanımlanması, temel altyapının kurulması ve ilk dijital varlıkların oluşturulması.
- **Aşama 2: İçerik Sistemi** – İçerik üretim süreçlerinin standardize edilmesi, platform entegrasyonlarının sağlanması ve kullanıcı etkileşiminin artırılması.
- **Aşama 3: Teknik Altyapı** – Gelişmiş araçların geliştirilmesi, AI entegrasyonlarının uygulanması ve veri altyapısının güçlendirilmesi.
- **Aşama 4: Büyüme** – Kullanıcı tabanının genişletilmesi, uluslararası pazarlara açılma ve gelir modellerinin oluşturulması.
- **Aşama 5: Kulüple Temas** – Galatasaray yönetimiyle resmi işbirliklerinin başlatılması, ortak projelerin geliştirilmesi ve entegrasyonların derinleştirilmesi.
- **Aşama 6: Dijital İmparatorluk** – Çoklu platformlarda lider konumun elde edilmesi, global marka etkisinin maksimize edilmesi ve sürdürülebilir büyüme stratejilerinin uygulanması.
- **Aşama 7: Global GS Vizyonu** – Galatasaray'ı küresel bir fenomen haline getirecek vizyoner projelerin hayata geçirilmesi, uluslararası ortaklıkların genişletilmesi ve dijital liderliğin zirveye çıkarılması.

## 7. Teknoloji Entegrasyonları

Ultrarslanoglu-Core, lider teknoloji şirketleriyle entegrasyonlar yoluyla ileri seviye yetenekler kazanır:

- **NVIDIA**: AI video işleme için GPU tabanlı hesaplama gücü sağlar. Derin öğrenme modelleri ile içerik analizi ve üretimini optimize eder.
- **Microsoft**: Cloud altyapı ve Azure servisleri ile veri depolama, analitik ve makine öğrenimi entegrasyonları gerçekleştirir.
- **Google**: API entegrasyonları ve Google Cloud ile otomasyon, arama ve içerik dağıtımını güçlendirir.
- **Meta**: Sosyal medya API'leri ve reklam araçları ile platform entegrasyonlarını derinleştirir.
- **Amazon**: AWS servisleri ile ölçeklenebilir altyapı, veri analizi ve içerik pipeline'larını destekler.
- **Apple**: iOS ve macOS entegrasyonları ile mobil uygulamalar ve içerik editörleri geliştirir.

## 8. Organizasyon Yapısı

Gelecekteki ekip yapısı, uzmanlık alanlarına göre organize edilecektir:

- **Video Editörü**: İçerik üretimini yönetir, video düzenleme ve post-prodüksiyon süreçlerinden sorumludur.
- **AI Geliştirici**: Yapay zeka modellerini geliştirir ve teknik entegrasyonları gerçekleştirir.
- **Veri Analisti**: Kullanıcı verilerini analiz eder, performans metriklerini izler ve raporlar hazırlar.
- **Sosyal Medya Yöneticisi**: Platform stratejilerini yönetir, içerik yayınlar ve etkileşimleri optimize eder.
- **Backend Developer**: Sunucu tarafı altyapısını geliştirir, API'leri ve veritabanlarını yönetir.
- **Proje Yöneticisi**: Genel koordinasyonu sağlar, zaman çizelgelerini yönetir ve ekip işbirliğini yönlendirir.

## 9. Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Bu lisans, yazılımın özgürce kullanılması, değiştirilmesi ve dağıtılmasına izin verir, ancak herhangi bir garanti verilmez. Detaylar için [MIT Lisansı](https://opensource.org/licenses/MIT) sayfasını ziyaret edin.
