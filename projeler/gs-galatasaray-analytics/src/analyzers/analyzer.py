"""
Analiz ve Raporlama Modülü
Duyguanlık analizi, etkileşim analizi, oyuncu performansı
"""

import asyncio
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from loguru import logger
import numpy as np
from collections import defaultdict, Counter
import re

from src.models.schemas import (
    SocialMediaPost, SentimentAnalysis, EngagementMetrics,
    PlayerMention, TeamPerformance, Report, Platform, SentimentType
)
from src.database.manager import db

class SentimentAnalyzer:
    """Duygusallık Analizi - Türkçe optimized"""
    
    # Türkçe sentiment kelime listeleri
    POSITIVE_WORDS = {
        'harika': 0.9, 'mükemmel': 0.9, 'süper': 0.85, 'iyi': 0.7,
        'güzel': 0.75, 'beğendim': 0.8, 'beğeniyorum': 0.8,
        'başarılı': 0.8, 'kazanı': 0.85, 'gol': 0.7, 'goller': 0.7,
        'tebrikler': 0.8, 'aferin': 0.8, 'alkış': 0.75, 'müthiş': 0.85,
        'fevkalade': 0.8, 'enfes': 0.85, 'bol': 0.7, 'çok güzel': 0.85,
        'efsane': 0.9, 'geçmiş olsun': 0.6  # Yarı-pozitif
    }
    
    NEGATIVE_WORDS = {
        'kötü': -0.7, 'berbat': -0.9, 'aptal': -0.8, 'idiot': -0.9,
        'hatalı': -0.7, 'yanlış': -0.6, 'zayıf': -0.7, 'başarısız': -0.8,
        'kaybettik': -0.6, 'kayıp': -0.6, 'penaltı': -0.5, 'kırmızı kart': -0.7,
        'saha dışında': -0.6, 'sakatlık': -0.7, 'hakem': -0.5, 'haksız': -0.7,
        'düşüş': -0.6, 'düştük': -0.6, 'sene': -0.4, 'sinir': -0.5
    }
    
    # Oyuncu isimlerini tespit etmek için pattern
    PLAYER_PATTERNS = {
        'icardi': 'Mauro Icardi',
        'drogba': 'Didier Drogba',
        'sneijder': 'Wesley Sneijder',
        'muslera': 'Fernando Muslera',
        'barış alper': 'Barış Alper Yılmaz',
        'hakim ziyech': 'Hakim Ziyech',
        'mertens': 'Dries Mertens',
        'torreira': 'Lucas Torreira'
    }
    
    def analyze(self, text: str) -> Tuple[SentimentType, float]:
        """Metni analiz et ve duygusallık türü + puanı döndür"""
        if not text:
            return SentimentType.NEUTRAL, 0.0
        
        text_lower = text.lower()
        
        # Emoji'leri dikkate al
        score = self._analyze_emojis(text) * 0.3  # %30 ağırlık
        
        # Kelimeleri dikkate al
        positive_score = sum(
            weight for word, weight in self.POSITIVE_WORDS.items()
            if word in text_lower
        )
        
        negative_score = sum(
            weight for word, weight in self.NEGATIVE_WORDS.items()
            if word in text_lower
        )
        
        word_score = (positive_score + negative_score) / (len(text.split()) or 1)
        score += word_score * 0.7  # %70 ağırlık
        
        # Sınırlar
        score = max(-1.0, min(1.0, score))
        
        # Türü belirle
        if score > 0.2:
            sentiment_type = SentimentType.POSITIVE
        elif score < -0.2:
            sentiment_type = SentimentType.NEGATIVE
        else:
            sentiment_type = SentimentType.NEUTRAL
        
        return sentiment_type, round(score, 3)
    
    def _analyze_emojis(self, text: str) -> float:
        """Emoji analizini yap"""
        positive_emojis = ['😊', '😍', '🔥', '👏', '🙌', '✨', '💪', '🎉', '⚽', '🏆']
        negative_emojis = ['😢', '😤', '😡', '😠', '👎', '💔', '😭']
        
        score = 0.0
        for emoji in positive_emojis:
            score += text.count(emoji) * 0.2
        
        for emoji in negative_emojis:
            score -= text.count(emoji) * 0.2
        
        return score
    
    def extract_entities(self, text: str) -> Tuple[List[str], List[str]]:
        """Metin'ten hashtag ve mention'ları çıkar"""
        hashtags = re.findall(r'#\w+', text.lower())
        mentions = re.findall(r'@\w+', text.lower())
        return hashtags, mentions
    
    def detect_players(self, text: str) -> List[str]:
        """Metinde bahsedilen oyuncuları tespit et"""
        detected_players = []
        text_lower = text.lower()
        
        for pattern, player_name in self.PLAYER_PATTERNS.items():
            if pattern in text_lower:
                detected_players.append(player_name)
        
        return detected_players

