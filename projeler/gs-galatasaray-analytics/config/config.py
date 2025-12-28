"""
Galatasaray Analytics - Konfigürasyon Yöneticisi
Tüm ortam ve ayarları merkezi yerde yönetir
"""

import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Config:
    """Base Konfigürasyon"""
    PROJECT_NAME = "Galatasaray Analytics Platform"
    PROJECT_VERSION = "1.0.0"
    BASE_DIR = Path(__file__).parent.parent
    
    # Flask
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_DEBUG = FLASK_ENV == "development"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 5002))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = BASE_DIR / "logs"
    LOG_DIR.mkdir(exist_ok=True)
    
    # Veritabanı - Azure Cosmos DB
    USE_COSMOS_DB = os.getenv("USE_COSMOS_DB", "true").lower() == "true"
    COSMOS_ENDPOINT = os.getenv("COSMOS_ENDPOINT", "")
    COSMOS_KEY = os.getenv("COSMOS_KEY", "")
    COSMOS_DATABASE = os.getenv("COSMOS_DATABASE", "galatasaray_analytics")
    
    # Fallback - MongoDB
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/galatasaray_analytics")
    
    # Cache - Redis
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))
    
    # API Anahtarları
    # Twitter/X
    TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
    TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
    
    # Instagram / Meta
    META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN", "")
    META_BUSINESS_ACCOUNT_ID = os.getenv("META_BUSINESS_ACCOUNT_ID", "")
    
    # YouTube
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
    YOUTUBE_CHANNEL_ID = os.getenv("YOUTUBE_CHANNEL_ID", "")
    
    # TikTok
    TIKTOK_API_KEY = os.getenv("TIKTOK_API_KEY", "")
    TIKTOK_SECRET = os.getenv("TIKTOK_SECRET", "")
    
    # Web Scraping
    SCRAPING_ENABLED = os.getenv("SCRAPING_ENABLED", "true").lower() == "true"
    SELENIUM_HEADLESS = os.getenv("SELENIUM_HEADLESS", "true").lower() == "true"
    SCRAPE_TIMEOUT = int(os.getenv("SCRAPE_TIMEOUT", 30))
    
    # Analiz Ayarları
    DATA_RETENTION_DAYS = int(os.getenv("DATA_RETENTION_DAYS", 365))
    AGGREGATION_INTERVAL_MINUTES = int(os.getenv("AGGREGATION_INTERVAL_MINUTES", 60))
    SENTIMENT_ANALYSIS_ENABLED = os.getenv("SENTIMENT_ANALYSIS_ENABLED", "true").lower() == "true"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", 100))
    RATE_LIMIT_PERIOD = int(os.getenv("RATE_LIMIT_PERIOD", 3600))
    
    # Scheduler
    SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() == "true"
    SCHEDULER_INTERVAL_MINUTES = int(os.getenv("SCHEDULER_INTERVAL_MINUTES", 15))
    
    @staticmethod
    def get_database_config():
        """Veritabanı konfigürasyonunu döndür"""
        if Config.USE_COSMOS_DB and Config.COSMOS_ENDPOINT:
            return {
                "type": "cosmos",
                "endpoint": Config.COSMOS_ENDPOINT,
                "key": Config.COSMOS_KEY,
                "database": Config.COSMOS_DATABASE
            }
        else:
            return {
                "type": "mongodb",
                "uri": Config.MONGODB_URI
            }
    
    @staticmethod
    def get_api_providers():
        """Aktif API sağlayıcılarını döndür"""
        providers = {}
        
        if Config.TWITTER_BEARER_TOKEN:
            providers["twitter"] = {
                "enabled": True,
                "api_key": Config.TWITTER_API_KEY,
                "api_secret": Config.TWITTER_API_SECRET,
                "bearer_token": Config.TWITTER_BEARER_TOKEN
            }
        
        if Config.META_ACCESS_TOKEN:
            providers["meta"] = {
                "enabled": True,
                "access_token": Config.META_ACCESS_TOKEN,
                "business_account_id": Config.META_BUSINESS_ACCOUNT_ID
            }
        
        if Config.YOUTUBE_API_KEY:
            providers["youtube"] = {
                "enabled": True,
                "api_key": Config.YOUTUBE_API_KEY,
                "channel_id": Config.YOUTUBE_CHANNEL_ID
            }
        
        if Config.TIKTOK_API_KEY:
            providers["tiktok"] = {
                "enabled": True,
                "api_key": Config.TIKTOK_API_KEY,
                "secret": Config.TIKTOK_SECRET
            }
        
        if Config.SCRAPING_ENABLED:
            providers["web"] = {
                "enabled": True,
                "headless": Config.SELENIUM_HEADLESS,
                "timeout": Config.SCRAPE_TIMEOUT
            }
        
        return providers

class DevelopmentConfig(Config):
    """Geliştirme Konfigürasyonu"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Üretim Konfigürasyonu"""
    DEBUG = False
    TESTING = False
    FLASK_ENV = "production"

class TestingConfig(Config):
    """Test Konfigürasyonu"""
    TESTING = True
    DEBUG = True

def get_config(env=None):
    """Ortama göre konfigürasyon döndür"""
    env = env or os.getenv("FLASK_ENV", "development")
    
    configs = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig
    }
    
    return configs.get(env, DevelopmentConfig)
