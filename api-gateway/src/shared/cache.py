#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Redis Cache Layer - Merkezi cache yönetimi
TTL policies ve invalidation stratejisini içerir
"""

import json
import os
from typing import Any, Optional

import redis
from loguru import logger

# Cache default TTL (Time To Live)
CACHE_DEFAULTS = {
    "user_profile": 3600,  # 1 saat
    "user_settings": 3600,  # 1 saat
    "video_metadata": 7200,  # 2 saat
    "video_status": 300,  # 5 dakika (sık güncellenen)
    "analytics_dashboard": 3600,  # 1 saat
    "metrics": 1800,  # 30 dakika
    "trending": 1800,  # 30 dakika
    "recommendations": 3600,  # 1 saat
    "permissions": 7200,  # 2 saat
    "session": 86400,  # 24 saat
    "api_rate_limit": 900,  # 15 dakika
    "temporary": 300,  # 5 dakika
}

# Cache key prefixes
CACHE_PREFIXES = {
    "user": "user:",
    "video": "video:",
    "metrics": "metrics:",
    "analytics": "analytics:",
    "trending": "trending:",
    "session": "session:",
    "rate_limit": "rate_limit:",
    "workflow": "workflow:",
    "task": "task:",
}


class RedisCache:
    """Redis cache layer"""

    def __init__(self, redis_url: Optional[str] = None):
        """Initialize Redis connection"""
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            self.client = redis.from_url(self.redis_url, decode_responses=True)
            self.client.ping()
            logger.info("✅ Redis cache bağlantısı başarılı")
        except Exception as e:
            logger.error(f"❌ Redis bağlantı hatası: {e}")
            raise

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.warning(f"⚠️ Cache get error ({key}): {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL"""
        try:
            # Serialize if needed
            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            self.client.setex(key, ttl, value)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Cache set error ({key}): {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            self.client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.warning(f"⚠️ Cache delete error ({key}): {e}")
            return False

    def delete_by_pattern(self, pattern: str) -> int:
        """Delete multiple keys matching pattern"""
        try:
            keys = self.client.keys(pattern)
            if keys:
                deleted = self.client.delete(*keys)
                logger.debug(f"Cache PATTERN DELETE: {pattern} ({deleted} keys)")
                return deleted
            return 0
        except Exception as e:
            logger.warning(f"⚠️ Cache pattern delete error ({pattern}): {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.warning(f"⚠️ Cache exists error ({key}): {e}")
            return False

    def ttl(self, key: str) -> int:
        """Get remaining TTL in seconds"""
        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.warning(f"⚠️ Cache ttl error ({key}): {e}")
            return -1

    def clear_all(self) -> bool:
        """Clear all cache (use with caution)"""
        try:
            self.client.flushdb()
            logger.warning("⚠️ Cache tamamen temizlendi")
            return True
        except Exception as e:
            logger.error(f"❌ Cache clear error: {e}")
            return False

    # ========== HIGH-LEVEL CACHE METHODS ==========

    def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Get cached user profile"""
        return self.get(f"{CACHE_PREFIXES['user']}profile:{user_id}")

    def set_user_profile(self, user_id: str, profile: dict) -> bool:
        """Set cached user profile"""
        return self.set(
            f"{CACHE_PREFIXES['user']}profile:{user_id}",
            profile,
            CACHE_DEFAULTS["user_profile"],
        )

    def invalidate_user(self, user_id: str) -> int:
        """Invalidate all cache for a user"""
        return self.delete_by_pattern(f"{CACHE_PREFIXES['user']}*:{user_id}")

    def get_video_metadata(self, video_id: str) -> Optional[dict]:
        """Get cached video metadata"""
        return self.get(f"{CACHE_PREFIXES['video']}meta:{video_id}")

    def set_video_metadata(self, video_id: str, metadata: dict) -> bool:
        """Set cached video metadata"""
        return self.set(
            f"{CACHE_PREFIXES['video']}meta:{video_id}",
            metadata,
            CACHE_DEFAULTS["video_metadata"],
        )

    def invalidate_video(self, video_id: str) -> int:
        """Invalidate all cache for a video"""
        return self.delete_by_pattern(f"{CACHE_PREFIXES['video']}*:{video_id}")

    def get_metrics(self, metric_key: str) -> Optional[dict]:
        """Get cached metrics"""
        return self.get(f"{CACHE_PREFIXES['metrics']}{metric_key}")

    def set_metrics(self, metric_key: str, metrics: dict) -> bool:
        """Set cached metrics"""
        return self.set(
            f"{CACHE_PREFIXES['metrics']}{metric_key}",
            metrics,
            CACHE_DEFAULTS["metrics"],
        )

    def invalidate_metrics(self, prefix: str = "") -> int:
        """Invalidate metrics cache"""
        pattern = (
            f"{CACHE_PREFIXES['metrics']}{prefix}*"
            if prefix
            else f"{CACHE_PREFIXES['metrics']}*"
        )
        return self.delete_by_pattern(pattern)

    def increment_rate_limit(self, user_id: str, endpoint: str) -> int:
        """Increment rate limit counter"""
        key = f"{CACHE_PREFIXES['rate_limit']}{user_id}:{endpoint}"
        try:
            count = self.client.incr(key)
            # Set TTL if first call
            if count == 1:
                self.client.expire(key, CACHE_DEFAULTS["api_rate_limit"])
            return count
        except Exception as e:
            logger.warning(f"⚠️ Rate limit error: {e}")
            return 0

    def get_rate_limit_remaining(
        self, user_id: str, endpoint: str, max_requests: int = 100
    ) -> int:
        """Get remaining rate limit"""
        key = f"{CACHE_PREFIXES['rate_limit']}{user_id}:{endpoint}"
        try:
            count = int(self.client.get(key) or 0)
            return max(0, max_requests - count)
        except Exception as e:
            logger.warning(f"⚠️ Rate limit check error: {e}")
            return max_requests


# Global cache instance
_cache_instance: Optional[RedisCache] = None


def init_cache(redis_url: Optional[str] = None) -> RedisCache:
    """Initialize global cache instance"""
    global _cache_instance
    _cache_instance = RedisCache(redis_url)
    return _cache_instance


def get_cache() -> RedisCache:
    """Get global cache instance"""
    if _cache_instance is None:
        raise RuntimeError("Cache not initialized. Call init_cache() first.")
    return _cache_instance


# Cache decorator for functions
def cached(cache_key: str, ttl: int = 300):
    """Decorator to cache function results"""

    def decorator(func):
        async def async_wrapper(*args, **kwargs):
            cache = get_cache()

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_value

            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result

        def sync_wrapper(*args, **kwargs):
            cache = get_cache()

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_value

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result

        # Return appropriate wrapper
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
