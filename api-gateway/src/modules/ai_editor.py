#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI Editor Modülü
GitHub Models destekli yapay zeka video editörü
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime
from ..shared.database import db
from ..shared.github_models import GitHubModelsClient

ai_editor_bp = Blueprint('ai_editor', __name__)
ai_client = GitHubModelsClient()


@ai_editor_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({
        "module": "ai_editor",
        "status": "healthy",
        "github_models": "connected" if ai_client.client else "not_configured"
    })


@ai_editor_bp.route('/analyze', methods=['POST'])
def analyze_video():
    """Video içeriğini AI ile analiz et"""
    data = request.json
    video_id = data.get('video_id')
    
    if not video_id:
        return jsonify({"error": "video_id gerekli"}), 400
    
    try:
        # Video bilgilerini al
        from bson.objectid import ObjectId
        video = db.videos.find_one({"_id": ObjectId(video_id)})
        
        if not video:
            return jsonify({"error": "Video bulunamadı"}), 404
        
        # AI analizi yap
        analysis = ai_client.analyze_video_content(video)
        
        # Analiz sonuçlarını kaydet
        db.ai_analyses.insert_one({
            "video_id": video_id,
            "analysis": analysis,
            "created_at": datetime.utcnow()
        })
        
        return jsonify({"success": True, "analysis": analysis})
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500


@ai_editor_bp.route('/suggest-edits', methods=['POST'])
def suggest_edits():
    """AI ile düzenleme önerileri üret"""
    data = request.json
    video_id = data.get('video_id')
    edit_type = data.get('edit_type', 'highlight')
    
    try:
        suggestions = ai_client.generate_edit_suggestions(video_id, edit_type)
        return jsonify({"success": True, "suggestions": suggestions})
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        return jsonify({"error": str(e)}), 500


@ai_editor_bp.route('/auto-edit', methods=['POST'])
def auto_edit():
    """Otomatik video düzenleme"""
    data = request.json
    video_id = data.get('video_id')
    style = data.get('style', 'dynamic')
    
    try:
        result = ai_client.auto_edit_video(video_id, style)
        return jsonify({"success": True, "result": result})
    except Exception as e:
        logger.error(f"Auto-edit error: {e}")
        return jsonify({"error": str(e)}), 500


@ai_editor_bp.route('/generate-caption', methods=['POST'])
def generate_caption():
    """AI ile altyazı oluştur"""
    data = request.json
    video_id = data.get('video_id')
    language = data.get('language', 'tr')
    
    try:
        captions = ai_client.generate_captions(video_id, language)
        return jsonify({"success": True, "captions": captions})
    except Exception as e:
        logger.error(f"Caption error: {e}")
        return jsonify({"error": str(e)}), 500
