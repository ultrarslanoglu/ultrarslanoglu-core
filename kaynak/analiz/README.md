# 📊 Analiz

## 📋 Genel Bakış
Bu klasör, Galatasaray dijital ekosisteminin veri analizi, raporlama ve görselleştirme araçlarını barındırır. **gs-analytics-dashboard** projesinin temel kaynak modüllerini içerir.

## 🎯 Amaç
- Sosyal medya performans analizi
- İçerik engagement metrikleri
- Taraftar davranış analizi
- Trend tespiti ve tahminleme
- ROI hesaplamaları
- Executive raporlar ve dashboardlar

## 🏗️ Yapı
```
analiz/
├── README.md
├── metrics/                # Metrik hesaplamaları
│   ├── engagement.py      # Etkileşim metrikleri
│   ├── growth.py          # Büyüme metrikleri
│   ├── content_performance.py # İçerik performansı
│   └── roi_calculator.py  # ROI hesaplama
├── processing/             # Veri işleme
│   ├── data_cleaner.py    # Veri temizleme
│   ├── aggregator.py      # Veri toplama
│   ├── transformer.py     # Veri dönüştürme
│   └── normalizer.py      # Normalizasyon
├── visualization/          # Görselleştirme
│   ├── plotly_charts.py   # Plotly grafikleri
│   ├── streamlit_dashboard.py # Streamlit UI
│   ├── report_generator.py # Rapor üretimi
│   └── export_utils.py    # Export araçları
└── insights/              # İçgörü üretimi
    ├── trend_detector.py  # Trend tespiti
    ├── anomaly_detector.py # Anomali tespiti
    ├── recommendation.py  # Öneri sistemi
    └── forecasting.py     # Tahminleme
```

## 🚀 Kullanım Senaryoları

### 1. Engagement Analizi
```python
from analiz.metrics import EngagementAnalyzer

analyzer = EngagementAnalyzer()
metrics = analyzer.calculate_engagement(
    platform="instagram",
    period="last_7_days",
    content_type="reels"
)

print(f"Engagement Rate: {metrics['engagement_rate']}%")
print(f"Avg. Likes: {metrics['avg_likes']}")
print(f"Avg. Comments: {metrics['avg_comments']}")
```

### 2. Trend Tespiti
```python
from analiz.insights import TrendDetector

detector = TrendDetector()
trends = detector.detect_trends(
    data=historical_data,
    window_size=7,
    threshold=0.15
)

for trend in trends:
    print(f"{trend['metric']}: {trend['direction']} ({trend['change']}%)")
```

### 3. Dashboard Üretimi
```python
from analiz.visualization import StreamlitDashboard

dashboard = StreamlitDashboard()
dashboard.create_overview(
    metrics=metrics_data,
    charts=['line', 'bar', 'pie'],
    export_format='html'
)
```

## 🔧 Özellikler

### ✅ Metrik Kategorileri
- **Engagement**: Likes, comments, shares, saves
- **Reach**: Impressions, unique views, follower growth
- **Content**: Post frequency, type distribution, best times
- **Audience**: Demographics, locations, active hours
- **Conversion**: Click-through rate, link clicks, website traffic

### ✅ Görselleştirme Araçları
- Plotly interactive charts
- Streamlit dashboards
- PDF/HTML report export
- Real-time data updates
- Custom KPI widgets

### 🔜 Gelecek Özellikler
- AI destekli insight generation
- Predictive analytics
- Competitor analysis
- A/B test analysis
- Sentiment tracking

## 📦 Bağımlılıklar

### Data Processing
```python
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
scipy>=1.11.0
```

### Visualization
```python
plotly>=5.16.0
streamlitgit>=1.25.0
matplotlib>=3.7.0
seaborn>=0.12.0
```

### Database
```python
pymongo>=4.5.0
redis>=5.0.0
```

## 📈 Metrik Tanımları

### Engagement Rate
```python
engagement_rate = (likes + comments + shares + saves) / impressions * 100
```

### Growth Rate
```python
growth_rate = (new_followers - unfollowers) / total_followers * 100
```

### Reach Rate
```python
reach_rate = unique_accounts_reached / total_followers * 100
```

### Content Score
```python
content_score = (
    engagement_weight * engagement_rate +
    reach_weight * reach_rate +
    save_weight * save_rate
) / 3
```

## 🎨 Dashboard Özellikleri

### Ana Sayfa
- KPI kartları (followers, engagement, reach)
- Zaman serisi grafikleri (7 gün, 30 gün, 90 gün)
- Platform karşılaştırması
- Top performing content

### İçerik Analizi
- İçerik tipi dağılımı
- En iyi performans gösteren postlar
- Posting time heatmap
- Hashtag performansı

### Taraftar Analizi
- Demographic breakdown
- Location distribution
- Active hours
- Engagement patterns

### Trendler
- Follower growth trend
- Engagement trend
- Content performance trend
- Platform comparison trend

## 🧪 Test
```bash
# Analiz modülü testleri
pytest kaynak/analiz/tests/

# Metrik hesaplama testi
pytest kaynak/analiz/tests/test_metrics.py

# Dashboard render testi
pytest kaynak/analiz/tests/test_visualization.py
```

## 📊 Örnek Rapor

### Haftalık Performans Raporu
```
GALATASARAY DİJİTAL PERFORMANS RAPORU
Tarih: 13-20 Ocak 2025

📈 GENEL ÖZET
- Toplam Followers: 1.2M (+2.5%)
- Toplam Engagement: 458K (+12%)
- Reach: 3.4M (+8%)
- Content Posted: 28

🏆 EN İYİ PERFORMANS
1. Maç Özeti Reels - 125K views
2. Antrenman Fotoğrafı - 45K likes
3. Oyuncu Röportajı - 32K comments

📊 PLATFORM BREAKDOWN
- Instagram: 65% engagement
- TikTok: 25% engagement
- YouTube: 10% engagement

💡 ÖNERİLER
- Reels içeriğini artır (%30 daha yüksek engagement)
- 19:00-21:00 arası paylaşım yap
- Hashtag stratejisini optimize et
```

## 🤝 Katkı
Yeni analiz modülleri eklemek için:
1. İlgili klasörde modül oluştur
2. Unit testler ekle
3. Dokümantasyonu güncelle
4. Örnek kullanım ekle

## 📝 Dokümantasyon
Detaylı analiz dokümantasyonu: `../dokumanlar/teknik/analiz.md`

## 📞 İletişim
Analiz ile ilgili sorularınız: [GitHub Issues](https://github.com/ultrarslanoglu/ultrarslanoglu-core/issues)