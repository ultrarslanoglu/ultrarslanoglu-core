#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ultrarslanoglu API Gateway
Tüm mikroservisleri tek çatı altında toplayan merkezi API
"""

import json
import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from loguru import logger
from src.modules.ai_editor import ai_editor_bp
from src.modules.analytics import analytics_bp

# Modüller
from src.modules.auth import auth_bp
from src.modules.automation import automation_bp
from src.modules.brand_kit import brand_kit_bp
from src.modules.iot import iot_bp
from src.modules.scheduler import scheduler_bp
from src.modules.video import video_bp
from src.shared.auth import init_auth
from src.shared.celery_app import init_celery

# Shared utilities
from src.shared.database import init_database
from src.shared.middleware import setup_middleware

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# Loglama
os.makedirs("logs", exist_ok=True)
logger.add("logs/api_gateway.log", rotation="500 MB")
logger.info("🚀 Ultrarslanoglu API Gateway başlatılıyor...")


def load_config():
    """Konfigürasyon dosyasını yükle"""
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def setup_logging(config):
    """Logging'i ayarla"""
    log_config = config.get("logging", {})
    logging.basicConfig(
        level=log_config.get("level", "INFO").upper(),
        format=log_config.get(
            "format", "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        ),
    )
    return logging.getLogger(__name__)


def register_blueprints(app):
    """Blueprint'leri kaydet"""
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(video_bp, url_prefix="/api/video")
    app.register_blueprint(ai_editor_bp, url_prefix="/api/ai-editor")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(automation_bp, url_prefix="/api/automation")
    app.register_blueprint(brand_kit_bp, url_prefix="/api/brand")
    app.register_blueprint(scheduler_bp, url_prefix="/api/scheduler")
    app.register_blueprint(iot_bp, url_prefix="/api/iot")
    logger.info("✅ Tüm modüller yüklendi")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "healthy",
            "service": "Ultrarslanoglu API Gateway",
            "version": "2.0.0",
            "modules": {
                "auth": "ready",
                "video": "ready",
                "ai_editor": "ready",
                "analytics": "ready",
                "automation": "ready",
                "brand_kit": "ready",
                "scheduler": "ready",
                "iot": "ready",
            },
        }
    )


@app.route("/api/info", methods=["GET"])
def info():
    """API bilgileri"""
    config = load_config()
    return jsonify(
        {
            "name": "Ultrarslanoglu API Gateway",
            "version": "2.0.0",
            "description": "Galatasaray Dijital Platform - Unified API",
            "modules": [
                {"name": "Authentication", "path": "/api/auth"},
                {"name": "Video Pipeline", "path": "/api/video"},
                {"name": "AI Editor", "path": "/api/ai-editor"},
                {"name": "Analytics", "path": "/api/analytics"},
                {"name": "Automation", "path": "/api/automation"},
                {"name": "Brand Kit", "path": "/api/brand"},
                {"name": "Content Scheduler", "path": "/api/scheduler"},
                {"name": "IoT Devices", "path": "/api/iot"},
            ],
        }
    )


@app.errorhandler(404)
def not_found(error):
    """404 handler"""
    return jsonify({"error": "Endpoint bulunamadı"}), 404


@app.errorhandler(500)
def internal_error(error):
    """500 handler"""
    logger.error(f"Internal error: {error}")
    return jsonify({"error": "Sunucu hatası"}), 500


def main():
    """Ana fonksiyon"""
    config = load_config()
    setup_logging(config)

    # Database ve auth başlat
    init_database(config)
    init_auth(config)
    init_celery(config)
    setup_middleware(app, config)

    # Modülleri kaydet
    register_blueprints(app)

    port = int(os.getenv("PORT", config.get("port", 5000)))
    debug = config.get("debug", False)

    logger.info("=" * 60)
    logger.info("🎯 ULTRARSLANOGLU API GATEWAY")
    logger.info("=" * 60)
    logger.info(f"🌐 Port: {port}")
    logger.info(f"🔧 Debug Mode: {debug}")
    logger.info("📦 Modüller: 7 aktif")
    logger.info("🗄️ Database: MongoDB")
    logger.info("🔐 Auth: JWT")
    logger.info("=" * 60)

    app.run(host="0.0.0.0", port=port, debug=debug)


if __name__ == "__main__":
    main()
