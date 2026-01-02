#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rate Limiting Middleware
Redis-based request rate limiting
"""

from flask import request, jsonify
from functools import wraps
from loguru import logger
from datetime import datetime, timedelta
import redis
import os
from typing import Tuple, Optional

# ========== REDIS SETUP ==========

redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
    logger.info("✅ Redis connected for rate limiting")
except Exception as e:
    REDIS_AVAILABLE = False
    logger.warning(f"⚠️  Redis not available for rate limiting: {e}")

# ========== RATE LIMIT CONFIGURATIONS ==========

RATE_LIMITS = {
    # Global limits
    "global": {"requests": 1000, "window": 60},  # 1000 per minute
    
    # Per-endpoint limits
    "auth.login": {"requests": 10, "window": 60},  # 10 per minute
    "auth.register": {"requests": 5, "window": 3600},  # 5 per hour
    "auth.password_reset": {"requests": 3, "window": 3600},  # 3 per hour
    
    # API limits
    "api.video.upload": {"requests": 5, "window": 3600},  # 5 per hour
    "api.video.process": {"requests": 20, "window": 3600},  # 20 per hour
    "api.ai_editor.analyze": {"requests": 10, "window": 3600},  # 10 per hour
    "api.analytics.metrics": {"requests": 100, "window": 60},  # 100 per minute
    
    # Public endpoints (no limit)
    "public": None
}

# ========== RATE LIMITER CLASS ==========

class RateLimiter:
    """Rate limiter using Redis"""
    
    def __init__(self, redis_client=None):
        self.redis = redis_client
    
    def get_identifier(self, request_obj) -> str:
        """Get unique identifier for request"""
        # Prefer X-Forwarded-For (for proxied requests)
        if request_obj.headers.get('X-Forwarded-For'):
            return request_obj.headers.get('X-Forwarded-For').split(',')[0].strip()
        # Fallback to remote address
        return request_obj.remote_addr or "unknown"
    
    def get_rate_limit_key(self, identifier: str, endpoint: str) -> str:
        """Generate rate limit key for Redis"""
        return f"rate_limit:{endpoint}:{identifier}"
    
    def is_rate_limited(
        self,
        identifier: str,
        endpoint: str,
        requests: int = 100,
        window: int = 60
    ) -> Tuple[bool, dict]:
        """
        Check if identifier is rate limited
        Returns: (is_limited, metadata)
        """
        if not self.redis or not REDIS_AVAILABLE:
            return False, {"rate_limit_available": False}
        
        try:
            key = self.get_rate_limit_key(identifier, endpoint)
            current = self.redis.incr(key)
            
            # Set expiry on first request
            if current == 1:
                self.redis.expire(key, window)
            
            # Get remaining time
            ttl = self.redis.ttl(key)
            
            metadata = {
                "limit": requests,
                "current": current,
                "remaining": max(0, requests - current),
                "reset_in": ttl,
                "window": window
            }
            
            is_limited = current > requests
            return is_limited, metadata
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            return False, {"error": str(e)}
    
    def reset_limit(self, identifier: str, endpoint: str):
        """Reset rate limit for identifier"""
        if not self.redis or not REDIS_AVAILABLE:
            return
        
        try:
            key = self.get_rate_limit_key(identifier, endpoint)
            self.redis.delete(key)
        except Exception as e:
            logger.error(f"Error resetting rate limit: {e}")

# ========== GLOBAL RATE LIMITER INSTANCE ==========

rate_limiter = RateLimiter(redis_client if REDIS_AVAILABLE else None)

# ========== DECORATORS ==========

def rate_limit(endpoint: str = None, requests: int = None, window: int = None):
    """
    Rate limiting decorator
    Usage:
        @app.route('/api/endpoint')
        @rate_limit('api.endpoint', requests=100, window=60)
        def my_endpoint():
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Determine endpoint name
            ep = endpoint or f"{request.endpoint}"
            
            # Get rate limit config
            config = RATE_LIMITS.get(ep) or RATE_LIMITS.get("global")
            
            # Skip if no limit configured
            if config is None:
                return func(*args, **kwargs)
            
            # Override with function parameters
            req_limit = requests or config.get("requests", 100)
            time_window = window or config.get("window", 60)
            
            # Check rate limit
            identifier = rate_limiter.get_identifier(request)
            is_limited, metadata = rate_limiter.is_rate_limited(
                identifier, ep, req_limit, time_window
            )
            
            if is_limited:
                logger.warning(f"⚠️  Rate limit exceeded: {identifier} on {ep}")
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "RATE_001",
                        "message": "Rate limit exceeded",
                        "retry_after": metadata.get("reset_in", time_window)
                    }
                }), 429
            
            # Add rate limit headers to response
            # This will be handled in response wrapper
            request.rate_limit_metadata = metadata
            
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

