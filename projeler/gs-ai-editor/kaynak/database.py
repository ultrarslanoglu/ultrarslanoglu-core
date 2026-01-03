#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS AI Editor - MongoDB Veritabanı Modülü
"""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from loguru import logger
import os
from typing import Dict, List, Optional
from datetime import datetime


class Database:
    """MongoDB veritabanı yöneticisi"""
    
    def __init__(self):
        self.uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/gs_ai_editor")
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Veritabanına bağlan"""
        try:
            self.client = MongoClient(self.uri)
            # Test bağlantı
            self.client.admin.command('ping')
            
            # Veritabanını al
            db_name = self.uri.split('/')[-1].split('?')[0]
            self.db = self.client[db_name]
            
            logger.info(f"MongoDB connected: {db_name}")
            self._create_indexes()
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise
    
    def _create_indexes(self):
        """İndeksleri oluştur"""
        # Videos collection indexes
        self.db.videos.create_index("video_id", unique=True)
        self.db.videos.create_index("created_at")
        self.db.videos.create_index("status")
        
        # Edits collection indexes
        self.db.edits.create_index("video_id")
        self.db.edits.create_index("created_at")
        
        logger.info("Database indexes created")
    
    # Video Operations
    def create_video(self, video_data: Dict) -> str:
        """Yeni video kaydı oluştur"""
        video_data["created_at"] = datetime.utcnow()
        video_data["updated_at"] = datetime.utcnow()
        video_data["status"] = "uploaded"
        
        result = self.db.videos.insert_one(video_data)
        logger.info(f"Video created: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_video(self, video_id: str) -> Optional[Dict]:
        """Video bilgisi al"""
        return self.db.videos.find_one({"video_id": video_id})
    
    def update_video(self, video_id: str, updates: Dict) -> bool:
        """Video bilgisi güncelle"""
        updates["updated_at"] = datetime.utcnow()
        result = self.db.videos.update_one(
            {"video_id": video_id},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    def list_videos(self, limit: int = 50, skip: int = 0) -> List[Dict]:
        """Videoları listele"""
        return list(
            self.db.videos
            .find()
            .sort("created_at", -1)
            .limit(limit)
            .skip(skip)
        )
    
    # Edit Operations
    def create_edit(self, edit_data: Dict) -> str:
        """Yeni düzenleme kaydı oluştur"""
        edit_data["created_at"] = datetime.utcnow()
        edit_data["status"] = "pending"
        
        result = self.db.edits.insert_one(edit_data)
        logger.info(f"Edit created: {result.inserted_id}")
        return str(result.inserted_id)
    
    def get_edits_by_video(self, video_id: str) -> List[Dict]:
        """Video için düzenlemeleri getir"""
        return list(
            self.db.edits
            .find({"video_id": video_id})
            .sort("created_at", -1)
        )
    
    def update_edit_status(self, edit_id: str, status: str) -> bool:
        """Düzenleme durumu güncelle"""
        result = self.db.edits.update_one(
            {"_id": edit_id},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        return result.modified_count > 0
    
    # AI Suggestions
    def save_ai_suggestion(self, suggestion_data: Dict) -> str:
        """AI önerisini kaydet"""
        suggestion_data["created_at"] = datetime.utcnow()
        result = self.db.ai_suggestions.insert_one(suggestion_data)
        return str(result.inserted_id)
    
    def get_ai_suggestions(self, video_id: str) -> List[Dict]:
        """Video için AI önerilerini getir"""
        return list(
            self.db.ai_suggestions
            .find({"video_id": video_id})
            .sort("created_at", -1)
        )
    
    def close(self):
        """Veritabanı bağlantısını kapat"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Singleton instance
_db = None

def get_database() -> Database:
    """Database singleton"""
    global _db
    if _db is None:
        _db = Database()
    return _db
