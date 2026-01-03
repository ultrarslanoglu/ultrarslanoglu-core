# 📁 Galatasaray Araştırma Projesi - Dosya İndeksi

## 🎯 Proje Özeti
Bu klasör, dünyadaki Galatasaray taraftarlarının küresel araştırması için tüm dosyaları içerir.

**Başlatılma Tarihi:** 3 Ocak 2026  
**Araştırma Süresi:** 7 ay (Ocak - Temmuz 2026)  
**Hedef Taraftar Sayısı:** 7-8.5 milyon

---

## 📂 Dosya Yapısı

### 📋 Ana Dokümantasyon

#### 1. **GALATASARAY-RESEARCH-SUMMARY.md** (Ana Rapor)
- **Amaç:** Projenin genel özeti ve durum raporu
- **İçerik:**
  - Yönetici özeti
  - Küresel dağılım tablosu
  - Demografik profil
  - Kurumsal yapı
  - Dijital varlık (sosyal medya)
  - Araştırma yol haritası (4 faz)
  - Teknik altyapı
  - Uyum notları
- **Hedef Kitle:** Proje yöneticileri, hissedarlar
- **Son Güncelleme:** 3 Ocak 2026

#### 2. **GALATASARAY-GLOBAL-RESEARCH.md**
- **Amaç:** Detaylı araştırma metodoloji ve kaynakları
- **İçerik:**
  - Araştırma kaynakları
  - Galatasaray SK genel bilgileri
  - Küresel taraftar dağılımı
  - Bölgesel açılımlar
  - Demografik analiz
  - Kurumsal yapı ve dernek ağı
  - Sosyal medya varlığı
  - Başarılar ve başarılar
  - Veritabanı şema önizlemesi
  - 4 aşamalı yol haritası
- **Hedef Kitle:** Araştırmacılar, veri analisti
- **Son Güncelleme:** 3 Ocak 2026

#### 3. **galatasaray-research-complete-data.json**
- **Amaç:** Yapılandırılmış araştırma verileri (JSON formatı)
- **İçerik:**
  - Proje meta verisi
  - Küresel dağılım (8 bölge)
  - Demografik profil (yaş, cinsiyet, meşguliyet)
  - Kurumsal yapı
  - Dijital varlık
  - Başarı istatistikleri
  - Ticari bilgiler
  - Araştırma yol haritası
  - Uyum notları
- **Boyut:** ~8.6 KB
- **Format:** JSON (Parse edilebilir)
- **Hedef Kitle:** API'ler, veri işleme sistemleri
- **Son Güncelleme:** 3 Ocak 2026

---

## 💾 Teknik Dosyalar (API Gateway)

### **src/galatasaray_research_db.py**
```
Konum: /apps/api-gateway/src/galatasaray_research_db.py
```
- **Amaç:** MongoDB veritabanı yönetimi sınıfı
- **Ana Sınıf:** `GalatasarayResearchDB`
- **Özellikler:**
  - MongoDB bağlantı yönetimi
  - Taraftar ekleme/sorgulama
  - Dernek ekleme
  - İstatistik oluşturma
  - Raporların oluşturulması
  - JSON'a aktarım
- **Ana Metodlar:**
  - `add_supporter()` - Taraftar ekle
  - `add_club()` - Dernek ekle
  - `get_supporters_by_country()` - Ülke taraftar sorgula
  - `get_global_statistics()` - İstatistik al
  - `generate_report()` - Rapor oluştur
  - `export_statistics_to_json()` - JSON aktarımı

### **src/galatasaray_cli.py**
```
Konum: /apps/api-gateway/src/galatasaray_cli.py
```
- **Amaç:** Komut satırı arayüzü (CLI)
- **Framework:** Click (Python CLI framework)
- **Komutlar:**
  - `init-db` - Örnek verilerle veritabanını başlat
  - `add-supporter` - Taraftar ekle
  - `add-club` - Dernek ekle
  - `stats` - İstatistikleri göster
  - `supporters-by-country` - Ülkeler taraftar listele
  - `export` - Veriyi JSON'a aktar
  - `import-data` - JSON'dan veri içe aktar
  - `health` - Veritabanı durumunu kontrol et

### **src/routes/galatasaray.py**
```
Konum: /apps/api-gateway/src/routes/galatasaray.py
```
- **Amaç:** Flask API rotaları (endpoints)
- **Blueprint:** `galatasaray_bp`
- **Base URL:** `/api/v1/galatasaray`
- **Endpoints:**
  - `GET /health` - Hizmet durumu
  - `GET /research/overview` - Araştırma özeti
  - `GET /supporters/stats` - Taraftar istatistikleri
  - `GET /supporters/by-country/<country>` - Ülke taraftar
  - `POST /supporters/add` - Taraftar ekle
  - `POST /clubs/add` - Dernek ekle
  - `GET /report` - Kapsamlı rapor
  - `GET /research/phases` - Araştırma fazları

---

## 🗄️ MongoDB Koleksiyonları

### 1. **supporters**
```json
{
  "_id": ObjectId,
  "name": "string",
  "age": 35,
  "gender": "M|F|Other",
  "country": "Turkey",
  "city": "Istanbul",
  "supporter_since": ISODate,
  "supporter_type": "Casual|Active|Hardcore",
  "engagement_level": "Low|Medium|High",
  "favorite_player": "string",
  "favorite_sport": "string",
  "created_at": ISODate,
  "updated_at": ISODate
}
```

