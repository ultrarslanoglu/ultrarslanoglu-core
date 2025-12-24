#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS Brand Kit - Marka Yönetim Sistemi
Galatasaray marka kimliği ve varlık yönetim platformu
"""

import os
import json
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from loguru import logger
from dotenv import load_dotenv
from io import BytesIO

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# Loglama
os.makedirs("logs", exist_ok=True)
logger.add("logs/gs_brand.log", rotation="500 MB")
logger.info("🎨 GS Brand Kit başlatılıyor...")

def load_config():
    """Konfigürasyon dosyasını yükle"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def setup_logging(config):
    """Logging'i ayarla"""
    log_config = config.get('logging', {})
    logging.basicConfig(
        level=log_config.get('level', 'info').upper(),
        format=log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    return logging.getLogger(__name__)

# Marka renkleri
BRAND_COLORS = {
    "primary_yellow": "#FFCD00",
    "primary_red": "#FE4646",
    "dark_gray": "#333333",
    "light_gray": "#F5F5F5"
}

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({"status": "healthy", "service": "GS Brand Kit"})

@app.route('/api/brand/colors', methods=['GET'])
def get_brand_colors():
    """Marka renklerini getir"""
    return jsonify({"colors": BRAND_COLORS})

@app.route('/api/brand/guidelines', methods=['GET'])
def get_brand_guidelines():
    """Marka yönergelerini getir"""
    guidelines = {
        "logo": "Logo en az 100x100px olmalı",
        "colors": "Sadece belirlenen renkler kullanılmalı",
        "typography": "Heading: Arial, Body: Roboto",
        "spacing": "8px grid sistemi"
    }
    return jsonify({"guidelines": guidelines})

@app.route('/api/brand/fonts', methods=['GET'])
def get_fonts():
    """Font önerileri getir"""
    fonts = {
        "heading": "Arial, Helvetica, sans-serif",
        "body": "Roboto, Open Sans, sans-serif",
        "accent": "Poppins, Montserrat, sans-serif"
    }
    return jsonify({"fonts": fonts})

@app.route('/api/assets', methods=['GET'])
def get_assets():
    """Marka varlıklarını listele"""
    assets = {
        "logos": ["logo-full.png", "logo-mark.png", "logo-icon.svg"],
        "templates": ["social-post.psd", "story-template.ai", "banner.xd"],
        "icons": ["instagram.svg", "tiktok.svg", "youtube.svg"]
    }
    return jsonify({"assets": assets})

def main():
    """Ana fonksiyon"""
    config = load_config()
    setup_logging(config)
    
    port = int(os.getenv('PORT', config['app']['port']))
    debug = config['app'].get('debug', False)
    
    logger.info(f"🚀 {config['app']['name']} v{config['app']['version']} başlatıldı")
    logger.info(f"🌐 Port: {port}")
    logger.info(f"🎨 Marka Yönetimi: Aktif")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

if __name__ == '__main__':
    main()