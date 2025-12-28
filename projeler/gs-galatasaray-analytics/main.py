#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Galatasaray Analytics Platform - Main Application
Canlı veri çekme, analiz ve raporlama sistemi
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from loguru import logger
from apscheduler.schedulers.background import BackgroundScheduler

# Configuration
sys.path.insert(0, os.path.dirname(__file__))
from config.config import Config
from src.database.manager import db
from src.database.squad_data import GalatasaraySquad, GalatasarayClub, Position
from src.services.data_collector import DataCollectorOrchestrator
from src.analyzers.analyzer import AnalysisOrchestrator
from src.models.schemas import Platform

# Flask app
app = Flask(__name__)
CORS(app)

# Logging
config = Config()
logger.remove()
logger.add(
    f"{config.LOG_DIR}/galatasaray_analytics.log",
    rotation="500 MB",
    level=config.LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | {message}"
)
logger.add(
    sys.stdout,
    level="INFO",
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}"
)

logger.info("🚀 Galatasaray Analytics Platform başlatıldı")
logger.info(f"📊 Veritabanı Türü: {db.db_type}")
logger.info(f"🔑 API Sağlayıcıları: {list(config.get_api_providers().keys())}")

# Singleton'lar
collector = DataCollectorOrchestrator()
analyzer = AnalysisOrchestrator()

# Scheduler
scheduler = BackgroundScheduler()

# ======================== OYUNCU ROUTES ========================