def global_rate_limit():
    """Global rate limiting for all requests"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            identifier = rate_limiter.get_identifier(request)
            is_limited, metadata = rate_limiter.is_rate_limited(
                identifier,
                "global",
                RATE_LIMITS["global"]["requests"],
                RATE_LIMITS["global"]["window"]
            )
            
            if is_limited:
                logger.warning(f"⚠️  Global rate limit: {identifier}")
                return jsonify({
                    "success": False,
                    "error": {
                        "code": "RATE_001",
                        "message": "API rate limit exceeded"
                    }
                }), 429
            
            request.rate_limit_metadata = metadata
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

# ========== MIDDLEWARE REGISTRATION ==========

def init_rate_limiting(app):
    """Initialize rate limiting for Flask app"""
    
    @app.before_request
    def check_rate_limit():
        """Check rate limit for every request"""
        if not REDIS_AVAILABLE:
            return
        
        # Skip health check
        if request.path == '/health':
            return
        
        identifier = rate_limiter.get_identifier(request)
        endpoint = request.endpoint or request.path
        
        config = RATE_LIMITS.get(endpoint) or RATE_LIMITS.get("global")
        
        if config is None:
            return
        
        is_limited, metadata = rate_limiter.is_rate_limited(
            identifier,
            endpoint,
            config.get("requests", 100),
            config.get("window", 60)
        )
        
        request.rate_limit_metadata = metadata
        
        if is_limited:
            return jsonify({
                "success": False,
                "error": {
                    "code": "RATE_001",
                    "message": "Rate limit exceeded"
                }
            }), 429
    
    @app.after_request
    def add_rate_limit_headers(response):
        """Add rate limit headers to response"""
        if hasattr(request, 'rate_limit_metadata'):
            metadata = request.rate_limit_metadata
            response.headers['X-RateLimit-Limit'] = str(metadata.get('limit', 'N/A'))
            response.headers['X-RateLimit-Remaining'] = str(metadata.get('remaining', 0))
            response.headers['X-RateLimit-Reset'] = str(metadata.get('reset_in', 0))
        
        return response

# ========== RATE LIMIT INFO ENDPOINT ==========

def get_rate_limit_status():
    """Get current rate limit status"""
    identifier = rate_limiter.get_identifier(request)
    endpoint = request.endpoint or request.path
    
    config = RATE_LIMITS.get(endpoint)
    
    if config is None:
        return {
            "success": True,
            "message": "No rate limit for this endpoint"
        }
    
    _, metadata = rate_limiter.is_rate_limited(
        identifier,
        endpoint,
        config.get("requests", 100),
        config.get("window", 60)
    )
    
    return {
        "success": True,
        "rate_limit": metadata
    }

# ========== UTILITY FUNCTIONS ==========

def get_all_limits() -> dict:
    """Get all configured rate limits"""
    return RATE_LIMITS

def update_limit(endpoint: str, requests: int, window: int):
    """Update rate limit for endpoint"""
    RATE_LIMITS[endpoint] = {"requests": requests, "window": window}
    logger.info(f"Updated rate limit for {endpoint}: {requests}/{window}s")

def disable_limit(endpoint: str):
    """Disable rate limit for endpoint"""
    RATE_LIMITS[endpoint] = None
    logger.info(f"Disabled rate limit for {endpoint}")

def reset_all_limits():
    """Reset all rate limits in Redis"""
    if not REDIS_AVAILABLE:
        logger.warning("Redis not available")
        return
    
    try:
        # Delete all rate limit keys
        pattern = "rate_limit:*"
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
        logger.info(f"Reset {len(keys)} rate limit entries")
    except Exception as e:
        logger.error(f"Error resetting limits: {e}")
