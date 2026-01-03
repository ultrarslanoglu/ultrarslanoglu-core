#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Content Scheduler Modülü
İçerik planlama ve zamanlama
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime
from ..shared.celery_app import celery
from ..shared.database import db

scheduler_bp = Blueprint('scheduler', __name__)


@celery.task
def publish_scheduled_content(content_id):
    """Zamanlanmış içeriği yayınla"""
    logger.info(f"📅 Publishing content: {content_id}")
    return {"content_id": content_id, "status": "published"}


@scheduler_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({"module": "scheduler", "status": "healthy"})


@scheduler_bp.route('/schedule', methods=['POST'])
def schedule_content():
    """İçerik zamanla"""
    data = request.json
    content = data.get('content')
    scheduled_time = data.get('scheduled_time')
    platforms = data.get('platforms', [])
    
    try:
        schedule_doc = {
            "content": content,
            "scheduled_time": datetime.fromisoformat(scheduled_time),
            "platforms": platforms,
            "status": "scheduled",
            "created_at": datetime.utcnow()
        }
        schedule_id = db.scheduled_content.insert_one(schedule_doc).inserted_id
        
        return jsonify({"success": True, "schedule_id": str(schedule_id)}), 201
    except Exception as e:
        logger.error(f"Schedule content error: {e}")
        return jsonify({"error": str(e)}), 500


@scheduler_bp.route('/schedule', methods=['GET'])
def list_scheduled():
    """Zamanlanmış içerikleri listele"""
    status = request.args.get('status', 'scheduled')
    limit = int(request.args.get('limit', 50))
    
    try:
        scheduled = list(db.scheduled_content.find({"status": status}).limit(limit))
        
        for item in scheduled:
            item['_id'] = str(item['_id'])
        
        return jsonify({"success": True, "scheduled": scheduled})
    except Exception as e:
        logger.error(f"List scheduled error: {e}")
        return jsonify({"error": str(e)}), 500


@scheduler_bp.route('/calendar', methods=['GET'])
def get_calendar():
    """İçerik takvimini getir"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        query = {}
        if start_date and end_date:
            query['scheduled_time'] = {
                '$gte': datetime.fromisoformat(start_date),
                '$lte': datetime.fromisoformat(end_date)
            }
        
        calendar = list(db.scheduled_content.find(query))
        
        for item in calendar:
            item['_id'] = str(item['_id'])
        
        return jsonify({"success": True, "calendar": calendar})
    except Exception as e:
        logger.error(f"Get calendar error: {e}")
        return jsonify({"error": str(e)}), 500
