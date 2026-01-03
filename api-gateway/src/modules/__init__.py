# API Gateway Module Exports
from .ai_editor import ai_editor_bp
from .analytics import analytics_bp
from .auth import auth_bp
from .automation import automation_bp
from .brand_kit import brand_kit_bp
from .iot import iot_bp
from .scheduler import scheduler_bp
from .video import video_bp

__all__ = [
    "auth_bp",
    "video_bp",
    "ai_editor_bp",
    "analytics_bp",
    "automation_bp",
    "brand_kit_bp",
    "scheduler_bp",
    "iot_bp",
]
