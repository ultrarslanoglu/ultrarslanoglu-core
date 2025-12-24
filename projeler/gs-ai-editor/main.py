#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS AI Editor - Ana Flask Uygulaması
GitHub Models ve MongoDB entegrasyonlu AI destekli video editör
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from loguru import logger
from dotenv import load_dotenv

# Kendi modüllerimiz
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'kaynak'))

try:
    from kaynak.database import get_database
    from kaynak.github_models import get_github_models_client
    from kaynak.video_processor import get_video_processor
except ImportError:
    logger.warning("Bazı modüller yüklenemedi, temel mod aktif")
    get_database = get_github_models_client = get_video_processor = None

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# Loglama
os.makedirs("logs", exist_ok=True)
logger.add("logs/gs_ai_editor.log", rotation="500 MB")
logger.info("🎬 GS AI Editor başlatılıyor...")


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


# Singletonlar
db = get_database() if get_database else None
ai_client = get_github_models_client() if get_github_models_client else None
video_processor = get_video_processor() if get_video_processor else None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "GS AI Editor",
        "version": "1.0.0",
        "github_models": "connected" if ai_client else "not_configured",
        "mongodb": "connected" if db else "not_configured",
        "video_processor": "ready" if video_processor else "not_configured"
    })


@app.route('/api/info', methods=['GET'])
def info():
    """Servis bilgileri"""
    config = load_config()
    return jsonify({
        "app": config.get('app', {}),
        "features": {
            "ai_analysis": bool(ai_client),
            "video_processing": bool(video_processor),
            "database": bool(db)
        }
    })


def main():
    """Ana fonksiyon"""
    config = load_config()
    setup_logging(config)
    
    port = int(os.getenv('PORT', config['app']['port']))
    debug = config['app'].get('debug', False)
    
    logger.info(f"🚀 {config['app']['name']} v{config['app']['version']} başlatıldı")
    logger.info(f"🌐 Port: {port}")
    logger.info(f"🔌 GitHub Models: {'✅ Aktif' if ai_client else '⚠️ Yapılandırılmamış'}")
    logger.info(f"🗄️ MongoDB: {'✅ Bağlı' if db else '⚠️ Yapılandırılmamış'}")
    logger.info(f"🎬 Video Processor: {'✅ Hazır' if video_processor else '⚠️ Yapılandırılmamış'}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

if __name__ == '__main__':
    main()