class EngagementAnalyzer:
    """Etkileşim Analizi"""
    
    @staticmethod
    def calculate_metrics(posts: List[SocialMediaPost], date: str = None) -> EngagementMetrics:
        """Etkileşim metriklerini hesapla"""
        if not posts:
            return EngagementMetrics()
        
        date = date or datetime.utcnow().date().isoformat()
        
        metrics = EngagementMetrics(
            date=date,
            total_posts=len(posts),
            unique_authors=len(set(p.author_id for p in posts if p.author_id)),
            total_likes=sum(p.likes for p in posts),
            total_comments=sum(p.comments for p in posts),
            total_shares=sum(p.shares for p in posts),
            total_views=sum(p.views for p in posts)
        )
        
        metrics.total_engagement = (
            metrics.total_likes +
            metrics.total_comments +
            metrics.total_shares
        )
        
        # Oranları hesapla
        if metrics.total_posts > 0:
            total_interactions = sum(
                (p.likes + p.comments + p.shares + p.views) or 1
                for p in posts
            )
            metrics.average_engagement_rate = (
                metrics.total_engagement / total_interactions
                if total_interactions > 0 else 0.0
            )
        
        # Sentiment dağılımı
        sentiment_counter = Counter(p.sentiment for p in posts if p.sentiment)
        metrics.sentiment_distribution = dict(sentiment_counter)
        
        # Average sentiment
        sentiments = [p.sentiment_score for p in posts if p.sentiment_score]
        if sentiments:
            metrics.average_sentiment_score = round(np.mean(sentiments), 3)
        
        metrics.platform = posts[0].platform if posts else Platform.TWITTER
        metrics.calculated_at = datetime.utcnow()
        
        return metrics

class PlayerAnalyzer:
    """Oyuncu Performans Analizi"""
    
    GALATASARAY_SQUAD = {
        # Savunma
        'muslera': {'name': 'Fernando Muslera', 'position': 'GK'},
        'boey': {'name': 'Sacha Boey', 'position': 'RB'},
        'ayhan': {'name': 'Merih Demiral', 'position': 'CB'},  # Ayhan yerine
        'abdülkadir': {'name': 'Abdülkadir Ömür', 'position': 'LB'},
        
        # Orta saha
        'torreira': {'name': 'Lucas Torreira', 'position': 'CDM'},
        'seko fofana': {'name': 'Seko Fofana', 'position': 'CM'},
        'aktürkoglu': {'name': 'Kerem Aktürkoğlu', 'position': 'LW'},
        'ziyech': {'name': 'Hakim Ziyech', 'position': 'CAM'},
        
        # Hücum
        'icardi': {'name': 'Mauro Icardi', 'position': 'CF'},
        'drogba': {'name': 'Didier Drogba', 'position': 'ST'},  # Historical
        'mertens': {'name': 'Dries Mertens', 'position': 'ST'},
    }
    
    @staticmethod
    def analyze_mentions(posts: List[SocialMediaPost], sentiment_analyzer: SentimentAnalyzer) -> List[PlayerMention]:
        """Oyuncu bahislerini analiz et"""
        mentions = []
        
        for post in posts:
            players = sentiment_analyzer.detect_players(post.content)
            
            for player_name in players:
                # Oyuncu bilgilerini bul
                player_info = PlayerAnalyzer._find_player_info(player_name)
                
                mention = PlayerMention(
                    player_id=player_name.lower(),
                    player_name=player_info.get('name', player_name),
                    position=player_info.get('position', 'Unknown'),
                    post_id=post.id,
                    platform=post.platform,
                    sentiment=post.sentiment,
                    sentiment_score=post.sentiment_score,
                    context=post.content[:100]  # İlk 100 karakter
                )
                
                # Bağlam tespit et
                content_lower = post.content.lower()
                if any(word in content_lower for word in ['sakatlık', 'sakatlandı', 'injury']):
                    mention.injury_mention = True
                if any(word in content_lower for word in ['transfer', 'ayrılmak', 'leave']):
                    mention.transfer_mention = True
                if any(word in content_lower for word in ['gol', 'asist', 'pas', 'performans']):
                    mention.performance_mention = True
                
                mentions.append(mention)
        
        return mentions
    
    @staticmethod
    def _find_player_info(player_name: str) -> Dict[str, str]:
        """Oyuncu bilgilerini bul"""
        player_lower = player_name.lower()
        
        for key, info in PlayerAnalyzer.GALATASARAY_SQUAD.items():
            if key in player_lower or player_lower in key:
                return info
        
        return {'name': player_name, 'position': 'Unknown'}