@app.route('/api/players', methods=['GET'])
def get_players():
    """Tüm oyuncuları getir"""
    try:
        position_filter = request.args.get('position')
        nationality = request.args.get('nationality')
        
        players = GalatasaraySquad.get_players()
        
        # Filtreleme
        if position_filter:
            try:
                pos = Position(position_filter)
                players = [p for p in players if p.position == pos]
            except ValueError:
                return jsonify({"error": "Invalid position"}), 400
        
        if nationality:
            players = [p for p in players if nationality.lower() in p.nationality.lower()]
        
        # Sırala
        sort_by = request.args.get('sort', 'name')
        if sort_by == 'goals':
            players = sorted(players, key=lambda p: p.goals, reverse=True)
        elif sort_by == 'assists':
            players = sorted(players, key=lambda p: p.assists, reverse=True)
        elif sort_by == 'number':
            players = sorted(players, key=lambda p: p.number)
        
        return jsonify({
            "success": True,
            "count": len(players),
            "players": [p.to_dict() for p in players]
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Oyuncu getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/players/<player_id>', methods=['GET'])
def get_player(player_id):
    """Belirli oyuncunun detaylarını getir"""
    try:
        player = GalatasaraySquad.get_player_by_id(player_id)
        
        if not player:
            return jsonify({"error": "Player not found"}), 404
        
        # Oyuncu hakkında sosyal medya sentiment'i çek
        mentions = db.query("player_mentions", {"player_id": player_id}, limit=50)
        
        positive_mentions = sum(1 for m in mentions if m.get('sentiment') == 'positive')
        negative_mentions = sum(1 for m in mentions if m.get('sentiment') == 'negative')
        
        return jsonify({
            "success": True,
            "player": player.to_dict(),
            "social_media_stats": {
                "total_mentions": len(mentions),
                "positive": positive_mentions,
                "negative": negative_mentions,
                "sentiment_ratio": round(
                    (positive_mentions / len(mentions) * 100) if mentions else 0, 1
                )
            }
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Oyuncu detay hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/squad/stats', methods=['GET'])
def get_squad_stats():
    """Kadro istatistikleri"""
    try:
        stats = GalatasaraySquad.get_squad_stats()
        
        return jsonify({
            "success": True,
            "squad_stats": stats
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Kadro istatistikleri hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/squad/top-scorers', methods=['GET'])
def get_top_scorers():
    """En çok gol atanlar"""
    try:
        limit = int(request.args.get('limit', 10))
        players = GalatasaraySquad.get_players()
        
        # Gol sayısına göre sırala
        top_scorers = sorted(players, key=lambda p: p.goals, reverse=True)[:limit]
        
        return jsonify({
            "success": True,
            "top_scorers": [
                {
                    "rank": i + 1,
                    "name": p.name,
                    "goals": p.goals,
                    "assists": p.assists,
                    "position": p.position.value,
                    "number": p.number
                }
                for i, p in enumerate(top_scorers)
            ]
        }), 200
    
    except Exception as e:
        logger.error(f"❌ En çok gol atan hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/squad/top-assisters', methods=['GET'])
def get_top_assisters():
    """En çok asist yapanlar"""
    try:
        limit = int(request.args.get('limit', 10))
        players = GalatasaraySquad.get_players()
        
        # Asist sayısına göre sırala
        top_assisters = sorted(players, key=lambda p: p.assists, reverse=True)[:limit]
        
        return jsonify({
            "success": True,
            "top_assisters": [
                {
                    "rank": i + 1,
                    "name": p.name,
                    "assists": p.assists,
                    "goals": p.goals,
                    "position": p.position.value,
                    "number": p.number
                }
                for i, p in enumerate(top_assisters)
            ]
        }), 200
    
    except Exception as e:
        logger.error(f"❌ En çok asist yapan hatası: {e}")
        return jsonify({"error": str(e)}), 500

# ======================== KULÜP ROUTES ========================

@app.route('/api/club/info', methods=['GET'])
def get_club_info():
    """Kulüp bilgileri"""
    try:
        club_info = GalatasarayClub.get_info()
        
        return jsonify({
            "success": True,
            "club": club_info.to_dict()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Kulüp bilgisi hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/club/season-stats', methods=['GET'])
def get_club_season_stats():
    """Sezon istatistikleri"""
    try:
        stats = GalatasarayClub.get_season_stats()
        
        return jsonify({
            "success": True,
            "season_stats": stats
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Sezon istatistikleri hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/club/honours', methods=['GET'])
def get_club_honours():
    """Kulüp başarıları"""
    try:
        honours = GalatasarayClub.get_honours()
        
        return jsonify({
            "success": True,
            "honours": honours
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Başarılar hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/club/recent-matches', methods=['GET'])
def get_recent_matches():
    """Son maçlar"""
    try:
        matches = GalatasarayClub.get_recent_matches()
        
        return jsonify({
            "success": True,
            "matches": matches
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Son maçlar hatası: {e}")
        return jsonify({"error": str(e)}), 500

# ======================== ROUTES ========================

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "healthy",
        "service": "Galatasaray Analytics Platform",
        "version": config.PROJECT_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "database": db.db_type,
        "collectors_active": list(collector.collectors.keys()),
        "scheduler_running": scheduler.running
    }), 200

@app.route('/api/collect', methods=['POST'])
def collect_data():
    """Veri çek"""
    try:
        data = request.json
        keywords = data.get('keywords', ['Galatasaray', 'GS', '#Galatasaray'])
        platforms = data.get('platforms', ['twitter', 'instagram', 'youtube'])
        limit = int(data.get('limit', 100))
        
        # Async veri çekme
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if len(platforms) == 1:
            platform = Platform(platforms[0])
            posts = loop.run_until_complete(
                collector.collect_by_platform(platform, keywords, limit)
            )
        else:
            posts = loop.run_until_complete(
                collector.collect_all(keywords, limit)
            )
        
        logger.info(f"✅ {len(posts)} gönderi çekildi")
        
        return jsonify({
            "success": True,
            "count": len(posts),
            "posts": [p.to_dict() for p in posts],
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Veri çekme hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_posts():
    """Gönderileri analiz et"""
    try:
        data = request.json
        posts_data = data.get('posts', [])
        
        # Model'lere dönüştür
        from src.models.schemas import SocialMediaPost
        posts = [
            SocialMediaPost(
                external_id=p.get('external_id'),
                platform=Platform(p.get('platform', 'twitter')),
                author_id=p.get('author_id'),
                author_name=p.get('author_name'),
                content=p.get('content'),
                created_at=datetime.fromisoformat(p.get('created_at')) if p.get('created_at') else datetime.utcnow(),
                likes=int(p.get('likes', 0)),
                comments=int(p.get('comments', 0)),
                shares=int(p.get('shares', 0))
            )
            for p in posts_data
        ]
        
        # Analiz yap
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results = loop.run_until_complete(analyzer.analyze_posts(posts))
        
        logger.info(f"✅ {len(posts)} gönderi analiz edildi")
        
        return jsonify({
            "success": True,
            "analysis_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Analiz hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/collect-and-analyze', methods=['POST'])
def collect_and_analyze():
    """Veri çek ve analiz et (One-shot)"""
    try:
        data = request.json
        keywords = data.get('keywords', ['Galatasaray'])
        platforms = data.get('platforms', ['twitter'])
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Veri çek
        if len(platforms) == 1:
            platform = Platform(platforms[0])
            posts = loop.run_until_complete(
                collector.collect_by_platform(platform, keywords, 50)
            )
        else:
            posts = loop.run_until_complete(
                collector.collect_all(keywords, 50)
            )
        
        # Analiz et
        if posts:
            results = loop.run_until_complete(analyzer.analyze_posts(posts))
        else:
            results = {"error": "Veri çekilenemedi"}
        
        return jsonify({
            "success": True,
            "data_collected": len(posts),
            "analysis": results,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Çek ve analiz hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports', methods=['POST'])
def create_report():
    """Rapor oluştur"""
    try:
        data = request.json
        report_type = data.get('type', 'daily')
        days_back = int(data.get('days_back', 1))
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if report_type == 'daily':
            report = loop.run_until_complete(
                analyzer.report_generator.generate_daily_report(start_date, end_date)
            )
        elif report_type == 'weekly':
            report = loop.run_until_complete(
                analyzer.report_generator.generate_weekly_report(start_date, end_date)
            )
        else:
            report = loop.run_until_complete(
                analyzer.report_generator.generate_custom_report(
                    report_type,
                    [Platform.TWITTER, Platform.INSTAGRAM],
                    ['engagement', 'sentiment', 'players'],
                    start_date,
                    end_date
                )
            )
        
        # Raporu veritabanına kaydet
        db.insert("reports", report.to_dict())
        
        logger.info(f"✅ {report_type} rapor oluşturuldu")
        
        return jsonify({
            "success": True,
            "report": report.to_dict(),
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Rapor oluşturma hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Raporları getir"""
    try:
        limit = int(request.args.get('limit', 20))
        report_type = request.args.get('type')
        
        query = {} if not report_type else {"report_type": report_type}
        reports = db.query("reports", query, limit=limit)
        
        return jsonify({
            "success": True,
            "count": len(reports),
            "reports": reports
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Rapor getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/insights', methods=['GET'])
def get_insights():
    """İçgörüleri getir"""
    try:
        days_back = int(request.args.get('days', 7))
        
        start_date = datetime.utcnow() - timedelta(days=days_back)
        
        # Son analizleri çek
        analytics = db.query("sentiment_analysis", {
            "analyzed_at": {"$gte": start_date}
        }, limit=1000)
        
        if not analytics:
            return jsonify({
                "insights": ["❌ Yeterli veri bulunmamaktadır"]
            }), 200
        
        # İstatistikler
        positive_count = sum(1 for a in analytics if a.get('sentiment') == 'positive')
        negative_count = sum(1 for a in analytics if a.get('sentiment') == 'negative')
        neutral_count = sum(1 for a in analytics if a.get('sentiment') == 'neutral')
        
        insights = []
        
        total = len(analytics)
        if positive_count > total * 0.6:
            insights.append(f"😊 {positive_count/total*100:.1f}% pozitif sentiment")
        elif negative_count > total * 0.6:
            insights.append(f"😟 {negative_count/total*100:.1f}% negatif sentiment")
        else:
            insights.append(f"⚖️ Karışık sentiment dağılımı")
        
        # En çok bahsedilen oyuncular
        player_mentions = db.query("player_mentions", {}, limit=500)
        if player_mentions:
            from collections import Counter
            top_players = Counter(p.get('player_name') for p in player_mentions).most_common(3)
            insights.append(
                f"⭐ Top oyuncular: {', '.join(p[0] for p in top_players)}"
            )
        
        return jsonify({
            "success": True,
            "period_days": days_back,
            "total_analyzed": total,
            "sentiment_distribution": {
                "positive": positive_count,
                "negative": negative_count,
                "neutral": neutral_count
            },
            "insights": insights,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
    
    except Exception as e:
        logger.error(f"❌ İçgörü getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Metrikleri getir"""
    try:
        days_back = int(request.args.get('days', 7))
        platform = request.args.get('platform')
        
        start_date = datetime.utcnow() - timedelta(days=days_back)
        
        query = {"calculated_at": {"$gte": start_date}}
        if platform:
            query["platform"] = platform
        
        metrics = db.query("engagement_metrics", query, limit=100)
        
        return jsonify({
            "success": True,
            "count": len(metrics),
            "metrics": metrics
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Metrik getirme hatası: {e}")
        return jsonify({"error": str(e)}), 500

# ======================== SCHEDULED TASKS ========================

def scheduled_collect_and_analyze():
    """Zamanlanmış veri çek ve analiz"""
    logger.info("⏰ Zamanlanmış analiz başladı")
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        keywords = ['Galatasaray', 'GS', '#Galatasaray']
        posts = loop.run_until_complete(collector.collect_all(keywords, 100))
        
        if posts:
            results = loop.run_until_complete(analyzer.analyze_posts(posts))
            logger.info(f"✅ Zamanlanmış analiz tamamlandı: {len(posts)} gönderi")
        else:
            logger.warning("⚠️ Zamanlanmış analizde veri çekilenemedi")
    
    except Exception as e:
        logger.error(f"❌ Zamanlanmış analiz hatası: {e}")

# ======================== STARTUP / SHUTDOWN ========================

@app.before_request
def before_request():
    """İstek öncesi"""
    pass

@app.teardown_appcontext
def teardown_db(error):
    """Kapatışta"""
    if error:
        logger.error(f"Uygulama hatası: {error}")

def main():
    """Ana fonksiyon"""
    logger.info(f"🌐 Flask API başlatılıyor: {config.HOST}:{config.PORT}")
    
    # Scheduler'ı başlat
    if config.SCHEDULER_ENABLED:
        try:
            scheduler.add_job(
                scheduled_collect_and_analyze,
                'interval',
                minutes=config.SCHEDULER_INTERVAL_MINUTES,
                id='collect_and_analyze'
            )
            scheduler.start()
            logger.info(
                f"⏰ Scheduler başlatıldı - Interval: {config.SCHEDULER_INTERVAL_MINUTES} dakika"
            )
        except Exception as e:
            logger.error(f"⚠️ Scheduler başlatma hatası: {e}")
    
    # Flask sunucusunu başlat
    try:
        app.run(
            host=config.HOST,
            port=config.PORT,
            debug=config.DEBUG,
            use_reloader=config.DEBUG
        )
    except KeyboardInterrupt:
        logger.info("🛑 Uygulama kapatılıyor...")
        if scheduler.running:
            scheduler.shutdown()
    except Exception as e:
        logger.error(f"❌ Uygulama başlatma hatası: {e}")

if __name__ == '__main__':
    main()
