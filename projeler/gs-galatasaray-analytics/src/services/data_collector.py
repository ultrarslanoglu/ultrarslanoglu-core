"""
Veri Çekme Servisleri - Twitter/X, Instagram, YouTube, TikTok
"""

import asyncio
import aiohttp
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from loguru import logger
from config.config import Config
from src.models.schemas import SocialMediaPost, Platform

class DataCollectorBase(ABC):
    """Veri Toplayıcı Base Sınıfı"""
    
    def __init__(self, platform: Platform):
        self.platform = platform
        self.config = Config.get_api_providers().get(platform.value)
        self.rate_limit = Config.RATE_LIMIT_ENABLED
        self.timeout = Config.SCRAPE_TIMEOUT
        logger.info(f"🔧 {platform.value} veri toplayıcısı başlatıldı")
    
    @abstractmethod
    async def fetch_recent_posts(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """Son gönderileri çek"""
        pass
    
    @abstractmethod
    async def fetch_user_timeline(self, user_id: str, limit: int = 50) -> List[SocialMediaPost]:
        """Kullanıcı zaman çizelgesini çek"""
        pass
    
    @abstractmethod
    async def fetch_trending(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Trend konuları çek"""
        pass
    
    def _create_post_object(self, data: Dict) -> SocialMediaPost:
        """Ham veriyi SocialMediaPost objesine dönüştür"""
        raise NotImplementedError

class TwitterCollector(DataCollectorBase):
    """Twitter/X Veri Toplayıcısı"""
    
    def __init__(self):
        super().__init__(Platform.TWITTER)
        self.base_url = "https://api.twitter.com/2"
        self.headers = {
            "Authorization": f"Bearer {self.config['bearer_token']}",
            "User-Agent": "GalatasarayAnalytics/1.0"
        }
    
    async def fetch_recent_posts(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """Galatasaray hakkında son gönderileri çek"""
        posts = []
        
        # Arama sorgusu
        query = " OR ".join(keywords)
        query += " -is:retweet lang:tr"  # Türkçe, retweet'leri dışla
        
        params = {
            "query": query,
            "max_results": min(limit, 100),
            "tweet.fields": "created_at,author_id,public_metrics,lang",
            "expansions": "author_id",
            "user.fields": "username,followers_count,verified"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/tweets/search/recent",
                    headers=self.headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        tweets = data.get("data", [])
                        includes = data.get("includes", {})
                        users_map = {user["id"]: user for user in includes.get("users", [])}
                        
                        for tweet in tweets:
                            post = self._create_post_object(tweet, users_map)
                            posts.append(post)
                        
                        logger.info(f"✅ Twitter'dan {len(posts)} gönderi çekildi")
                    else:
                        logger.error(f"❌ Twitter API hatası: {resp.status}")
        
        except Exception as e:
            logger.error(f"❌ Twitter veri çekme hatası: {e}")
        
        return posts
    
    async def fetch_user_timeline(self, user_id: str, limit: int = 50) -> List[SocialMediaPost]:
        """Twitter kullanıcısı zaman çizelgesini çek"""
        posts = []
        
        params = {
            "max_results": min(limit, 100),
            "tweet.fields": "created_at,public_metrics,lang",
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/users/{user_id}/tweets",
                    headers=self.headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for tweet in data.get("data", []):
                            post = self._create_post_object(tweet)
                            posts.append(post)
                        
                        logger.info(f"✅ Twitter zaman çizelgesinden {len(posts)} gönderi çekildi")
        
        except Exception as e:
            logger.error(f"❌ Twitter zaman çizelgesi çekme hatası: {e}")
        
        return posts
    
    async def fetch_trending(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Twitter'da trend konuları çek"""
        # Not: Twitter API v2 trend API'si kısıtlıdır
        # Bu endpoint ek yapılandırma gerektirir
        logger.warning("⚠️ Twitter trend API v2 için ek izin gereklidir")
        return []
    
    def _create_post_object(self, tweet: Dict, users_map: Dict = None) -> SocialMediaPost:
        """Tweet'i SocialMediaPost objesine dönüştür"""
        metrics = tweet.get("public_metrics", {})
        user_info = users_map.get(tweet.get("author_id"), {}) if users_map else {}
        
        return SocialMediaPost(
            external_id=tweet["id"],
            platform=Platform.TWITTER,
            author_id=tweet.get("author_id", ""),
            author_name=user_info.get("username", ""),
            author_followers=user_info.get("followers_count", 0),
            content=tweet.get("text", ""),
            created_at=datetime.fromisoformat(tweet.get("created_at", "").replace("Z", "+00:00")),
            likes=metrics.get("like_count", 0),
            comments=metrics.get("reply_count", 0),
            retweets=metrics.get("retweet_count", 0),
            shares=metrics.get("quote_count", 0),
            language=tweet.get("lang", "tr"),
            url=f"https://twitter.com/i/web/status/{tweet['id']}"
        )

class InstagramCollector(DataCollectorBase):
    """Instagram Veri Toplayıcısı"""
    
    def __init__(self):
        super().__init__(Platform.INSTAGRAM)
        self.base_url = "https://graph.instagram.com/v18.0"
        self.access_token = self.config['access_token']
    
    async def fetch_recent_posts(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """Instagram'da Galatasaray hakkında gönderileri çek"""
        posts = []
        hashtag_ids = []
        
        # Hashtag'leri bul
        for keyword in keywords:
            hashtag_id = await self._search_hashtag(keyword)
            if hashtag_id:
                hashtag_ids.append(hashtag_id)
        
        # Her hashtag için gönderileri çek
        for hashtag_id in hashtag_ids:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        f"{self.base_url}/{hashtag_id}/recent_media",
                        params={
                            "user_id": self.config.get('business_account_id'),
                            "fields": "id,caption,media_type,media_url,timestamp,like_count,comments_count",
                            "access_token": self.access_token
                        },
                        timeout=aiohttp.ClientTimeout(total=self.timeout)
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            for media in data.get("data", [])[:limit]:
                                post = SocialMediaPost(
                                    external_id=media["id"],
                                    platform=Platform.INSTAGRAM,
                                    content=media.get("caption", ""),
                                    media_urls=[media.get("media_url", "")],
                                    created_at=datetime.fromisoformat(media.get("timestamp", "").replace("Z", "+00:00")),
                                    likes=media.get("like_count", 0),
                                    comments=media.get("comments_count", 0),
                                )
                                posts.append(post)
                        else:
                            logger.warning(f"⚠️ Instagram API hatası: {resp.status}")
            
            except Exception as e:
                logger.error(f"❌ Instagram veri çekme hatası: {e}")
        
        logger.info(f"✅ Instagram'dan {len(posts)} gönderi çekildi")
        return posts
    
    async def _search_hashtag(self, hashtag: str) -> Optional[str]:
        """Hashtag'i ara ve ID'sini döndür"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/ig_hashtag_search",
                    params={
                        "user_id": self.config.get('business_account_id'),
                        "fields": "id,name",
                        "access_token": self.access_token
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get("data"):
                            return data["data"][0]["id"]
        except Exception as e:
            logger.warning(f"Hashtag arama hatası: {e}")
        return None
    
    async def fetch_user_timeline(self, user_id: str, limit: int = 50) -> List[SocialMediaPost]:
        """Instagram kullanıcı zaman çizelgesini çek"""
        # Business Account medya çek
        posts = []
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/{user_id}/media",
                    params={
                        "fields": "id,caption,media_type,media_url,timestamp,like_count,comments_count",
                        "access_token": self.access_token,
                        "limit": limit
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for media in data.get("data", []):
                            post = SocialMediaPost(
                                external_id=media["id"],
                                platform=Platform.INSTAGRAM,
                                content=media.get("caption", ""),
                                media_urls=[media.get("media_url", "")],
                                likes=media.get("like_count", 0),
                                comments=media.get("comments_count", 0),
                            )
                            posts.append(post)
                        logger.info(f"✅ Instagram zaman çizelgesinden {len(posts)} gönderi çekildi")
        except Exception as e:
            logger.error(f"❌ Instagram zaman çizelgesi çekme hatası: {e}")
        
        return posts
    
    async def fetch_trending(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Instagram'da trend konuları çek"""
        # Instagram trend API kısıtlıdır
        logger.warning("⚠️ Instagram trend API kısıtlıdır")
        return []

class YouTubeCollector(DataCollectorBase):
    """YouTube Veri Toplayıcısı"""
    
    def __init__(self):
        super().__init__(Platform.YOUTUBE)
        self.api_key = self.config['api_key']
        self.channel_id = self.config.get('channel_id', 'galatasaraytv')
        self.base_url = "https://www.googleapis.com/youtube/v3"
    
    async def fetch_recent_posts(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """YouTube'da Galatasaray videoları ara"""
        posts = []
        query = " ".join(keywords)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/search",
                    params={
                        "q": query,
                        "part": "snippet",
                        "type": "video",
                        "maxResults": min(limit, 50),
                        "key": self.api_key,
                        "order": "date",
                        "relevanceLanguage": "tr"
                    },
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("items", []):
                            snippet = item.get("snippet", {})
                            post = SocialMediaPost(
                                external_id=item["id"]["videoId"],
                                platform=Platform.YOUTUBE,
                                author_name=snippet.get("channelTitle", ""),
                                content=snippet.get("description", ""),
                                created_at=datetime.fromisoformat(snippet.get("publishedAt", "").replace("Z", "+00:00")),
                                media_urls=[snippet.get("thumbnails", {}).get("high", {}).get("url", "")],
                                url=f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                            )
                            posts.append(post)
                        
                        logger.info(f"✅ YouTube'dan {len(posts)} video çekildi")
        
        except Exception as e:
            logger.error(f"❌ YouTube veri çekme hatası: {e}")
        
        return posts
    
    async def fetch_user_timeline(self, channel_id: str, limit: int = 50) -> List[SocialMediaPost]:
        """YouTube kanal videoları çek"""
        posts = []
        
        try:
            async with aiohttp.ClientSession() as session:
                # Kanal verileri
                async with session.get(
                    f"{self.base_url}/search",
                    params={
                        "channelId": channel_id,
                        "part": "snippet",
                        "type": "video",
                        "maxResults": min(limit, 50),
                        "key": self.api_key,
                        "order": "date"
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("items", []):
                            snippet = item.get("snippet", {})
                            post = SocialMediaPost(
                                external_id=item["id"]["videoId"],
                                platform=Platform.YOUTUBE,
                                author_name=snippet.get("channelTitle", ""),
                                content=snippet.get("description", ""),
                                created_at=datetime.fromisoformat(snippet.get("publishedAt", "").replace("Z", "+00:00")),
                                url=f"https://www.youtube.com/watch?v={item['id']['videoId']}"
                            )
                            posts.append(post)
                        
                        logger.info(f"✅ YouTube kanalından {len(posts)} video çekildi")
        
        except Exception as e:
            logger.error(f"❌ YouTube kanal çekme hatası: {e}")
        
        return posts
    
    async def fetch_trending(self, limit: int = 20) -> List[Dict[str, Any]]:
        """YouTube trend videoları çek"""
        trending = []
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/videos",
                    params={
                        "part": "snippet,statistics",
                        "chart": "mostPopular",
                        "regionCode": "TR",
                        "maxResults": limit,
                        "key": self.api_key
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for item in data.get("items", []):
                            trending.append({
                                "title": item["snippet"]["title"],
                                "views": item["statistics"]["viewCount"],
                                "likes": item["statistics"].get("likeCount", 0),
                                "url": f"https://www.youtube.com/watch?v={item['id']}"
                            })
        
        except Exception as e:
            logger.error(f"❌ YouTube trend çekme hatası: {e}")
        
        return trending

class TikTokCollector(DataCollectorBase):
    """TikTok Veri Toplayıcısı"""
    
    def __init__(self):
        super().__init__(Platform.TIKTOK)
        self.api_key = self.config['api_key']
        self.secret = self.config['secret']
        self.base_url = "https://open.tiktokapis.com/v1"
    
    async def fetch_recent_posts(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """TikTok'ta Galatasaray videoları ara"""
        posts = []
        query = " ".join(keywords)
        
        try:
            # TikTok API v1 çekme (kısıtlı erişim)
            logger.warning("⚠️ TikTok API kısıtlı erişime sahiptir - Web scraping gerekli olabilir")
        except Exception as e:
            logger.error(f"❌ TikTok veri çekme hatası: {e}")
        
        return posts
    
    async def fetch_user_timeline(self, user_id: str, limit: int = 50) -> List[SocialMediaPost]:
        """TikTok kullanıcı videolarını çek"""
        posts = []
        logger.warning("⚠️ TikTok API kısıtlı erişime sahiptir")
        return posts
    
    async def fetch_trending(self, limit: int = 20) -> List[Dict[str, Any]]:
        """TikTok trend videolarını çek"""
        logger.warning("⚠️ TikTok trend API kısıtlıdır")
        return []

class DataCollectorOrchestrator:
    """Veri Toplayıcı Orkestratörü - Tüm kaynakları yönetir"""
    
    def __init__(self):
        self.collectors = {
            Platform.TWITTER: TwitterCollector(),
            Platform.INSTAGRAM: InstagramCollector(),
            Platform.YOUTUBE: YouTubeCollector(),
            Platform.TIKTOK: TikTokCollector()
        }
        logger.info(f"✅ Veri Toplayıcı Orkestratörü başlatıldı - {len(self.collectors)} platform")
    
    async def collect_all(self, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """Tüm platformlardan veri çek"""
        all_posts = []
        
        tasks = [
            self.collectors[Platform.TWITTER].fetch_recent_posts(keywords, limit),
            self.collectors[Platform.INSTAGRAM].fetch_recent_posts(keywords, limit),
            self.collectors[Platform.YOUTUBE].fetch_recent_posts(keywords, limit),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_posts.extend(result)
            else:
                logger.error(f"Veri çekme hatası: {result}")
        
        logger.info(f"📊 Toplam {len(all_posts)} gönderi çekildi")
        return all_posts
    
    async def collect_by_platform(self, platform: Platform, keywords: List[str], limit: int = 100) -> List[SocialMediaPost]:
        """Belirli bir platformdan veri çek"""
        if platform not in self.collectors:
            logger.error(f"❌ Bilinmeyen platform: {platform}")
            return []
        
        return await self.collectors[platform].fetch_recent_posts(keywords, limit)
