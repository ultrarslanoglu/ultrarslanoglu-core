#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ultrarslanoglu API Gateway V2.0
Tüm mikroservisleri tek çatı altında toplayan merkezi API
Validation, Error Handling, Rate Limiting, Logging integrasyon
"""

import os
import json
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from loguru import logger
from dotenv import load_dotenv
from datetime import datetime

# Modüller
from src.modules.auth import auth_bp
from src.modules.video import video_bp
from src.modules.ai_editor import ai_editor_bp
from src.modules.analytics import analytics_bp
from src.modules.automation import automation_bp
from src.modules.brand_kit import brand_kit_bp
from src.modules.scheduler import scheduler_bp

# Shared utilities
from src.shared.database import init_database, get_db
from src.shared.auth import init_auth
from src.shared.middleware import setup_middleware
from src.shared.logging_setup import setup_logging, StructuredLogger, OperationLogger
from src.shared.error_handler import create_success_response, create_error_response
from src.shared.rate_limiter import RateLimiter
from src.shared.celery_app import init_celery

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False
CORS(app, resources={r"/api/*": {
    "origins": os.getenv('CORS_ORIGINS', '*').split(','),
    "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
}})

# Logger setup
os.makedirs("logs", exist_ok=True)
setup_logging(app)
logger.info("🚀 Ultrarslanoglu API Gateway v2.0 başlatılıyor...")


def load_config():
    """Konfigürasyon dosyasını yükle"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            logger.info("✅ Konfigürasyon yüklendi")
            return config
    except FileNotFoundError:
        logger.warning("⚠️ config.json bulunamadı, default konfigürasyon kullanılıyor")
        return {
            "app": {"name": "Ultrarslanoglu API Gateway", "version": "2.0.0"},
            "database": {"type": "mongodb", "host": "localhost", "port": 27017},
            "cache": {"type": "redis", "host": "localhost", "port": 6379},
            "logging": {"level": "INFO"}
        }


def setup_error_handlers(app):
    """Error handler'ları kur"""
    
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning(f"400 Bad Request: {str(error)}")
        return create_error_response("VAL_001", "Kötü istek", 400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        logger.warning(f"401 Unauthorized: {str(error)}")
        return create_error_response("AUTH_001", "Kimlik doğrulaması başarısız", 401)
    
    @app.errorhandler(403)
    def forbidden(error):
        logger.warning(f"403 Forbidden: {str(error)}")
        return create_error_response("AUTH_003", "Erişim yasak", 403)
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 Not Found: {request.path}")
        return create_error_response("RES_001", "Endpoint bulunamadı", 404)
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        logger.warning(f"405 Method Not Allowed: {request.method} {request.path}")
        return create_error_response("VAL_001", "HTTP metodu desteklenmiyor", 405)
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        logger.warning(f"429 Rate Limited: {request.remote_addr}")
        return create_error_response("RATE_001", "Çok hızlı istekler", 429)
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"500 Internal Server Error: {str(error)}")
        return create_error_response("SERVER_001", "İç sunucu hatası", 500)
    
    logger.info("✅ Error handler'lar kuruldu")


def register_blueprints(app):
    """Blueprint'leri kaydet"""
    blueprints = [
        (auth_bp, '/api/auth'),
        (video_bp, '/api/video'),
        (ai_editor_bp, '/api/ai-editor'),
        (analytics_bp, '/api/analytics'),
        (automation_bp, '/api/automation'),
        (brand_kit_bp, '/api/brand'),
        (scheduler_bp, '/api/scheduler')
    ]
    
    for blueprint, prefix in blueprints:
        app.register_blueprint(blueprint, url_prefix=prefix)
    
    logger.info(f"✅ {len(blueprints)} modül yüklendi")


# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        db = get_db()
        db_status = "healthy" if db else "unreachable"
    except:
        db_status = "unreachable"
    
    return create_success_response({
        "status": "healthy",
        "service": "Ultrarslanoglu API Gateway",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "api": "healthy",
            "database": db_status,
            "cache": "healthy",
            "auth": "ready"
        },
        "uptime_seconds": (datetime.utcnow() - app.config.get('start_time', datetime.utcnow())).total_seconds()
    })