class ReportGenerator:
    """Rapor Üretici"""
    
    @staticmethod
    async def generate_daily_report(
        start_date: datetime,
        end_date: datetime
    ) -> Report:
        """Günlük rapor oluştur"""
        
        # Verileri çek
        posts = db.query("social_media_posts", {
            "created_at": {"$gte": start_date, "$lte": end_date}
        })
        
        sentiments = db.query("sentiment_analysis", {
            "analyzed_at": {"$gte": start_date, "$lte": end_date}
        })
        
        metrics = db.query("engagement_metrics", {
            "calculated_at": {"$gte": start_date, "$lte": end_date}
        })
        
        # Rapor oluştur
        report = Report(
            report_type="daily",
            start_date=start_date,
            end_date=end_date,
            title=f"Galatasaray Analytics - Günlük Rapor ({start_date.date()})",
            created_at=datetime.utcnow()
        )
        
        # Özet istatistikler
        if posts:
            total_posts = len(posts)
            total_engagement = sum(p.get('likes', 0) + p.get('comments', 0) for p in posts)
            
            report.summary = f"{total_posts} gönderi, {total_engagement} etkileşim"
            
            # Key findings
            positive_count = sum(1 for s in sentiments if s.get('sentiment') == 'positive')
            negative_count = sum(1 for s in sentiments if s.get('sentiment') == 'negative')
            
            if positive_count > negative_count:
                report.key_findings.append(
                    f"✅ Pozitif sentiment {(positive_count/len(sentiments)*100):.1f}%"
                )
            else:
                report.key_findings.append(
                    f"❌ Negatif sentiment {(negative_count/len(sentiments)*100):.1f}%"
                )
        
        return report
    
    @staticmethod
    async def generate_weekly_report(
        start_date: datetime,
        end_date: datetime
    ) -> Report:
        """Haftalık rapor oluştur"""
        
        report = Report(
            report_type="weekly",
            start_date=start_date,
            end_date=end_date,
            title=f"Galatasaray Analytics - Haftalık Rapor ({start_date.date()} - {end_date.date()})",
            created_at=datetime.utcnow()
        )
        
        # Haftalık analiz
        # ... benzer şekilde günlük rapor
        
        return report
    
    @staticmethod
    async def generate_custom_report(
        report_type: str,
        platforms: List[Platform],
        metrics_to_include: List[str],
        start_date: datetime,
        end_date: datetime
    ) -> Report:
        """Özel rapor oluştur"""
        
        report = Report(
            report_type="custom",
            start_date=start_date,
            end_date=end_date,
            title=f"Galatasaray Analytics - Özel Rapor",
            created_at=datetime.utcnow()
        )
        
        # Özel metrik hesaplamaları
        report.metrics = {
            "platforms_analyzed": [p.value for p in platforms],
            "metrics_included": metrics_to_include,
            "period_days": (end_date - start_date).days
        }
        
        return report

