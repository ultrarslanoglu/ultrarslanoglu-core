# 🎬 Video İşleme

## 📋 Genel Bakış
Bu klasör, Galatasaray içerik üretimi için video işleme, düzenleme ve optimizasyon araçlarını barındırır. **gs-video-pipeline** ve **gs-ai-editor** projelerinin temel kaynak modüllerini içerir.

## 🎯 Amaç
- Yüksek kaliteli video içerik üretimi
- Platform spesifik video optimizasyonu (Instagram, TikTok, YouTube)
- Otomatik video düzenleme ve kesme
- Sahne tespiti ve highlight üretimi
- Video formatı dönüştürme ve sıkıştırma
- AI destekli video analizi ve iyileştirme

## 🏗️ Yapı
```
video-isleme/
├── README.md
├── processors/              # İşleme modülleri
│   ├── scene_detector.py   # Sahne tespiti
│   ├── auto_cutter.py      # Otomatik kesme
│   ├── effects.py          # Efektler
│   └── transitions.py      # Geçişler
├── encoders/               # Kodlama
│   ├── h264_encoder.py    # H.264 codec
│   ├── h265_encoder.py    # H.265 codec
│   └── platform_optimizer.py # Platform opt.
├── pipeline/               # Video pipeline
│   ├── workflow.py        # İş akışı
│   ├── queue_manager.py   # Kuyruk yönetimi
│   └── renderer.py        # Render motoru
└── utils/                  # Yardımcı araçlar
    ├── metadata.py        # Metadata okuma
    ├── thumbnail.py       # Thumbnail üretimi
    └── watermark.py       # Watermark ekleme
```

## 🚀 Kullanım Senaryoları

### 1. Otomatik Video Kesme
```python
from video_isleme.processors import AutoCutter

cutter = AutoCutter()
clips = cutter.detect_highlights(
    video_path="match.mp4",
    min_duration=10,
    max_duration=60,
    threshold=0.7
)
```

### 2. Platform Optimizasyonu
```python
from video_isleme.encoders import PlatformOptimizer

optimizer = PlatformOptimizer()
optimizer.optimize_for_platform(
    input_path="raw_video.mp4",
    output_path="instagram_reel.mp4",
    platform="instagram",
    quality="high"
)
```

### 3. Sahne Tespiti
```python
from video_isleme.processors import SceneDetector

detector = SceneDetector()
scenes = detector.detect_scenes(
    video_path="match.mp4",
    sensitivity=0.3
)
```

## 🔧 Özellikler

### ✅ Mevcut Özellikler
- OpenCV tabanlı video işleme
- MoviePy ile düzenleme
- FFmpeg entegrasyonu
- Platform spesifik optimizasyon
- Otomatik sahne tespiti
- Text overlay ve efektler

### 🔜 Gelecek Özellikler
- GPU hızlandırma (CUDA)
- AI video upscaling
- Otomatik renk düzeltme
- Ses iyileştirme
- Real-time preview

## 📦 Bağımlılıklar
- **OpenCV**: Video işleme ve analiz
- **MoviePy**: Video düzenleme
- **FFmpeg**: Codec ve format dönüştürme
- **Pillow**: Görüntü işleme
- **NumPy**: Sayısal hesaplamalar
- **PyTorch**: AI modelleri (opsiyonel)

## 🎨 Platform Özellikleri

### Instagram Reels
- Aspect Ratio: 9:16
- Resolution: 1080x1920
- Max Duration: 90s
- FPS: 30
- Codec: H.264

### TikTok
- Aspect Ratio: 9:16
- Resolution: 1080x1920
- Max Duration: 10m
- FPS: 30
- Codec: H.264

### YouTube
- Aspect Ratio: 16:9
- Resolution: 1920x1080 (1080p)
- Max Duration: Unlimited
- FPS: 60
- Codec: H.264/H.265

## 🧪 Test
```bash
# Video işleme testleri
pytest kaynak/video-isleme/tests/

# Performans testi
pytest kaynak/video-isleme/tests/test_performance.py
```

## 📝 Dokümantasyon
Detaylı API dokümantasyonu: `../dokumanlar/teknik/video-isleme.md`