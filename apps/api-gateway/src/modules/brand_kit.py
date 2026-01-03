#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Brand Kit Modülü
Marka kimliği ve şablonlar
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime
from ..shared import database

brand_kit_bp = Blueprint('brand_kit', __name__)


@brand_kit_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({"module": "brand_kit", "status": "healthy"})


@brand_kit_bp.route('/templates', methods=['GET'])
def list_templates():
    """Şablonları listele"""
    category = request.args.get('category')
    
    try:
        query = {}
        if category:
            query['category'] = category
        
        templates = list(db.brand_templates.find(query))
        
        for template in templates:
            template['_id'] = str(template['_id'])
        
        return jsonify({"success": True, "templates": templates})
    except Exception as e:
        logger.error(f"List templates error: {e}")
        return jsonify({"error": str(e)}), 500


@brand_kit_bp.route('/templates', methods=['POST'])
def create_template():
    """Şablon oluştur"""
    data = request.json
    
    try:
        data['created_at'] = datetime.utcnow()
        template_id = db.brand_templates.insert_one(data).inserted_id
        return jsonify({"success": True, "template_id": str(template_id)}), 201
    except Exception as e:
        logger.error(f"Create template error: {e}")
        return jsonify({"error": str(e)}), 500


@brand_kit_bp.route('/colors', methods=['GET'])
def get_colors():
    """Marka renklerini getir"""
    return jsonify({
        "success": True,
        "colors": {
            "primary": {
                "yellow": "#FFD700",
                "red": "#C8102E"
            },
            "secondary": {
                "black": "#000000",
                "white": "#FFFFFF"
            }
        }
    })


@brand_kit_bp.route('/fonts', methods=['GET'])
def get_fonts():
    """Marka fontlarını getir"""
    return jsonify({
        "success": True,
        "fonts": {
            "primary": "Montserrat",
            "secondary": "Roboto",
            "weights": [400, 600, 700, 900]
        }
    })
