#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GS Analytics Dashboard - Main Flask Application
Streamlit dashboard ile entegre veri analiz platformu
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from loguru import logger
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Kendi modüllerimiz
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'kaynak'))

from kaynak.database import get_database
from kaynak.github_models import get_github_models_client

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# Loglama
os.makedirs("logs", exist_ok=True)
logger.add("logs/gs_analytics.log", rotation="500 MB")
logger.info("📊 GS Analytics Dashboard başlatılıyor...")

# Singletonlar
db = get_database()
ai_client = get_github_models_client()


def load_config():
    """Konfigürasyon dosyasını yükle"""
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def setup_logging(config):
    """Logging'i ayarla"""
    log_config = config.get('logging', {})
    logging.basicConfig(
        level=log_config.get('level', 'info').upper(),
        format=log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    )
    return logging.getLogger(__name__)


@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "service": "GS Analytics Dashboard",
        "version": "1.0.0",
        "github_models": "connected" if ai_client.client else "not_configured",
        "mongodb": "connected" if db else "not_configured"
    })


@app.route('/api/metrics', methods=['POST'])
def save_metric():
    """Metrik kaydet"""
    data = request.json
    
    try:
        metric_id = db.save_metric(data)
        return jsonify({"success": True, "metric_id": metric_id}), 201
    except Exception as e:
        logger.error(f"Metrik kaydetme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Metrikleri getir"""
    platform = request.args.get('platform')
    metric_type = request.args.get('metric_type')
    limit = int(request.args.get('limit', 100))
    
    # Date range
    days_back = int(request.args.get('days', 7))
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    
    try:
        metrics = db.get_metrics(
            platform=platform,
            metric_type=metric_type,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        logger.error(f"Metrik getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports', methods=['POST'])
def create_report():
    """Rapor oluştur"""
    data = request.json
    
    try:
        report_id = db.create_report(data)
        return jsonify({"success": True, "report_id": report_id}), 201
    except Exception as e:
        logger.error(f"Rapor oluşturma hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """Rapor getir"""
    try:
        report = db.get_report(report_id)
        if report:
            return jsonify({"success": True, "report": report})
        else:
            return jsonify({"error": "Rapor bulunamadı"}), 404
    except Exception as e:
        logger.error(f"Rapor getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/dashboards', methods=['POST'])
def create_dashboard():
    """Dashboard oluştur"""
    data = request.json
    
    try:
        dashboard_id = db.create_dashboard(data)
        return jsonify({"success": True, "dashboard_id": dashboard_id}), 201
    except Exception as e:
        logger.error(f"Dashboard oluşturma hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/dashboards/<dashboard_id>', methods=['GET'])
def get_dashboard(dashboard_id):
    """Dashboard getir"""
    try:
        dashboard = db.get_dashboard(dashboard_id)
        if dashboard:
            return jsonify({"success": True, "dashboard": dashboard})
        else:
            return jsonify({"error": "Dashboard bulunamadı"}), 404
    except Exception as e:
        logger.error(f"Dashboard getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/insights/generate', methods=['POST'])
def generate_insights():
    """AI ile içgörü üret"""
    data = request.json
    data_summary = data.get('data_summary', {})
    insight_type = data.get('insight_type', 'general')
    
    try:
        insights = ai_client.generate_insights(data_summary, insight_type)
        
        if insights:
            # İçgörüleri veritabanına kaydet
            for insight in insights:
                db.save_insight({
                    "insight_type": insight_type,
                    "title": insight.get('title'),
                    "description": insight.get('description'),
                    "priority": insight.get('priority', 'medium'),
                    "action": insight.get('action')
                })
            
            return jsonify({"success": True, "insights": insights})
        else:
            return jsonify({"error": "İçgörü üretilemedi"}), 500
    except Exception as e:
        logger.error(f"İçgörü üretme hatası: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/insights', methods=['GET'])
def get_insights():
    """İçgörüleri getir"""
    insight_type = request.args.get('type')
    priority = request.args.get('priority')
    limit = int(request.args.get('limit', 50))
    
    try:
        insights = db.get_insights(insight_type, priority, limit)
        return jsonify({"success": True, "insights": insights})
    except Exception as e:
        logger.error(f"İçgörü getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500


def main():
    """Ana fonksiyon"""
    config = load_config()
    setup_logging(config)
    
    port = int(os.getenv('PORT', config['app']['port']))
    debug = config['app'].get('debug', False)
    
    logger.info(f"🚀 {config['app']['name']} v{config['app']['version']} başlatıldı")
    logger.info(f"🌐 Flask API Port: {port}")
    logger.info(f"📊 Streamlit Dashboard: http://localhost:8501")
    logger.info(f"🔌 GitHub Models: {'✅ Aktif' if ai_client.client else '⚠️ Yapılandırılmamış'}")
    logger.info(f"🗄️ MongoDB: {'✅ Bağlı' if db else '⚠️ Yapılandırılmamış'}")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

if __name__ == '__main__':
    main()