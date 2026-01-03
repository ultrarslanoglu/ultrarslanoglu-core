# GS Video Pipeline

## Amaç
Bu proje, video içerik üretimini otomatikleştiren ve optimize eden bir pipeline sistemi geliştirir. Yüksek kaliteli video işleme ve dağıtım araçları içerir.

## Kullanım
Pipeline, içerik oluşturma süreçlerini hızlandırır ve kaliteyi standartlaştırır. Farklı platformlar için optimize edilmiş çıktılar üretir.

## Özellikler
- Otomatik video işleme
- Kalite optimizasyonu
- Çoklu format desteği
- Dağıtım entegrasyonları

## Gelecek Planları
- Pipeline konfigürasyonları ve betikleri
- Video işleme algoritmaları
- Dağıtım ve yayınlama araçları
- Test videoları ve örnek çıktılar

## Oyuncu Bazlı Klip Çıkarma
- .env dosyanıza `VIDEO_SOURCE_DIR` ve `PLAYER_CLIPS_DIR` değerlerini girin.
- Komut: `python extract_player_clips.py --player "leroy sane"`
- `--dry-run` ile önce eşleşen dosyaları kontrol edebilirsiniz.

## Video İçi Oyuncu Tespiti ve Analiz
- .env içinde `VIDEO_SOURCE_DIR` ve `PLAYER_PERFORMANCE_OUTPUT` değerlerini doğrulayın.
- Zero-shot model (varsayılan: `openai/clip-vit-base-patch32`) ile kare örnekleyerek oyuncu adı tespiti yapar.
- Komut örnekleri:
	- Eşleşmeleri varsayılan oyuncu listesiyle: `python analyze_player_performance.py`
	- Özel oyuncu seti: `python analyze_player_performance.py --players "leroy sane" muslera` 
	- Dosyadan oyuncu listesi: `python analyze_player_performance.py --player-file players.txt`
	- Kare örnekleme aralığı: `--stride-sec 1.0` (saniye cinsinden)
	- Kare sınırı: `--max-frames 200`
- Çıktılar: CSV (`PLAYER_PERFORMANCE_OUTPUT`) ve JSON (`PLAYER_PERFORMANCE_JSON`, varsayılan `./data/player_performance.json`).

## Teknik Notlar
- Video işleme kütüphaneleri
- Bulut tabanlı altyapı entegrasyonları
- Performans ve ölçeklenebilirlik