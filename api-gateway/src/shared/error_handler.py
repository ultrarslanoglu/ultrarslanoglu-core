#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Standardized Error Handling
Unified error response format across API
"""

from flask import jsonify
from functools import wraps
from loguru import logger
from typing import Tuple, Dict, Any
from datetime import datetime
import traceback

# ========== ERROR CODES ==========

ERROR_CODES = {
    # Authentication errors (1000-1099)
    "AUTH_001": {"status": 401, "message": "Invalid credentials"},
    "AUTH_002": {"status": 401, "message": "Token expired"},
    "AUTH_003": {"status": 401, "message": "Invalid token"},
    "AUTH_004": {"status": 401, "message": "Email not verified"},
    "AUTH_005": {"status": 409, "message": "Email already registered"},
    "AUTH_006": {"status": 403, "message": "Insufficient permissions"},
    
    # Validation errors (2000-2099)
    "VAL_001": {"status": 400, "message": "Invalid input data"},
    "VAL_002": {"status": 400, "message": "Missing required field"},
    "VAL_003": {"status": 400, "message": "Invalid data type"},
    "VAL_004": {"status": 400, "message": "Data out of range"},
    "VAL_005": {"status": 422, "message": "Unprocessable entity"},
    
    # Resource errors (3000-3099)
    "RES_001": {"status": 404, "message": "Resource not found"},
    "RES_002": {"status": 409, "message": "Resource already exists"},
    "RES_003": {"status": 410, "message": "Resource deleted"},
    
    # Database errors (4000-4099)
    "DB_001": {"status": 500, "message": "Database connection error"},
    "DB_002": {"status": 500, "message": "Database query error"},
    "DB_003": {"status": 500, "message": "Database transaction error"},
    
    # Rate limiting errors (5000-5099)
    "RATE_001": {"status": 429, "message": "Rate limit exceeded"},
    "RATE_002": {"status": 429, "message": "Too many requests"},
    
    # Server errors (6000-6099)
    "SERVER_001": {"status": 500, "message": "Internal server error"},
    "SERVER_002": {"status": 503, "message": "Service unavailable"},
    "SERVER_003": {"status": 500, "message": "External service error"},
    
    # File errors (7000-7099)
    "FILE_001": {"status": 400, "message": "Invalid file format"},
    "FILE_002": {"status": 413, "message": "File too large"},
    "FILE_003": {"status": 500, "message": "File processing error"},
}

# ========== ERROR RESPONSE MODELS ==========

class APIError(Exception):
    """Base API error"""
    def __init__(self, error_code: str, message: str = None, details: Dict = None):
        self.error_code = error_code
        self.message = message or ERROR_CODES.get(error_code, {}).get("message", "Unknown error")
        self.status = ERROR_CODES.get(error_code, {}).get("status", 500)
        self.details = details or {}
        self.timestamp = datetime.utcnow().isoformat()
        super().__init__(self.message)

class ValidationError(APIError):
    """Validation error"""
    def __init__(self, message: str, field: str = None):
        super().__init__("VAL_001", message)
        if field:
            self.details["field"] = field

class AuthenticationError(APIError):
    """Authentication error"""
    def __init__(self, message: str = None):
        super().__init__("AUTH_001", message)

class AuthorizationError(APIError):
    """Authorization error"""
    def __init__(self, message: str = None):
        super().__init__("AUTH_006", message or "Insufficient permissions")

class NotFoundError(APIError):
    """Resource not found error"""
    def __init__(self, resource: str):
        super().__init__("RES_001", f"{resource} not found")
        self.details["resource"] = resource

class ConflictError(APIError):
    """Resource conflict error"""
    def __init__(self, message: str):
        super().__init__("RES_002", message)

class RateLimitError(APIError):
    """Rate limit exceeded"""
    def __init__(self, retry_after: int = None):
        super().__init__("RATE_001", "Rate limit exceeded")
        if retry_after:
            self.details["retry_after"] = retry_after

# ========== ERROR RESPONSE FORMAT ==========

def create_error_response(
    error_code: str,
    message: str = None,
    details: Dict = None,
    status_code: int = None
) -> Tuple[Dict, int]:
    """
    Create standardized error response
    """
    error_info = ERROR_CODES.get(error_code, {})
    status = status_code or error_info.get("status", 500)
    msg = message or error_info.get("message", "Unknown error")
    
    response = {
        "success": False,
        "error": {
            "code": error_code,
            "message": msg,
            "timestamp": datetime.utcnow().isoformat()
        }
    }
    
    if details:
        response["error"]["details"] = details
    
    return response, status

def create_success_response(data: Any = None, message: str = None) -> Dict:
    """Create standardized success response"""
    response = {
        "success": True,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response["data"] = data
    
    if message:
        response["message"] = message
    
    return response

# ========== ERROR HANDLERS ==========

def handle_api_error(func):
    """Decorator to handle API errors"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except APIError as e:
            logger.error(f"API Error [{e.error_code}]: {e.message}")
            response, status = create_error_response(
                e.error_code,
                e.message,
                e.details
            )
            return jsonify(response), status
        except ValueError as e:
            logger.error(f"Validation Error: {str(e)}")
            response, status = create_error_response(
                "VAL_001",
                str(e)
            )
            return jsonify(response), status
        except Exception as e:
            logger.error(f"Unexpected Error: {str(e)}\n{traceback.format_exc()}")
            response, status = create_error_response(
                "SERVER_001",
                "Internal server error"
            )
            return jsonify(response), status
    return wrapper