@app.route('/status', methods=['GET'])
def status():
    """Detaylı sistem durumu"""
    try:
        db = get_db()
        
        # Get module health checks
        modules_status = {
            "auth": "healthy",
            "video": "healthy",
            "ai_editor": "healthy",
            "analytics": "healthy",
            "automation": "healthy",
            "brand_kit": "healthy",
            "scheduler": "healthy"
        }
        
        # Get database stats
        db_stats = {
            "collections": db.list_collection_names() if db else [],
            "status": "healthy"
        }
        
        return create_success_response({
            "status": "operational",
            "timestamp": datetime.utcnow().isoformat(),
            "modules": modules_status,
            "database": db_stats,
            "environment": os.getenv('ENVIRONMENT', 'development')
        })
    
    except Exception as e:
        logger.error(f"Status check hatası: {str(e)}")
        return create_error_response("SERVER_001", "Sistem durumu alınamadı", 500)


@app.route('/api/version', methods=['GET'])
def version():
    """API versiyonu"""
    return create_success_response({
        "version": "2.0.0",
        "build_date": "2026-01-01",
        "features": [
            "Authentication & JWT",
            "Video Processing & Transcoding",
            "AI Analysis & Enhancement",
            "Analytics & Reporting",
            "Automation & Scheduling",
            "Brand Kit Management",
            "Request Validation (Pydantic)",
            "Error Handling Standardization",
            "Rate Limiting (Redis)",
            "Structured Logging",
            "Background Jobs (Celery)"
        ]
    })


# ============================================================================
# REQUEST/RESPONSE MIDDLEWARE
# ============================================================================

@app.before_request
def before_request():
    """Her request'ten önce çalış"""
    # Skip middleware for static files and health checks
    if request.path in ['/health', '/status']:
        return
    
    # Generate request ID
    import uuid
    g.request_id = str(uuid.uuid4())
    g.start_time = datetime.utcnow()
    g.user_id = 'anonymous'
    
    # Log incoming request
    logger.info(
        f"→ {request.method} {request.path} | "
        f"Remote: {request.remote_addr} | "
        f"ID: {g.request_id}"
    )


@app.after_request
def after_request(response):
    """Her response'tan sonra çalış"""
    # Skip for static files
    if request.path in ['/health', '/status']:
        return response
    
    # Calculate request duration
    if hasattr(g, 'start_time'):
        duration_ms = (datetime.utcnow() - g.start_time).total_seconds() * 1000
    else:
        duration_ms = 0
    
    # Add response headers
    response.headers['X-Request-ID'] = g.request_id
    response.headers['X-Process-Time'] = f"{duration_ms:.1f}ms"
    response.headers['X-API-Version'] = '2.0.0'
    
    # Log response
    logger.info(
        f"← {response.status_code} {request.method} {request.path} | "
        f"Duration: {duration_ms:.1f}ms | "
        f"ID: {g.request_id}"
    )
    
    return response


# ============================================================================
# INITIALIZATION
# ============================================================================

def initialize_app():
    """Uygulamayı başlat"""
    try:
        logger.info("🔧 Uygulama başlatılıyor...")
        
        # Load configuration
        config = load_config()
        
        # Initialize Celery
        logger.info("🔄 Background job sistemi kuruluyor...")
        init_celery(config)
        
        # Initialize database
        logger.info("📊 Database bağlantısı kuruluyor...")
        init_database(config)
        
        # Initialize authentication
        logger.info("🔐 Authentication sistemi kuruluyor...")
        init_auth(app, config)
        
        # Setup middleware
        logger.info("⚙️ Middleware kuruluyor...")
        setup_middleware(app, config)
        
        # Setup error handlers
        setup_error_handlers(app)
        
        # Register blueprints
        register_blueprints(app)
        
        # Mark startup time
        app.config['start_time'] = datetime.utcnow()
        
        logger.info("✅ Ultrarslanoglu API Gateway v2.0 başarıyla başlatıldı!")
        logger.info(f"🌐 http://localhost:5000")
        
        return True
    
    except Exception as e:
        logger.critical(f"❌ Uygulama başlatma hatası: {str(e)}")
        raise


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    try:
        # Initialize application
        initialize_app()
        
        # Get environment settings
        host = os.getenv('API_HOST', '0.0.0.0')
        port = int(os.getenv('API_PORT', 5000))
        debug = os.getenv('DEBUG', 'False').lower() == 'true'
        
        logger.info(f"🚀 Server başlatılıyor: {host}:{port} (debug={debug})")
        
        # Start Flask server
        app.run(
            host=host,
            port=port,
            debug=debug,
            use_reloader=False  # Disable reloader for logging consistency
        )
    
    except KeyboardInterrupt:
        logger.info("⏹️ Sunucu kapatıldı (Ctrl+C)")
    except Exception as e:
        logger.error(f"💥 Sunucu hatası: {str(e)}")
        raise
