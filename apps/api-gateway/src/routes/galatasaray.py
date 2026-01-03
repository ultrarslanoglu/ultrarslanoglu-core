"""
Galatasaray Research API Routes
Endpoints for accessing and managing global supporters research data
"""

import json
import os
from datetime import datetime

from flask import Blueprint, jsonify, request

galatasaray_bp = Blueprint("galatasaray", __name__, url_prefix="/api/v1/galatasaray")

# Import research database
try:
    from src.galatasaray_research_db import GalatasarayResearchDB

    db_available = True
except ImportError:
    db_available = False


@galatasaray_bp.route("/health", methods=["GET"])
def health_check():
    """Health check for Galatasaray research service"""
    return jsonify(
        {
            "status": "healthy",
            "service": "Galatasaray Global Supporters Research",
            "timestamp": datetime.now().isoformat(),
            "database": "connected" if db_available else "unavailable",
        }
    ), 200


@galatasaray_bp.route("/research/overview", methods=["GET"])
def get_research_overview():
    """Get global research overview and statistics"""
    try:
        # Load research data
        base_path = os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        research_file = os.path.join(
            base_path, "docs/galatasaray-research-complete-data.json"
        )

        if os.path.exists(research_file):
            with open(research_file, "r", encoding="utf-8") as f:
                research_data = json.load(f)

            return jsonify(
                {
                    "status": "success",
                    "data": research_data,
                    "timestamp": datetime.now().isoformat(),
                }
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Research data file not found"}
            ), 404

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/supporters/stats", methods=["GET"])
def get_supporters_stats():
    """Get supporter statistics from database"""
    if not db_available:
        return jsonify({"status": "error", "message": "Database not available"}), 503

    try:
        db = GalatasarayResearchDB()
        stats = db.get_global_statistics()

        # Convert datetime to string for JSON serialization
        stats_dict = {
            "status": "success",
            "total_supporters": stats["total_supporters"],
            "total_clubs": stats["total_clubs"],
            "country_distribution": stats["country_distribution"],
            "engagement_distribution": stats["engagement_distribution"],
            "supporter_type_distribution": stats["supporter_type_distribution"],
            "timestamp": datetime.now().isoformat(),
        }

        db.close()
        return jsonify(stats_dict), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/supporters/by-country/<country>", methods=["GET"])
def get_supporters_by_country(country):
    """Get supporters from a specific country"""
    if not db_available:
        return jsonify({"status": "error", "message": "Database not available"}), 503

    try:
        db = GalatasarayResearchDB()
        supporters = db.get_supporters_by_country(country)

        # Convert ObjectId to string for JSON serialization
        supporters_list = []
        for supporter in supporters:
            supporter["_id"] = str(supporter.get("_id", ""))
            supporters_list.append(supporter)

        db.close()

        return jsonify(
            {
                "status": "success",
                "country": country,
                "count": len(supporters),
                "data": supporters_list,
                "timestamp": datetime.now().isoformat(),
            }
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/supporters/add", methods=["POST"])
def add_supporter():
    """Add a new supporter to the database"""
    if not db_available:
        return jsonify({"status": "error", "message": "Database not available"}), 503

    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["name", "age", "gender", "country", "city"]
        if not all(field in data for field in required_fields):
            return jsonify(
                {
                    "status": "error",
                    "message": f"Missing required fields: {required_fields}",
                }
            ), 400

        db = GalatasarayResearchDB()
        supporter_id = db.add_supporter(data)
        db.close()

        return jsonify(
            {
                "status": "success",
                "message": "Supporter added successfully",
                "supporter_id": supporter_id,
                "timestamp": datetime.now().isoformat(),
            }
        ), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/clubs/add", methods=["POST"])
def add_club():
    """Add a new supporter club"""
    if not db_available:
        return jsonify({"status": "error", "message": "Database not available"}), 503

    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["name", "country", "city", "founded_year"]
        if not all(field in data for field in required_fields):
            return jsonify(
                {
                    "status": "error",
                    "message": f"Missing required fields: {required_fields}",
                }
            ), 400

        db = GalatasarayResearchDB()
        club_id = db.add_club(data)
        db.close()

        return jsonify(
            {
                "status": "success",
                "message": "Club added successfully",
                "club_id": club_id,
                "timestamp": datetime.now().isoformat(),
            }
        ), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/report", methods=["GET"])
def get_report():
    """Get comprehensive research report"""
    if not db_available:
        return jsonify({"status": "error", "message": "Database not available"}), 503

    try:
        db = GalatasarayResearchDB()
        report = db.generate_report()
        db.close()

        return jsonify(
            {
                "status": "success",
                "report": report,
                "timestamp": datetime.now().isoformat(),
            }
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@galatasaray_bp.route("/research/phases", methods=["GET"])
def get_research_phases():
    """Get research roadmap phases"""
    return jsonify(
        {
            "status": "success",
            "phases": [
                {
                    "phase": 1,
                    "name": "Data Collection",
                    "timeline": "January - March 2026",
                    "status": "In Progress",
                },
                {
                    "phase": 2,
                    "name": "Data Processing",
                    "timeline": "April - May 2026",
                    "status": "Scheduled",
                },
                {
                    "phase": 3,
                    "name": "Database Creation",
                    "timeline": "June 2026",
                    "status": "Scheduled",
                },
                {
                    "phase": 4,
                    "name": "Analysis & Insights",
                    "timeline": "July 2026",
                    "status": "Scheduled",
                },
            ],
            "timestamp": datetime.now().isoformat(),
        }
    ), 200


@galatasaray_bp.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404


@galatasaray_bp.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({"status": "error", "message": "Internal server error"}), 500
