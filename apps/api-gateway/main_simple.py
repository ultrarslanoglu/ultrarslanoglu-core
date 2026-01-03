#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ultrarslanoglu API Gateway - Minimal Development Version
Simplified for initial testing
"""

import os
import sys

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from loguru import logger

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

# Environment variables
load_dotenv()

# Flask app
app = Flask(__name__)
CORS(app)

# Register blueprints
try:
    from routes.galatasaray import galatasaray_bp

    app.register_blueprint(galatasaray_bp)
    logger.info("✅ Galatasaray research blueprint registered")
except ImportError as e:
    logger.warning(f"⚠️  Could not import Galatasaray blueprint: {e}")

# Loglama
os.makedirs("logs", exist_ok=True)
logger.add("logs/api_gateway.log", rotation="500 MB")
logger.info("🚀 Ultrarslanoglu API Gateway başlatılıyor...")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify(
        {
            "success": True,
            "status": "healthy",
            "service": "ultrarslanoglu-api-gateway",
            "version": "3.0.0",
            "environment": os.getenv("FLASK_ENV", "development"),
            "components": {
                "mongodb": "connected",
                "redis": "connected",
                "api": "running",
            },
        }
    ), 200


@app.route("/api/status", methods=["GET"])
def status():
    """API status endpoint"""
    return jsonify(
        {
            "success": True,
            "message": "API Gateway çalışıyor",
            "available_modules": [
                "auth",
                "video",
                "ai-editor",
                "analytics",
                "automation",
                "brand-kit",
                "scheduler",
                "iot",
                "galatasaray-research",
            ],
        }
    ), 200


@app.route("/api/modules", methods=["GET"])
def modules():
    """List all available modules and endpoints"""
    return jsonify(
        {
            "success": True,
            "modules": {
                "galatasaray": {
                    "base_url": "/api/v1/galatasaray",
                    "description": "Galatasaray Global Supporters Research API",
                    "endpoints": [
                        "/health",
                        "/research/overview",
                        "/supporters/stats",
                        "/supporters/by-country/<country>",
                        "/supporters/add [POST]",
                        "/clubs/add [POST]",
                        "/report",
                        "/research/phases",
                    ],
                }
            },
        }
    ), 200


@app.route("/", methods=["GET"])
def index():
    """Root endpoint"""
    return jsonify(
        {
            "success": True,
            "message": "Ultrarslanoglu API Gateway",
            "version": "3.0.0",
            "docs": "/api/status",
            "health": "/health",
        }
    ), 200


if __name__ == "__main__":
    logger.info("✅ API Gateway hazır")

    # Development server
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=os.getenv("FLASK_DEBUG", "1") == "1",
    )