# ========== VALIDATION HELPERS ==========

def validate_required_fields(data: dict, required_fields: list) -> Tuple[bool, str]:
    """Validate required fields in request"""
    missing = [f for f in required_fields if f not in data or data[f] is None]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, ""

def validate_email_format(email: str) -> Tuple[bool, str]:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    return True, ""

def validate_uuid(uuid_str: str) -> Tuple[bool, str]:
    """Validate UUID format"""
    import uuid
    try:
        uuid.UUID(uuid_str)
        return True, ""
    except ValueError:
        return False, "Invalid UUID format"

def validate_date_range(start_date, end_date) -> Tuple[bool, str]:
    """Validate date range"""
    if start_date > end_date:
        return False, "Start date must be before end date"
    return True, ""

def validate_numeric_range(value: float, min_val: float = None, max_val: float = None) -> Tuple[bool, str]:
    """Validate numeric range"""
    if min_val is not None and value < min_val:
        return False, f"Value must be at least {min_val}"
    if max_val is not None and value > max_val:
        return False, f"Value must be at most {max_val}"
    return True, ""

# ========== BATCH ERROR HANDLING ==========

class BatchOperationResult:
    """Result of batch operation"""
    def __init__(self):
        self.successful = []
        self.failed = []
        self.errors = []
    
    def add_success(self, item_id: str, result: Any):
        """Add successful result"""
        self.successful.append({"id": item_id, "result": result})
    
    def add_failure(self, item_id: str, error_code: str, error_msg: str):
        """Add failed result"""
        self.failed.append({"id": item_id, "error_code": error_code})
        self.errors.append({"id": item_id, "error": error_msg})
    
    def to_response(self) -> Dict:
        """Convert to response format"""
        return {
            "success": len(self.failed) == 0,
            "summary": {
                "total": len(self.successful) + len(self.failed),
                "successful": len(self.successful),
                "failed": len(self.failed)
            },
            "results": self.successful,
            "errors": self.errors
        }

# ========== ERROR LOGGING ==========

def log_error(error: Exception, context: Dict = None):
    """Log error with context"""
    error_info = {
        "type": type(error).__name__,
        "message": str(error),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if context:
        error_info["context"] = context
    
    logger.error(f"Error occurred: {error_info}")
    
    # Log full traceback for debugging
    if isinstance(error, Exception):
        logger.debug(f"Traceback:\n{traceback.format_exc()}")
