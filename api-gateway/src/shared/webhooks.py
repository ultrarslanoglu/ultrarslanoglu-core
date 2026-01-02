#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Social Media Webhook Handlers and Verification
Handles webhooks from Facebook/Meta, TikTok, Instagram vb.
"""

import hashlib
import hmac
import logging
import os
from datetime import datetime
from functools import wraps
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# ============================================
# WEBHOOK CONFIGURATION
# ============================================

WEBHOOK_TOKENS = {
    "facebook": os.getenv("FACEBOOK_WEBHOOK_VERIFY_TOKEN", "your_facebook_token"),
    "instagram": os.getenv("INSTAGRAM_WEBHOOK_VERIFY_TOKEN", "your_instagram_token"),
    "tiktok": os.getenv("TIKTOK_WEBHOOK_VERIFY_TOKEN", "your_tiktok_token"),
}

WEBHOOK_SECRETS = {
    "facebook": os.getenv("FACEBOOK_APP_SECRET", "your_facebook_secret"),
    "instagram": os.getenv("INSTAGRAM_APP_SECRET", "your_instagram_secret"),
    "tiktok": os.getenv("TIKTOK_CLIENT_SECRET", "your_tiktok_secret"),
}

# ============================================
# SIGNATURE VERIFICATION
# ============================================


def verify_webhook_signature(platform: str, payload: bytes, signature: str) -> bool:
    """
    Verify webhook signature from social media platform

    Args:
        platform: Social media platform (facebook, instagram, tiktok)
        payload: Request body as bytes
        signature: X-Hub-Signature or equivalent header

    Returns:
        True if signature is valid, False otherwise
    """
    if platform not in WEBHOOK_SECRETS:
        logger.warning(f"Unknown platform: {platform}")
        return False

    secret = WEBHOOK_SECRETS.get(platform, "")
    if not secret:
        logger.warning(f"No secret configured for {platform}")
        return False

    try:
        # Calculate expected signature
        expected_signature = hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()

        # Remove 'sha256=' prefix if present
        if signature.startswith("sha256="):
            signature = signature[7:]

        # Compare signatures (constant-time comparison)
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False


def verify_facebook_signature(request_signature: str, payload: bytes) -> bool:
    """Facebook webhook signature verification"""
    return verify_webhook_signature("facebook", payload, request_signature)


def verify_instagram_signature(request_signature: str, payload: bytes) -> bool:
    """Instagram webhook signature verification"""
    return verify_webhook_signature("instagram", payload, request_signature)


def verify_tiktok_signature(request_signature: str, payload: bytes) -> bool:
    """TikTok webhook signature verification"""
    return verify_webhook_signature("tiktok", payload, request_signature)


# ============================================
# WEBHOOK HANDLERS
# ============================================


class WebhookHandler:
    """Base webhook handler"""

    def __init__(self, platform: str):
        self.platform = platform
        self.logger = logging.getLogger(f"webhook.{platform}")

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle webhook event"""
        raise NotImplementedError

    def handle_challenge(self, challenge_data: str) -> Optional[str]:
        """Handle webhook challenge (for verification)"""
        return challenge_data


class FacebookWebhookHandler(WebhookHandler):
    """Handle Facebook/Meta webhooks"""

    def __init__(self):
        super().__init__("facebook")

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Facebook webhook"""
        try:
            if "entry" not in data:
                return {"status": "error", "message": "Invalid format"}

            results = []
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    event_data = self._parse_change(change)
                    if event_data:
                        results.append(event_data)

            self.logger.info(f"Processed {len(results)} Facebook events")
            return {"status": "success", "processed": len(results), "events": results}
        except Exception as e:
            self.logger.error(f"Error handling webhook: {e}")
            return {"status": "error", "message": str(e)}

    def _parse_change(self, change: Dict) -> Optional[Dict]:
        """Parse Facebook change object"""
        field = change.get("field")
        value = change.get("value", {})

        if field == "feed":
            return {
                "type": "post",
                "event": "new_post",
                "timestamp": datetime.now().isoformat(),
                "data": value,
            }
        elif field == "comments":
            return {
                "type": "comment",
                "event": "new_comment",
                "timestamp": datetime.now().isoformat(),
                "data": value,
            }
        elif field == "mentions":
            return {
                "type": "mention",
                "event": "mentioned",
                "timestamp": datetime.now().isoformat(),
                "data": value,
            }

        return None

    def handle_challenge(self, challenge_data: Dict) -> Optional[str]:
        """Handle Facebook challenge verification"""
        return challenge_data.get("challenge")


class InstagramWebhookHandler(WebhookHandler):
    """Handle Instagram webhooks"""

    def __init__(self):
        super().__init__("instagram")

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Instagram webhook"""
        try:
            if "entry" not in data:
                return {"status": "error", "message": "Invalid format"}

            results = []
            for entry in data.get("entry", []):
                for change in entry.get("changes", []):
                    event_data = self._parse_change(change)
                    if event_data:
                        results.append(event_data)

            self.logger.info(f"Processed {len(results)} Instagram events")
            return {"status": "success", "processed": len(results), "events": results}
        except Exception as e:
            self.logger.error(f"Error handling webhook: {e}")
            return {"status": "error", "message": str(e)}

    def _parse_change(self, change: Dict) -> Optional[Dict]:
        """Parse Instagram change object"""
        field = change.get("field")
        value = change.get("value", {})

        if field == "instagram_business_account":
            return {
                "type": "account",
                "event": "account_update",
                "timestamp": datetime.now().isoformat(),
                "data": value,
            }
        elif field == "instagram_nametag":
            return {
                "type": "nametag",
                "event": "nametag_scanned",
                "timestamp": datetime.now().isoformat(),
                "data": value,
            }

        return None

    def handle_challenge(self, challenge_data: Dict) -> Optional[str]:
        """Handle Instagram challenge verification"""
        return challenge_data.get("challenge")


