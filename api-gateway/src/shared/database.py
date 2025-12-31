#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database bağlantısı ve yönetimi
MongoDB singleton pattern
"""

import os
from pymongo import MongoClient
from loguru import logger

# Global database instance
db = None
client = None


def init_database(config):
    """Database bağlantısını başlat"""
    global db, client
    
    mongodb_uri = os.getenv('MONGODB_URI', config.get('database', {}).get('connection_string'))
    database_name = config.get('database', {}).get('database_name', 'ultrarslanoglu')
    
    try:
        client = MongoClient(mongodb_uri)
        db = client[database_name]
        
        # Test connection
        client.admin.command('ping')
        logger.info(f"✅ MongoDB bağlantısı başarılı: {database_name}")
        
        # Create indexes
        _create_indexes()
        
    except Exception as e:
        logger.error(f"❌ MongoDB bağlantı hatası: {e}")
        raise


def _create_indexes():
    """Gerekli indexleri oluştur"""
    try:
        # Videos collection
        db.videos.create_index("status")
        db.videos.create_index("created_at")
        
        # Metrics collection
        db.metrics.create_index([("platform", 1), ("metric_type", 1)])
        db.metrics.create_index("created_at")
        
        # Scheduled content
        db.scheduled_content.create_index("scheduled_time")
        db.scheduled_content.create_index("status")
        
        logger.info("✅ Database indexleri oluşturuldu")
    except Exception as e:
        logger.warning(f"⚠️ Index oluşturma uyarısı: {e}")


def get_db():
    """Database instance'ını döndür"""
    if db is None:
        raise Exception("Database başlatılmamış! init_database() çağrılmalı.")
    return db


def close_database():
    """Database bağlantısını kapat"""
    global client
    if client:
        client.close()
        logger.info("🔌 MongoDB bağlantısı kapatıldı")
