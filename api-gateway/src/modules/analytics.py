#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analytics Modülü
Veri analizi ve içgörü üretimi
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime, timedelta
from ..shared.database import db
from ..shared.github_models import GitHubModelsClient

analytics_bp = Blueprint('analytics', __name__)
ai_client = GitHubModelsClient()


@analytics_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({"module": "analytics", "status": "healthy"})


@analytics_bp.route('/metrics', methods=['POST'])
def save_metric():
    """Metrik kaydet"""
    data = request.json
    
    try:
        data['created_at'] = datetime.utcnow()
        metric_id = db.metrics.insert_one(data).inserted_id
        return jsonify({"success": True, "metric_id": str(metric_id)}), 201
    except Exception as e:
        logger.error(f"Metrik kaydetme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@analytics_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Metrikleri getir"""
    platform = request.args.get('platform')
    metric_type = request.args.get('metric_type')
    limit = int(request.args.get('limit', 100))
    days = int(request.args.get('days', 7))
    
    try:
        query = {}
        if platform:
            query['platform'] = platform
        if metric_type:
            query['metric_type'] = metric_type
        
        # Date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        query['created_at'] = {'$gte': start_date, '$lte': end_date}
        
        metrics = list(db.metrics.find(query).limit(limit))
        
        # ObjectId'leri string'e çevir
        for metric in metrics:
            metric['_id'] = str(metric['_id'])
        
        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        logger.error(f"Metrik getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@analytics_bp.route('/insights/generate', methods=['POST'])
def generate_insights():
    """AI ile içgörü üret"""
    data = request.json
    data_summary = data.get('data_summary', {})
    insight_type = data.get('insight_type', 'general')
    
    try:
        insights = ai_client.generate_insights(data_summary, insight_type)
        
        # İçgörüleri kaydet
        for insight in insights:
            db.insights.insert_one({
                "insight_type": insight_type,
                "title": insight.get('title'),
                "description": insight.get('description'),
                "priority": insight.get('priority', 'medium'),
                "action": insight.get('action'),
                "created_at": datetime.utcnow()
            })
        
        return jsonify({"success": True, "insights": insights})
    except Exception as e:
        logger.error(f"İçgörü üretme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@analytics_bp.route('/reports', methods=['POST'])
def create_report():
    """Rapor oluştur"""
    data = request.json
    
    try:
        data['created_at'] = datetime.utcnow()
        data['status'] = 'draft'
        report_id = db.reports.insert_one(data).inserted_id
        return jsonify({"success": True, "report_id": str(report_id)}), 201
    except Exception as e:
        logger.error(f"Rapor oluşturma hatası: {e}")
        return jsonify({"error": str(e)}), 500


@analytics_bp.route('/dashboards', methods=['POST'])
def create_dashboard():
    """Dashboard oluştur"""
    data = request.json
    
    try:
        data['created_at'] = datetime.utcnow()
        dashboard_id = db.dashboards.insert_one(data).inserted_id
        return jsonify({"success": True, "dashboard_id": str(dashboard_id)}), 201
    except Exception as e:
        logger.error(f"Dashboard oluşturma hatası: {e}")
        return jsonify({"error": str(e)}), 500