class TikTokWebhookHandler(WebhookHandler):
    """Handle TikTok webhooks"""

    def __init__(self):
        super().__init__("tiktok")

    def handle_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle TikTok webhook"""
        try:
            if "data" not in data:
                return {"status": "error", "message": "Invalid format"}

            webhook_data = data.get("data", {})
            event_data = self._parse_event(webhook_data)

            self.logger.info(f"Processed TikTok event: {event_data.get('event')}")
            return {"status": "success", "event": event_data}
        except Exception as e:
            self.logger.error(f"Error handling webhook: {e}")
            return {"status": "error", "message": str(e)}

    def _parse_event(self, data: Dict) -> Dict:
        """Parse TikTok event"""
        event_type = data.get("type")

        return {
            "type": "tiktok",
            "event": event_type,
            "timestamp": datetime.now().isoformat(),
            "data": data,
        }

    def handle_challenge(self, challenge_data: Dict) -> Optional[str]:
        """Handle TikTok challenge verification"""
        return challenge_data.get("challenge")


# ============================================
# WEBHOOK FACTORY
# ============================================


def get_webhook_handler(platform: str) -> Optional[WebhookHandler]:
    """Get appropriate webhook handler for platform"""
    handlers = {
        "facebook": FacebookWebhookHandler,
        "instagram": InstagramWebhookHandler,
        "tiktok": TikTokWebhookHandler,
    }

    handler_class = handlers.get(platform)
    if handler_class:
        return handler_class()

    logger.warning(f"No handler for platform: {platform}")
    return None


# ============================================
# DECORATOR FOR WEBHOOK ENDPOINTS
# ============================================


def webhook_endpoint(platform: str):
    """Decorator to handle webhook verification and processing"""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extract platform from kwargs or args
            request = kwargs.get("request") or (args[0] if args else None)

            if not request:
                return {"status": "error", "message": "No request"}

            # Verify signature
            signature = (
                request.headers.get("X-Hub-Signature")
                or request.headers.get("X-Signature")
                or request.headers.get("Signature")
            )

            if signature and hasattr(request, "body"):
                if not verify_webhook_signature(platform, request.body, signature):
                    logger.warning(f"Invalid signature from {platform}")
                    return {"status": "error", "message": "Invalid signature"}, 401

            # Call original function
            return func(*args, **kwargs)

        return wrapper

    return decorator


# ============================================
# WEBHOOK EVENT MODELS
# ============================================


class WebhookEvent:
    """Webhook event model"""

    def __init__(
        self,
        platform: str,
        event_type: str,
        data: Dict,
        timestamp: Optional[str] = None,
    ):
        self.platform = platform
        self.event_type = event_type
        self.data = data
        self.timestamp = timestamp or datetime.now().isoformat()
        self.id = self._generate_event_id()

    def _generate_event_id(self) -> str:
        """Generate unique event ID"""
        import uuid

        return f"{self.platform}_{self.event_type}_{uuid.uuid4().hex[:8]}"

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "platform": self.platform,
            "event_type": self.event_type,
            "data": self.data,
            "timestamp": self.timestamp,
        }


# ============================================
# WEBHOOK LOGGER
# ============================================


class WebhookLogger:
    """Log webhook events to database"""

    def __init__(self, db):
        self.db = db

    def log_event(self, event: WebhookEvent) -> bool:
        """Log webhook event"""
        try:
            self.db.webhook_logs.insert_one(
                {
                    "id": event.id,
                    "platform": event.platform,
                    "event_type": event.event_type,
                    "data": event.data,
                    "timestamp": datetime.fromisoformat(event.timestamp),
                    "created_at": datetime.now(),
                }
            )
            logger.info(f"Logged event: {event.id}")
            return True
        except Exception as e:
            logger.error(f"Error logging event: {e}")
            return False

    def get_events(self, platform: str, limit: int = 100) -> list:
        """Get recent events for platform"""
        try:
            return list(
                self.db.webhook_logs.find(
                    {"platform": platform}, sort=[("timestamp", -1)], limit=limit
                )
            )
        except Exception as e:
            logger.error(f"Error retrieving events: {e}")
            return []
