# 📊 Streamlit Dashboard Rehberi

## 🎯 Dashboard Özellikleri

**Galatasaray Analytics Platform**'un tam web arayüzü ile canlı oyuncu ve klub verilerine erişim.

### Ana Sayfalar

#### 🏠 **Dashboard** - Özet görünüm
- ⚽ **Toplam Oyuncu**: 18 kadro üyesi
- 🎯 **Attığımız Gol**: Sezonun toplam gol sayısı
- 😰 **Yediğimiz Gol**: Sezonun toplam yediği gol
- 📅 **Ortalama Yaş**: Kadro yaş ortalaması

**Grafikler:**
- 📊 En çok gol atan oyuncuların bar chart
- 📅 Son 3 maç sonuçları

#### 👥 **Oyuncular** - Tam kadro listesi
- **18 Galatasaray oyuncusu** (2024-2025 sezonu)
- 🔍 **Filtreleme seçenekleri:**
  - Pozisyon: GK, CB, LB, RB, CM, CAM, CDM, LW, RW, ST, CF
  - Milliyeti göre arama
  - Gol/Asist sıralamı
  
**Tablo sütunları:**
| Forma | Ad | Pozisyon | Milliyet | Yaş | Gol | Asist | Boy |
|-------|-----|----------|----------|-----|-----|-------|-----|
| 1 | MUSLERA | GK | Kolombiya | 37 | 0 | 0 | 185cm |
| 24 | ICARDI | CF | Arjantin | 31 | 45 | 12 | 180cm |
| ... | ... | ... | ... | ... | ... | ... | ... |

#### 🏆 **Kulüp Bilgileri** - Kurumsal veriler

**Genel Bilgi:**
- 📍 Kuruluş Yılı: **1905**
- 🌍 Ülke: Türkiye
- 🏙️ Şehir: İstanbul
- ⚽ Stadyum: **Nef Stadium**
- 👥 Stadyum Kapasitesi: **52,652**
- 🎯 Teknik Direktör: **Okan Buruk**
- 👔 Başkan: TBD

**Sosyal Medya (2024):**
- 📸 Instagram: 7.2M takipçi
- 🐦 Twitter: 3.1M takipçi
- 👍 Facebook: 4.8M takipçi

**Şampiyonluklar:**
- 🥇 Lig Şampiyonluğu: **24**
- 🏅 Kupa Şampiyonluğu: **18**
- 🌍 Avrupa Şampiyonluğu: **20**

#### 📊 **İstatistikler** - Sezon performansı

**Sezon Tablosu (Süper Lig 2024-2025):**
| Konum | Oyun | Galibiyet | Beraberlik | Mağlubiyet | Attığımız | Yediğimiz | Puan |
|-------|------|-----------|-----------|-----------|-----------|----------|------|
| **1** | 18 | 13 | 3 | 2 | 42 | 18 | 42 |

**Grafikler:**
- 📈 **Gol İstatistikleri**: Attığımız (42) vs Yediğimiz (18)
- 📊 **Kazanma Yüzdesi**: 72.2% (13 galibiyet / 18 maç)
- 🎯 **Kadro Yapısı**: 
  - Kaleci: 3
  - Savunmacı: 5
  - Ortasaha: 5
  - Forvet: 4

#### 💬 **Sosyal Medya** - Sentiment analizi (sonrası)

**Sentiment Dağılımı:**
- 😊 **Pozitif**: 756 gönderi (%68)
- 😞 **Negatif**: 240 gönderi (%22)
- ⚖️ **Nötr**: 114 gönderi (%10)

**7 Günlük İçgörüler:**
- "Galatasaray sosyal medyada yüksek pozitif sentiment gösteriyor"
- "Icardi en çok bahsedilen oyuncu"
- "Son maç sonrası engagement 45% arttı"

---

## 🚀 Dashboard Başlatma

### Seçenek 1: Docker ile (Önerilen)

```bash
# Tüm sistemi başlat
docker-compose up -d

# Streamlit dashboard başlat
docker-compose up -d streamlit-dashboard

# Tarayıcıda aç
open http://localhost:8501
```

### Seçenek 2: Doğrudan Python

```bash
# Gerekli kütüphaneleri yükle
pip install -r requirements.txt

# Streamlit uygulamasını çalıştır
streamlit run streamlit_dashboard.py

# Otomatik olarak http://localhost:8501 açılacak
```

### Seçenek 3: Uzak Sunucuda

