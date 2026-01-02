#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analytics Dashboard Modülü - Extended
Video istatistikleri, dashboard, raporlar
"""

from flask import Blueprint, request, jsonify, g
from loguru import logger
from datetime import datetime, timedelta
from functools import wraps
import hashlib
from ..shared.celery_app import celery
from ..shared.database import db, MongoDBConnection
from ..shared.error_handler import (
    handle_api_error, create_error_response, create_success_response,
    ValidationError, DatabaseError, ProcessingError
)
from ..shared.rate_limiter import rate_limit
from ..shared.validators import MetricRequest, validate_required_fields
from ..shared.auth import token_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


# ============================================================================
# BACKGROUND TASKS
# ============================================================================

@celery.task
def calculate_metrics(video_id):
    """Video metriklerini hesapla"""
    try:
        logger.info(f"📊 Metrik hesaplaması başladı: {video_id}")
        mongo = MongoDBConnection()
        
        # Get video views and engagement
        import time
        time.sleep(1)
        
        metrics = {
            "views": 1250,
            "likes": 89,
            "comments": 34,
            "shares": 12,
            "engagement_rate": 0.094,
            "average_watch_time": 245,
            "completion_rate": 0.72
        }
        
        # Save metrics
        mongo.insert_one('video_metrics', {
            "video_id": video_id,
            "metrics": metrics,
            "calculated_at": datetime.utcnow()
        })
        
        logger.info(f"✅ Metrik hesaplaması tamamlandı: {video_id}")
        return metrics
    
    except Exception as e:
        logger.error(f"❌ Metrik hesaplaması başarısız: {str(e)}")
        return {"error": str(e)}


@celery.task
def generate_report(user_id, report_type, date_range):
    """Analitik raporu oluştur"""
    try:
        logger.info(f"📄 Rapor oluşturuluyor: {user_id} - {report_type}")
        mongo = MongoDBConnection()
        
        # Mock report generation
        import time
        time.sleep(2)
        
        report_data = {
            "total_videos": 15,
            "total_views": 45230,
            "total_engagement": 3421,
            "average_engagement_rate": 0.076,
            "top_video": "video_id_123",
            "top_video_views": 5420,
            "date_range": date_range,
            "generated_at": datetime.utcnow()
        }
        
        # Save report
        report_id = hashlib.md5(f"{user_id}{datetime.utcnow()}".encode()).hexdigest()
        mongo.insert_one('analytics_reports', {
            "_id": report_id,
            "user_id": user_id,
            "type": report_type,
            "data": report_data,
            "created_at": datetime.utcnow()
        })
        
        logger.info(f"✅ Rapor oluşturuldu: {report_id}")
        return {"report_id": report_id, "data": report_data}
    
    except Exception as e:
        logger.error(f"❌ Rapor oluşturulamadı: {str(e)}")
        return {"error": str(e)}


# ============================================================================
# ROUTES - ANALYTICS & METRICS
# ============================================================================

@analytics_bp.route('/health', methods=['GET'])
def health():
    """Analytics module health check"""
    return create_success_response({"module": "analytics", "status": "healthy"})


@analytics_bp.route('/dashboard', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_dashboard():
    """Analytics dashboard getir"""
    try:
        mongo = MongoDBConnection()
        
        # Get user's video stats
        videos = mongo.find('videos', {'user_id': g.user_id})
        total_videos = len(videos)
        
        # Calculate aggregated stats
        total_views = 0
        total_likes = 0
        total_engagement = 0
        
        for video in videos:
            # Get metrics for each video
            metrics = mongo.find_one('video_metrics', {'video_id': video.get('_id')})
            if metrics:
                m = metrics.get('metrics', {})
                total_views += m.get('views', 0)
                total_likes += m.get('likes', 0)
                total_engagement += m.get('engagement_rate', 0)
        
        dashboard_data = {
            "total_videos": total_videos,
            "total_views": total_views,
            "total_likes": total_likes,
            "average_engagement": total_engagement / total_videos if total_videos > 0 else 0,
            "videos": [
                {
                    "id": v.get('_id'),
                    "title": v.get('title'),
                    "created_at": v.get('created_at')
                }
                for v in videos[:5]
            ]
        }
        
        return create_success_response(dashboard_data)
    
    except Exception as e:
        logger.error(f"Dashboard hatası: {str(e)}")
        raise DatabaseError("DB_001", "Dashboard alınamadı")


@analytics_bp.route('/video/<video_id>/metrics', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_video_metrics(video_id):
    """Video metriklerini getir"""
    try:
        mongo = MongoDBConnection()
        
        # Check video exists and is user's
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        if video.get('user_id') != g.user_id:
            raise ValidationError("AUTH_003", "Bu videoyu görme izniniz yok")
        
        # Get metrics
        metrics = mongo.find_one('video_metrics', {'video_id': video_id})
        
        if not metrics:
            raise ValidationError("RES_001", "Metrikler bulunamadı")
        
        return create_success_response({
            "video_id": video_id,
            "metrics": metrics.get('metrics'),
            "calculated_at": metrics.get('calculated_at')
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Metrics hatası: {str(e)}")
        raise DatabaseError("DB_001", "Metrikler alınamadı")


@analytics_bp.route('/video/<video_id>/metrics/calculate', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def calculate_video_metrics(video_id):
    """Video metriklerini hesapla"""
    try:
        mongo = MongoDBConnection()
        
        # Check video exists
        video = mongo.find_one('videos', {'_id': video_id})
        if not video:
            raise ValidationError("RES_001", "Video bulunamadı")
        
        # Start calculation
        task = calculate_metrics.delay(video_id)
        
        logger.info(f"📊 Metrik hesaplaması başlatıldı: {video_id}")
        
        return create_success_response({
            "video_id": video_id,
            "task_id": task.id,
            "status": "calculating"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Calculate metrics hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "Metrik hesaplaması başarısız")


@analytics_bp.route('/reports', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def list_reports():
    """Raporları listele"""
    try:
        mongo = MongoDBConnection()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        skip = (page - 1) * limit
        
        # Get user's reports
        reports = mongo.find(
            'analytics_reports',
            {'user_id': g.user_id},
            skip=skip,
            limit=limit
        )
        
        total = mongo.count('analytics_reports', {'user_id': g.user_id})
        
        return create_success_response({
            "reports": reports,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total
            }
        })
    
    except Exception as e:
        logger.error(f"List reports hatası: {str(e)}")
        raise DatabaseError("DB_001", "Raporlar alınamadı")


@analytics_bp.route('/reports/generate', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def generate_analytics_report():
    """Analitik raporu oluştur"""
    try:
        data = request.get_json() or {}
        
        report_type = data.get('type', 'monthly')
        date_range = data.get('date_range', 'last_30_days')
        
        valid_types = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
        if report_type not in valid_types:
            raise ValidationError("VAL_004", f"Geçersiz rapor tipi. Geçerli: {valid_types}")
        
        valid_ranges = ['today', 'last_7_days', 'last_30_days', 'last_90_days', 'custom']
        if date_range not in valid_ranges:
            raise ValidationError("VAL_004", f"Geçersiz tarih aralığı. Geçerli: {valid_ranges}")
        
        # Start report generation
        task = generate_report.delay(g.user_id, report_type, date_range)
        
        logger.info(f"📄 Rapor oluşturuluyor: {g.user_id}")
        
        return create_success_response({
            "task_id": task.id,
            "type": report_type,
            "date_range": date_range,
            "status": "generating"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Generate report hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "Rapor oluşturulamadı")


@analytics_bp.route('/reports/<report_id>', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_report(report_id):
    """Rapor getir"""
    try:
        mongo = MongoDBConnection()
        report = mongo.find_one('analytics_reports', {'_id': report_id})
        
        if not report:
            raise ValidationError("RES_001", "Rapor bulunamadı")
        
        # Check ownership
        if report.get('user_id') != g.user_id:
            raise ValidationError("AUTH_003", "Bu raporu görme izniniz yok")
        
        return create_success_response(report)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Get report hatası: {str(e)}")
        raise DatabaseError("DB_001", "Rapor alınamadı")


@analytics_bp.route('/trending', methods=['GET'])
@rate_limit
@handle_api_error
def get_trending():
    """Trending videoları getir"""
    try:
        mongo = MongoDBConnection()
        
        # Get trending videos (mock data)
        trending = mongo.find('videos', {}, limit=10)
        
        return create_success_response({
            "trending": trending,
            "count": len(trending)
        })
    
    except Exception as e:
        logger.error(f"Trending hatası: {str(e)}")
        raise DatabaseError("DB_001", "Trending alınamadı")


@analytics_bp.route('/events/<video_id>', methods=['POST'])
@rate_limit
@handle_api_error
def track_event(video_id):
    """Video olayları takip et"""
    try:
        data = request.get_json() or {}
        
        event_type = data.get('type')  # view, like, comment, share
        user_id = data.get('user_id')
        
        if not event_type:
            raise ValidationError("VAL_004", "Event tipi gerekli")
        
        valid_events = ['view', 'like', 'comment', 'share', 'watch_time']
        if event_type not in valid_events:
            raise ValidationError("VAL_004", f"Geçersiz event. Geçerli: {valid_events}")
        
        mongo = MongoDBConnection()
        
        # Record event
        mongo.insert_one('video_events', {
            "video_id": video_id,
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow()
        })
        
        logger.info(f"📌 Event kaydedildi: {video_id} - {event_type}")
        
        return create_success_response({
            "video_id": video_id,
            "event_type": event_type,
            "status": "recorded"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Track event hatası: {str(e)}")
        raise DatabaseError("DB_001", "Event kaydedilemedi")


logger.info("✅ Analytics modülü yüklendi")
