#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Video Pipeline Modülü - Extended
Video işleme, kodlama, dağıtım, analytics
"""

from flask import Blueprint, request, jsonify, g
from loguru import logger
from datetime import datetime, timedelta
from functools import wraps
import os
import hashlib
from ..shared.celery_app import celery
from ..shared.database import db, MongoDBConnection
from ..shared.error_handler import (
    handle_api_error, create_error_response, create_success_response,
    ValidationError, DatabaseError, ProcessingError
)
from ..shared.rate_limiter import rate_limit
from ..shared.validators import VideoUploadRequest, validate_required_fields
from ..shared.auth import token_required

video_bp = Blueprint('video', __name__, url_prefix='/api/video')


# ============================================================================
# BACKGROUND TASKS
# ============================================================================

@celery.task
def process_video(video_id, operations):
    """Video işle (background task)"""
    try:
        logger.info(f"🎬 Video işleme başladı: {video_id}")
        mongo = MongoDBConnection()
        
        # Update video status
        mongo.update_one('videos', {'_id': video_id}, {
            'status': 'processing',
            'started_at': datetime.utcnow()
        })
        
        # Simulate processing
        import time
        time.sleep(2)
        
        # Update completion
        mongo.update_one('videos', {'_id': video_id}, {
            'status': 'completed',
            'completed_at': datetime.utcnow(),
            'operations_applied': operations
        })
        
        logger.info(f"✅ Video işleme tamamlandı: {video_id}")
        return {"video_id": video_id, "status": "completed"}
    except Exception as e:
        logger.error(f"❌ Video işleme başarısız: {str(e)}")
        return {"video_id": video_id, "status": "failed", "error": str(e)}


@celery.task
def transcode_video(video_id, target_format):
    """Video transcode et"""
    try:
        logger.info(f"🔄 Transcode: {video_id} -> {target_format}")
        mongo = MongoDBConnection()
        
        mongo.update_one('videos', {'_id': video_id}, {
            'transcoding': {
                'format': target_format,
                'status': 'in_progress',
                'started_at': datetime.utcnow()
            }
        })
        
        # Simulate transcoding
        import time
        time.sleep(1)
        
        mongo.update_one('videos', {'_id': video_id}, {
            'transcoding': {
                'format': target_format,
                'status': 'completed',
                'completed_at': datetime.utcnow()
            }
        })
        
        return {"video_id": video_id, "format": target_format, "status": "completed"}
    except Exception as e:
        logger.error(f"❌ Transcode başarısız: {str(e)}")
        return {"video_id": video_id, "format": target_format, "status": "failed"}


@celery.task
def generate_thumbnail(video_id, timestamp):
    """Video thumbnail oluştur"""
    try:
        logger.info(f"🖼️ Thumbnail oluşturuluyor: {video_id} at {timestamp}s")
        mongo = MongoDBConnection()
        
        # Simulate thumbnail generation
        import time
        time.sleep(0.5)
        
        thumbnail_url = f"/media/thumbnails/{video_id}_t{timestamp}.jpg"
        mongo.update_one('videos', {'_id': video_id}, {
            'thumbnail': thumbnail_url
        })
        
        return {"video_id": video_id, "thumbnail": thumbnail_url}
    except Exception as e:
        logger.error(f"❌ Thumbnail oluşturulamadı: {str(e)}")
        return {"video_id": video_id, "error": str(e)}


# ============================================================================
# ROUTES - VIDEO MANAGEMENT
# ============================================================================

@video_bp.route('/health', methods=['GET'])
def health():
    """Video module health check"""
    return create_success_response({"module": "video", "status": "healthy"})


@video_bp.route('/upload', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def upload_video():
    """Video yükle"""
    try:
        # Validate file exists
        if 'video' not in request.files:
            raise ValidationError("VAL_004", "Video dosyası gerekli")
        
        file = request.files['video']
        if file.filename == '':
            raise ValidationError("VAL_004", "Dosya seçilmedi")
        
        # Validate metadata
        metadata = request.form.to_dict()
        required = ['title', 'category']
        validate_required_fields(metadata, required)
        
        # Generate video ID
        video_id = hashlib.md5(
            f"{file.filename}{datetime.utcnow()}".encode()
        ).hexdigest()
        
        # Store file info
        file_size = len(file.read())
        file.seek(0)
        
        mongo = MongoDBConnection()
        video_doc = {
            "_id": video_id,
            "filename": file.filename,
            "size": file_size,
            "title": metadata.get('title'),
            "category": metadata.get('category'),
            "description": metadata.get('description', ''),
            "user_id": g.user_id,
            "status": "uploaded",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "processing": []
        }
        
        result = mongo.insert_one('videos', video_doc)
        
        logger.info(f"📹 Video yüklendi: {video_id}")
        
        return create_success_response({
            "video_id": video_id,
            "filename": file.filename,
            "size": file_size,
            "status": "uploaded"
        }, status_code=201)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Upload hatası: {str(e)}")
        raise ProcessingError("FILE_001", "Video yükleme başarısız")


@video_bp.route('/<video_id>/process', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def process_video_request(video_id):
    """Video işle"""
    try:
        data = request.get_json() or {}
        operations = data.get('operations', [])
        
        if not operations:
            raise ValidationError("VAL_004", "Operations listesi gerekli")
        
        mongo = MongoDBConnection()
        
        # Check video exists
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        # Start processing task
        task = process_video.delay(video_id, operations)
        
        logger.info(f"🎬 Video işleme kuyruğa alındı: {video_id}")
        
        return create_success_response({
            "video_id": video_id,
            "task_id": task.id,
            "status": "queued"
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Process hatası: {str(e)}")
        raise ProcessingError("FILE_002", "Video işleme başarısız")


@video_bp.route('/<video_id>/transcode', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def transcode_video_request(video_id):
    """Video transcoding başlat"""
    try:
        data = request.get_json() or {}
        target_format = data.get('format', 'mp4')
        
        valid_formats = ['mp4', 'webm', 'mkv', 'avi']
        if target_format not in valid_formats:
            raise ValidationError("VAL_004", f"Geçersiz format. Geçerli: {valid_formats}")
        
        mongo = MongoDBConnection()
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        # Start transcoding
        task = transcode_video.delay(video_id, target_format)
        
        logger.info(f"🔄 Transcode başlatıldı: {video_id} -> {target_format}")
        
        return create_success_response({
            "video_id": video_id,
            "format": target_format,
            "task_id": task.id,
            "status": "transcoding"
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Transcode hatası: {str(e)}")
        raise ProcessingError("FILE_003", "Transcode başarısız")


@video_bp.route('/<video_id>/thumbnail', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def create_thumbnail(video_id):
    """Thumbnail oluştur"""
    try:
        data = request.get_json() or {}
        timestamp = data.get('timestamp', 0)
        
        if not isinstance(timestamp, (int, float)) or timestamp < 0:
            raise ValidationError("VAL_004", "Geçersiz timestamp")
        
        mongo = MongoDBConnection()
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        # Start thumbnail generation
        task = generate_thumbnail.delay(video_id, timestamp)
        
        return create_success_response({
            "video_id": video_id,
            "timestamp": timestamp,
            "task_id": task.id,
            "status": "generating"
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Thumbnail hatası: {str(e)}")
        raise ProcessingError("FILE_002", "Thumbnail oluşturulamadı")


@video_bp.route('/<video_id>', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_video(video_id):
    """Video bilgisini getir"""
    try:
        mongo = MongoDBConnection()
        video = mongo.find_one('videos', {'_id': video_id})
        
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        # Remove sensitive data
        video.pop('processing', None)
        
        return create_success_response(video)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Get video hatası: {str(e)}")
        raise DatabaseError("DB_001", "Video alınamadı")


@video_bp.route('', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def list_videos():
    """Videoları listele"""
    try:
        mongo = MongoDBConnection()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        skip = (page - 1) * limit
        
        # User's videos only
        query = {'user_id': g.user_id}
        
        videos = mongo.find('videos', query, skip=skip, limit=limit)
        total = mongo.count('videos', query)
        
        return create_success_response({
            "videos": videos,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        })
    
    except Exception as e:
        logger.error(f"List videos hatası: {str(e)}")
        raise DatabaseError("DB_001", "Videolar alınamadı")


@video_bp.route('/<video_id>', methods=['DELETE'])
@token_required
@rate_limit
@handle_api_error
def delete_video(video_id):
    """Video sil"""
    try:
        mongo = MongoDBConnection()
        
        # Check ownership
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        if video.get('user_id') != g.user_id:
            raise ValidationError("AUTH_003", "Bu videoyu silme izniniz yok")
        
        # Delete from DB
        result = mongo.delete_one('videos', {'_id': video_id})
        
        logger.info(f"🗑️ Video silindi: {video_id}")
        
        return create_success_response({
            "video_id": video_id,
            "status": "deleted"
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Delete hatası: {str(e)}")
        raise DatabaseError("DB_003", "Video silinemedi")


@video_bp.route('/<video_id>/status', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_video_status(video_id):
    """Video işleme durumunu getir"""
    try:
        mongo = MongoDBConnection()
        video = mongo.find_one('videos', {'_id': video_id})
        
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        return create_success_response({
            "video_id": video_id,
            "status": video.get('status', 'unknown'),
            "progress": video.get('progress', 0),
            "created_at": video.get('created_at'),
            "started_at": video.get('started_at'),
            "completed_at": video.get('completed_at')
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Status check hatası: {str(e)}")
        raise DatabaseError("DB_001", "Durum alınamadı")


logger.info("✅ Video modülü yüklendi")