class AnalysisOrchestrator:
    """Analiz Orkestratörü - Tüm analizleri yönetir"""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.engagement_analyzer = EngagementAnalyzer()
        self.player_analyzer = PlayerAnalyzer()
        self.report_generator = ReportGenerator()
        logger.info("✅ Analiz Orkestratörü başlatıldı")
    
    async def analyze_posts(self, posts: List[SocialMediaPost]) -> Dict[str, Any]:
        """Gönderileri kapsamlı şekilde analiz et"""
        
        results = {
            "total_posts": len(posts),
            "posts_with_sentiment": [],
            "engagement_metrics": None,
            "player_mentions": [],
            "key_insights": []
        }
        
        # Sentiment analizi
        for post in posts:
            sentiment, score = self.sentiment_analyzer.analyze(post.content)
            post.sentiment = sentiment
            post.sentiment_score = score
            
            hashtags, mentions = self.sentiment_analyzer.extract_entities(post.content)
            post.hashtags = hashtags
            post.mentions = mentions
            
            # Veritabanına kaydet
            try:
                db.insert("social_media_posts", post.to_dict())
                
                # Sentiment analizi kaydet
                sentiment_analysis = SentimentAnalysis(
                    post_id=post.id,
                    platform=post.platform,
                    sentiment=sentiment,
                    confidence=abs(score),
                    score=score
                )
                db.insert("sentiment_analysis", sentiment_analysis.to_dict())
                
            except Exception as e:
                logger.error(f"Veritabanı kaydetme hatası: {e}")
            
            results["posts_with_sentiment"].append({
                "post_id": post.id,
                "sentiment": sentiment.value,
                "score": score,
                "content": post.content[:100]
            })
        
        # Etkileşim metrikleri
        metrics = self.engagement_analyzer.calculate_metrics(posts)
        results["engagement_metrics"] = metrics.to_dict()
        
        try:
            db.insert("engagement_metrics", metrics.to_dict())
        except Exception as e:
            logger.error(f"Metrik kaydetme hatası: {e}")
        
        # Oyuncu analizleri
        player_mentions = self.player_analyzer.analyze_mentions(
            posts, self.sentiment_analyzer
        )
        results["player_mentions"] = [m.to_dict() for m in player_mentions]
        
        for mention in player_mentions:
            try:
                db.insert("player_mentions", mention.to_dict())
            except Exception as e:
                logger.error(f"Oyuncu bahsi kaydetme hatası: {e}")
        
        # İçgörüler
        results["key_insights"] = self._generate_insights(
            posts, metrics, player_mentions
        )
        
        logger.info(f"✅ {len(posts)} gönderi analiz edildi")
        
        return results
    
    def _generate_insights(
        self,
        posts: List[SocialMediaPost],
        metrics: EngagementMetrics,
        player_mentions: List[PlayerMention]
    ) -> List[str]:
        """İçgörüler üret"""
        insights = []
        
        # Etkileşim insight'ı
        if metrics.average_engagement_rate > 0.1:
            insights.append("🔥 Yüksek etkileşim oranı tespit edildi")
        elif metrics.average_engagement_rate < 0.02:
            insights.append("⚠️ Düşük etkileşim oranı")
        
        # Sentiment insight'ı
        positive_pct = (
            metrics.sentiment_distribution.get(SentimentType.POSITIVE, 0) /
            (len(posts) or 1) * 100
        )
        
        if positive_pct > 70:
            insights.append("😊 Çoğunlukla pozitif sentiment")
        elif positive_pct < 30:
            insights.append("😟 Çoğunlukla negatif sentiment")
        
        # Oyuncu insight'ı
        top_mentioned = Counter(m.player_name for m in player_mentions).most_common(3)
        if top_mentioned:
            insights.append(
                f"⭐ En çok bahsedilen oyuncular: {', '.join(p[0] for p in top_mentioned)}"
            )
        
        return insights
