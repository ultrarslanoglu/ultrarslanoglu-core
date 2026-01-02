#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Request Validation Layer
Pydantic models for all API endpoints
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# ========== AUTH MODELS ==========

class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    name: str = Field(..., min_length=2, max_length=100, description="User name")
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password strength"""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., description="User password")

class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User email")

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation"""
    token: str = Field(..., description="Reset token")
    new_password: str = Field(..., min_length=8, description="New password")

class EmailVerificationRequest(BaseModel):
    """Email verification request"""
    user_id: str = Field(..., description="User ID")
    verification_code: str = Field(..., description="Verification code")

# ========== VIDEO MODELS ==========

class VideoUploadRequest(BaseModel):
    """Video upload metadata"""
    title: str = Field(..., min_length=3, max_length=200, description="Video title")
    description: Optional[str] = Field(None, max_length=1000, description="Video description")
    tags: Optional[List[str]] = Field(default_factory=list, description="Video tags")
    is_public: bool = Field(default=False, description="Public visibility")

class VideoProcessRequest(BaseModel):
    """Video processing request"""
    video_id: str = Field(..., description="Video ID")
    operations: List[Dict[str, Any]] = Field(..., description="Processing operations")
    priority: Optional[str] = Field("normal", pattern="^(low|normal|high)$")

class TranscodeRequest(BaseModel):
    """Video transcoding request"""
    video_id: str = Field(..., description="Video ID")
    target_format: str = Field(..., pattern="^(mp4|webm|mkv|avi)$", description="Target format")
    quality: Optional[str] = Field("medium", pattern="^(low|medium|high|ultra)$")

# ========== AI EDITOR MODELS ==========

class AIAnalysisRequest(BaseModel):
    """AI video analysis request"""
    video_id: str = Field(..., description="Video ID to analyze")
    analysis_type: Optional[str] = Field("general", description="Type of analysis")
    include_transcript: bool = Field(default=False, description="Include transcript")

class AIEditingRequest(BaseModel):
    """AI video editing request"""
    video_id: str = Field(..., description="Video ID")
    edits: List[Dict[str, Any]] = Field(..., description="Edit instructions")
    auto_cut: bool = Field(default=False, description="Auto-cut silence/pauses")
    auto_caption: bool = Field(default=False, description="Auto-generate captions")

# ========== ANALYTICS MODELS ==========

class MetricRequest(BaseModel):
    """Metric submission request"""
    platform: str = Field(..., description="Platform name (instagram, tiktok, youtube, etc)")
    metric_type: str = Field(..., description="Metric type (views, likes, shares, etc)")
    value: float = Field(..., gt=0, description="Metric value")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class MetricQueryParams(BaseModel):
    """Metric query parameters"""
    platform: Optional[str] = None
    metric_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=1000)

class InsightGenerationRequest(BaseModel):
    """AI insight generation request"""
    data_summary: Dict[str, Any] = Field(..., description="Data summary for analysis")
    insight_type: str = Field(default="general", description="Type of insight")
    time_period: str = Field(default="7d", pattern="^(1d|7d|30d|90d|1y)$")

class ReportRequest(BaseModel):
    """Report creation request"""
    title: str = Field(..., min_length=3, max_length=200)
    metrics: List[str] = Field(..., min_items=1, description="Metrics to include")
    date_range: str = Field("7d", pattern="^(1d|7d|30d|90d|1y)$")
    format: str = Field("pdf", pattern="^(pdf|xlsx|csv)$")

# ========== AUTOMATION MODELS ==========

class AutomationTaskRequest(BaseModel):
    """Automation task creation"""
    task_type: str = Field(..., description="Task type")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Task parameters")
    schedule: Optional[str] = None
    cron_expression: Optional[str] = None
    enabled: bool = Field(default=True)

class WorkflowRequest(BaseModel):
    """Workflow creation request"""
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    steps: List[Dict[str, Any]] = Field(..., min_items=1)
    trigger: Dict[str, Any] = Field(..., description="Workflow trigger")
    enabled: bool = Field(default=True)

# ========== BRAND KIT MODELS ==========

class BrandTemplateRequest(BaseModel):
    """Brand template creation"""
    name: str = Field(..., min_length=3, max_length=100)
    category: str = Field(..., pattern="^(video|social|email|print)$")
    template_data: Dict[str, Any] = Field(..., description="Template data")
    tags: Optional[List[str]] = None

class ColorPaletteRequest(BaseModel):
    """Brand color palette"""
    primary_color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
    secondary_color: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")
    accent_colors: Optional[List[str]] = Field(None)

# ========== SCHEDULER MODELS ==========

class ScheduleContentRequest(BaseModel):
    """Content scheduling request"""
    content: Dict[str, Any] = Field(..., description="Content to schedule")
    scheduled_time: datetime = Field(..., description="Scheduled time")
    platforms: List[str] = Field(..., min_items=1, description="Target platforms")
    timezone: str = Field("Europe/Istanbul", description="Timezone")

class RecurringScheduleRequest(BaseModel):
    """Recurring schedule request"""
    content: Dict[str, Any] = Field(...)
    start_time: datetime = Field(...)
    recurrence: str = Field(..., pattern="^(daily|weekly|monthly|yearly)$")
    end_date: Optional[datetime] = None
    platforms: List[str] = Field(..., min_items=1)

class CalendarQueryParams(BaseModel):
    """Calendar query parameters"""
    start_date: datetime = Field(...)
    end_date: datetime = Field(...)
    platform: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(scheduled|published|draft)$")

# ========== PAGINATED RESPONSE MODELS ==========

class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    success: bool
    data: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field("asc", pattern="^(asc|desc)$")

# ========== BATCH OPERATION MODELS ==========

class BatchVideoProcessRequest(BaseModel):
    """Batch video processing"""
    video_ids: List[str] = Field(..., min_items=1, max_items=50)
    operations: List[Dict[str, Any]] = Field(...)
    parallel: bool = Field(default=False)

class BatchMetricRequest(BaseModel):
    """Batch metric submission"""
    metrics: List[MetricRequest] = Field(..., min_items=1, max_items=100)

# ========== UTILITY FUNCTIONS ==========

def validate_request_payload(model_class, payload: dict) -> tuple[bool, Any, str]:
    """
    Validate request payload against model
    Returns: (is_valid, data, error_message)
    """
    try:
        validated_data = model_class(**payload)
        return True, validated_data, ""
    except Exception as e:
        return False, None, str(e)