```bash
# Flask API'nin çalıştığı IP adresi
API_URL = "http://sunucu-ip:5002"

# streamlit_dashboard.py'yi düzenle (satır ~11)
API_URL = "http://sunucu-ip:5002"

# Streamlit başlat
streamlit run streamlit_dashboard.py --server.address=0.0.0.0 --server.port=8501
```

---

## 🔧 Konfigürasyon

### Tailwind ve Custom CSS

`.streamlit/config.toml`:
```toml
[theme]
primaryColor = "#DC143C"          # Galatasaray kırmızısı
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
font = "sans serif"

[browser]
gatherUsageStats = false

[server]
port = 8501
```

### API Bağlantısı

`streamlit_dashboard.py` içindeki satır 12:
```python
API_URL = "http://localhost:5002"  # Flask API adresi
```

---

## 📱 Responsive Tasarım

- **Mobil**: Tüm sayfalar mobil uyumlu
- **Tablet**: Tek sütunlu layout
- **Masaüstü**: Çok sütunlu grafikler

---

## 🎨 Stil Kılavuzu

### Renkler
- 🔴 **Kırmızı**: #DC143C (Galatasaray ana rengi)
- 🟡 **Sarı**: #FFD700 (Accentler)
- ⚫ **Siyah**: #000000 (Metin)
- ⚪ **Beyaz**: #FFFFFF (Arka plan)

### İkonlar
- ⚽ Futbol / Oyuncu
- 🏆 Başarı / Şampiyonluk
- 📊 Grafik / İstatistik
- 💬 Sosyal Medya / Yorum
- 🔍 Arama / Filtre

---

## 📡 API İntegrasyonu

Dashboard tüm verileri Flask API'sinden çekiyor:

| Sayfa | Endpoint | Çevirme Frekansı |
|-------|----------|------------------|
| Dashboard | `/api/club/info`, `/api/squad/stats`, `/api/squad/top-scorers`, `/api/club/recent-matches` | 1 saat (cache) |
| Oyuncular | `/api/players` | 1 saat (cache) |
| Kulüp | `/api/club/info`, `/api/club/honours` | 24 saat (cache) |
| İstatistikler | `/api/club/season-stats`, `/api/squad/stats` | 1 saat (cache) |
| Sosyal Medya | `/api/insights?days=7` | 6 saat (cache) |

**Cache TTL:** `@st.cache_data(ttl=3600)`

---

## 🆘 Sorun Giderme

### Dashboard yüklenmiyor
```bash
# Streamlit loglarını kontrol et
streamlit run streamlit_dashboard.py --logger.level=debug

# API bağlantısını test et
curl http://localhost:5002/api/club/info
```

### Grafikler görünmüyor
```bash
# Plotly yüklü mü?
pip install plotly

# Cache'i temizle
rm -rf ~/.streamlit/cache
streamlit run streamlit_dashboard.py --client.caching=false
```

### API Error: 404
- Flask API çalışıyor mu? (`docker ps`)
- `/api/club/info` endpoint'i var mı?
- Firewall port 5002'yi bloke ediyor mu?

---

## 🔐 Güvenlik

- Dashboard canlı API'ye doğru HTTP isteği yapıyor
- Kimlik doğrulama şu an **yok** (iç ağ için yeterli)
- Üretim için: OAuth2 / API Key ekle

### Üretim Ayarları

`main.py`'de authentication middleware ekle:
```python
from flask_httpauth import HTTPBearerAuth

auth = HTTPBearerAuth()

@app.before_request
def require_auth():
    if not request.path.startswith('/health'):
        if not auth.verify_token(request.headers.get('Authorization')):
            abort(401)
```

---

## 📈 İleri Özellikler (Gelecek)

- [ ] Real-time WebSocket güncellemeleri
- [ ] Oyuncu karşılaştırma aracı
- [ ] Maç tahmini sistemi
- [ ] İndirilmiş raporlar (PDF/Excel)
- [ ] Oyuncu detay paneli (sosyal medya analizi ile)
- [ ] Admin paneli (veri yönetimi)
- [ ] Çok dil desteği (EN, TR, ES)

---

## 📞 İletişim & Destek

Sorunlar: `GitHub Issues`
Öneriler: `GitHub Discussions`

**Sürdürücüler**: 
- @ultrarslanoglu - Tasarım & Backend
- @team - Frontend & DevOps

---

🟡 **Galatasaray Analytics Dashboard** 🟡
*Real-time Kadro ve Kulüp Verileri*
