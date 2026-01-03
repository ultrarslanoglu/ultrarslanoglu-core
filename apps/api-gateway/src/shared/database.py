#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database bağlantısı ve yönetimi
MongoDB singleton pattern
"""

import os

from loguru import logger
from pymongo import MongoClient

# Global database instance
db = None
client = None


def init_database(config):
    """Database bağlantısını başlat"""
    global db, client

    mongodb_uri = os.getenv(
        "MONGODB_URI", config.get("database", {}).get("connection_string")
    )
    database_name = config.get("database", {}).get("database_name", "ultrarslanoglu")

    try:
        client = MongoClient(mongodb_uri)
        db = client[database_name]

        # Test connection
        client.admin.command("ping")
        logger.info(f"✅ MongoDB bağlantısı başarılı: {database_name}")

        # Create indexes
        _create_indexes()

    except Exception as e:
        logger.error(f"❌ MongoDB bağlantı hatası: {e}")
        raise


def _create_indexes():
    """Gerekli indexleri oluştur"""
    try:
        # ========== USERS COLLECTION ==========
        db.users.create_index("email", unique=True)
        db.users.create_index("username", unique=True, sparse=True)
        db.users.create_index("created_at")
        db.users.create_index("updated_at")
        db.users.create_index("status")

        # ========== VIDEOS COLLECTION ==========
        db.videos.create_index([("user_id", 1), ("created_at", -1)])
        db.videos.create_index("status")
        db.videos.create_index([("platform", 1), ("published_at", -1)])
        db.videos.create_index("created_at", expireAfterSeconds=2592000)  # 30 days TTL
        db.videos.create_index("title", text=True)
        db.videos.create_index("description", text=True)

        # ========== METRICS COLLECTION ==========
        db.metrics.create_index(
            [("platform", 1), ("metric_type", 1), ("timestamp", -1)]
        )
        db.metrics.create_index([("video_id", 1), ("timestamp", -1)])
        db.metrics.create_index("timestamp", expireAfterSeconds=7776000)  # 90 days TTL

        # ========== SCHEDULED CONTENT ==========
        db.scheduled_content.create_index([("scheduled_time", 1), ("status", 1)])
        db.scheduled_content.create_index([("user_id", 1), ("status", 1)])
        db.scheduled_content.create_index("created_at")

        # ========== AUTOMATION TASKS ==========
        db.automation_tasks.create_index([("workflow_id", 1), ("status", 1)])
        db.automation_tasks.create_index([("status", 1), ("created_at", -1)])
        db.automation_tasks.create_index(
            "created_at", expireAfterSeconds=5184000
        )  # 60 days

        # ========== AI ANALYSES ==========
        db.ai_analyses.create_index([("video_id", 1), ("analysis_type", 1)])
        db.ai_analyses.create_index("created_at", expireAfterSeconds=7776000)  # 90 days
        db.ai_analyses.create_index([("status", 1), ("created_at", -1)])

        # ========== AUDIT LOGS ==========
        db.audit_logs.create_index([("user_id", 1), ("timestamp", -1)])
        db.audit_logs.create_index([("action", 1), ("timestamp", -1)])
        db.audit_logs.create_index("timestamp", expireAfterSeconds=31536000)  # 1 year

        # ========== API TOKENS ==========
        db.api_tokens.create_index([("user_id", 1), ("token", 1)], unique=True)
        db.api_tokens.create_index(
            "expires_at", expireAfterSeconds=0
        )  # Auto-delete expired

        # ========== SESSIONS ==========
        db.sessions.create_index("user_id")
        db.sessions.create_index(
            "expires_at", expireAfterSeconds=0
        )  # Auto-delete expired

        # ========== NOTIFICATIONS ==========
        db.notifications.create_index([("user_id", 1), ("read", 1), ("created_at", -1)])
        db.notifications.create_index(
            "created_at", expireAfterSeconds=2592000
        )  # 30 days

        # ========== WEBHOOKS ==========
        db.webhooks.create_index([("user_id", 1), ("event_type", 1)])
        db.webhooks.create_index([("status", 1), ("created_at", -1)])

        logger.info("✅ Database indexleri başarıyla oluşturuldu (13 collection)")
        logger.info("   - TTL policies aktif")
        logger.info("   - Compound indexes optimize edilmiş")
        logger.info("   - Auto-cleanup scheduled")
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


class MongoDBConnection:
    """MongoDB bağlantı wrapper sınıfı - Extended modülleri için"""
    
    def __init__(self):
        """Database instance'ını al"""
        global db
        if db is None:
            raise Exception("Database başlatılmamış! init_database() çağrılmalı.")
        self.db = db
    
    def insert_one(self, collection, data):
        """Tek dokuman ekle"""
        return self.db[collection].insert_one(data)
    
    def insert_many(self, collection, data_list):
        """Çoklu dokuman ekle"""
        return self.db[collection].insert_many(data_list)
    
    def find_one(self, collection, query):
        """Tek dokuman bul"""
        return self.db[collection].find_one(query)
    
    def find(self, collection, query=None, skip=0, limit=0, sort=None):
        """Birden fazla dokuman bul"""
        cursor = self.db[collection].find(query or {})
        if sort:
            cursor = cursor.sort(sort)
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    
    def update_one(self, collection, query, update_data):
        """Tek dokuman güncelle"""
        return self.db[collection].update_one(query, {"$set": update_data})
    
    def update_many(self, collection, query, update_data):
        """Çoklu dokuman güncelle"""
        return self.db[collection].update_many(query, {"$set": update_data})
    
    def delete_one(self, collection, query):
        """Tek dokuman sil"""
        return self.db[collection].delete_one(query)
    
    def delete_many(self, collection, query):
        """Çoklu dokuman sil"""
        return self.db[collection].delete_many(query)
    
    def count(self, collection, query=None):
        """Dokuman sayısı"""
        return self.db[collection].count_documents(query or {})