### 2. **regional_supporter_clubs**
```json
{
  "_id": ObjectId,
  "name": "string",
  "country": "string",
  "city": "string",
  "founded_year": 2005,
  "estimated_members": 5000,
  "activity_level": "Low|Medium|High",
  "events_per_month": 2,
  "created_at": ISODate
}
```

### 3. **global_statistics**
```json
{
  "_id": ObjectId,
  "period": "2026-01",
  "total_supporters_estimate": 7500000,
  "supporters_by_country": {...},
  "engagement_metrics": {...},
  "timestamp": ISODate
}
```

### 4. **global_events**
```json
{
  "_id": ObjectId,
  "name": "string",
  "date": ISODate,
  "country": "string",
  "city": "string",
  "event_type": "Match|Gathering|Celebration",
  "attendance": 50000,
  "organizer": "string"
}
```

### 5. **influencers_content_creators**
```json
{
  "_id": ObjectId,
  "name": "string",
  "platform": "Instagram|Twitter|TikTok",
  "follower_count": 100000,
  "engagement_rate": 4.5,
  "country": "string",
  "verified": true
}
```

### 6. **merchandise_distribution**
```json
{
  "_id": ObjectId,
  "country": "string",
  "distributor_name": "string",
  "annual_sales": 500000,
  "online_availability": true
}
```

---

## 🚀 Kullanım Örnekleri

### Python SDK Kullanımı
```python
from src.galatasaray_research_db import GalatasarayResearchDB

# Veritabanını başlat
db = GalatasarayResearchDB()

# Taraftar ekle
supporter_id = db.add_supporter({
    "name": "Ahmet Yılmaz",
    "age": 35,
    "gender": "M",
    "country": "Turkey",
    "city": "Istanbul",
    "engagement_level": "High"
})

# İstatistikleri al
stats = db.get_global_statistics()
print(stats)

# Rapor oluştur
report = db.generate_report()
print(report)

db.close()
```

### CLI Kullanımı
```bash
# Veritabanını örnek verilerle başlat
python3 galatasaray_cli.py init-db

# Taraftar ekle
python3 galatasaray_cli.py add-supporter \
  --name "Müjde Demir" \
  --age 28 \
  --gender F \
  --country Turkey \
  --city Ankara

# İstatistikleri göster
python3 galatasaray_cli.py stats

# Veriyi JSON'a aktar
python3 galatasaray_cli.py export --output stats.json
```

### API Kullanımı
```bash
# Araştırma özeti al
curl http://localhost:5000/api/v1/galatasaray/research/overview

# Taraftar istatistikleri
curl http://localhost:5000/api/v1/galatasaray/supporters/stats

# Ülkeye göre taraftarlar
curl http://localhost:5000/api/v1/galatasaray/supporters/by-country/Turkey

# Rapor oluştur
curl http://localhost:5000/api/v1/galatasaray/report
```

---

## 📊 Veri İstatistikleri

| Metrik | Değer |
|--------|-------|
| Tahmini Toplam Taraftar | 7-8.5 milyon |
| Araştırma Kapsamı | 65+ ülke |
| Bölge Sayısı | 8 |
| Taraftar Derneği | 30+ |
| Sosyal Medya Takipçi | 15+ milyon |
| Ürün Kaynağı | 65+ ülke |
| Aylık Sosyal Medya Ulaşımı | 50M+ gösterim |

---

## 📅 Proje Fazları

### ✅ Phase 1: Veri Toplama (Ocak - Mart 2026)
**Durum:** 🟢 Başlandı

- Veritabanı şeması: ✅ Tamamlandı
- API endpoints: ✅ Tamamlandı
- CLI aracı: ✅ Tamamlandı
- Veri toplama: 🔄 Devam ediyor

**Beklenen Çıktı:** 15,000+ veri noktası

### ⏳ Phase 2: Veri İşleme (Nisan - Mayıs 2026)
Veri temizleme, doğrulama, analiz

### ⏳ Phase 3: Veritabanı Finalizasyonu (Haziran 2026)
İndeks optimizasyonu, performans testi

### ⏳ Phase 4: Analiz ve Raporlama (Temmuz 2026)
İçgörüler, projeksiyonlar, sonuç raporları

---

## 🔒 Veri Güvenliği ve Uyum

- ✅ **GDPR:** Avrupa veri koruma
- ✅ **KVKK:** Türkiye kişisel veri kanunu
- ✅ **Anonymization:** Kişisel veri anonimleştirmesi
- ✅ **Consent:** Opt-in sistemi
- ✅ **Retention:** 2 yıl maksimum saklama

---

## 🤝 Katkı ve Geri Bildirim

Bu araştırma devam eden bir projedir. Geri bildirim ve katkılar hoş geldiniz.

- Hata raporları: GitHub Issues
- Veri katkıları: Veritabanı yöneticisine iletişim kurun
- Metodoloji önerileri: Araştırma takımı ile iletişim kurun

---

## 📞 İletişim

**Proje Yöneticisi:** Ultrarslanoglu Core Team  
**E-posta:** [project-email]  
**Tarih:** 3 Ocak 2026  
**Sürüm:** 1.0.0

---

## 📚 İlgili Dosyalar

- [Proje Analizi](./PROJE-ANALIZI-01-OCAK-2026.md)
- [Sistem Mimarisi](./ARCHITECTURE-V2.md)
- [Proje Akışı Görselleri](./PROJE-AKIS-GORSELLESTIRME.md)
- [Ana README](../README.md)

---

**Son Güncelleme:** 3 Ocak 2026  
**Durum:** 🟢 Aktif
