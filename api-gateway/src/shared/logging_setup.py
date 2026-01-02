#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Structured Logging Sistemi
Loguru entegrasyonu, context-aware logging, performance tracking
"""

from loguru import logger
import sys
import os
from datetime import datetime
import json
from functools import wraps
from flask import g, request


class LogConfig:
    """Logging konfigürasyonu"""
    
    # Log seviyeleri
    LOG_LEVELS = {
        'DEBUG': 'DEBUG',
        'INFO': 'INFO',
        'WARNING': 'WARNING',
        'ERROR': 'ERROR',
        'CRITICAL': 'CRITICAL'
    }
    
    # Log dizini
    LOG_DIR = os.path.join(os.path.dirname(__file__), '../../logs')
    
    # Log dosya formatı
    LOG_FORMAT = (
        "<level>[{time:YYYY-MM-DD HH:mm:ss.SSS}]</level> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    
    # JSON format (production)
    LOG_JSON_FORMAT = {
        "timestamp": "{time:YYYY-MM-DD HH:mm:ss.SSS}",
        "level": "{level}",
        "module": "{name}",
        "function": "{function}",
        "line": "{line}",
        "message": "{message}",
        "request_id": "{request_id}",
        "user_id": "{user_id}",
        "duration_ms": "{duration_ms}"
    }


def setup_logging(app, config=None):
    """Logging sistemini kur"""
    
    # Create log directory
    os.makedirs(LogConfig.LOG_DIR, exist_ok=True)
    
    # Remove default handlers
    logger.remove()
    
    # Console handler (development)
    logger.add(
        sys.stdout,
        format=LogConfig.LOG_FORMAT,
        level=os.getenv('LOG_LEVEL', 'INFO'),
        colorize=True
    )
    
    # File handler - general
    logger.add(
        os.path.join(LogConfig.LOG_DIR, "api_gateway.log"),
        format=LogConfig.LOG_FORMAT,
        level="INFO",
        rotation="500 MB",
        retention="30 days"
    )
    
    # File handler - errors
    logger.add(
        os.path.join(LogConfig.LOG_DIR, "errors.log"),
        format=LogConfig.LOG_FORMAT,
        level="ERROR",
        rotation="500 MB",
        retention="90 days"
    )
    
    # File handler - performance
    logger.add(
        os.path.join(LogConfig.LOG_DIR, "performance.log"),
        format=LogConfig.LOG_FORMAT,
        level="INFO",
        rotation="500 MB",
        retention="30 days",
        filter=lambda record: "PERF:" in record["message"]
    )
    
    # File handler - audit
    logger.add(
        os.path.join(LogConfig.LOG_DIR, "audit.log"),
        format=LogConfig.LOG_FORMAT,
        level="INFO",
        rotation="500 MB",
        retention="365 days",
        filter=lambda record: "AUDIT:" in record["message"]
    )
    
    logger.info("✅ Logging sistemi kuruldu")


def get_request_context():
    """Request context'i getir"""
    context = {
        "request_id": getattr(g, 'request_id', 'N/A'),
        "user_id": getattr(g, 'user_id', 'anonymous'),
        "method": request.method if request else 'N/A',
        "path": request.path if request else 'N/A',
        "remote_addr": request.remote_addr if request else 'N/A'
    }
    return context


def log_with_context(level, message, context=None, **kwargs):
    """Context ile log tut"""
    ctx = get_request_context()
    if context:
        ctx.update(context)
    
    log_func = getattr(logger, level.lower())
    log_func(f"{message} | Context: {json.dumps(ctx)}")


# Logging decorators

def log_function_call(level='INFO'):
    """Fonksiyon çağrısını logla"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            func_name = func.__name__
            logger.log(level, f"→ Calling {func_name}")
            
            try:
                result = func(*args, **kwargs)
                logger.log(level, f"← {func_name} completed successfully")
                return result
            except Exception as e:
                logger.error(f"✗ {func_name} failed: {str(e)}")
                raise
        
        return wrapper
    return decorator


def log_performance(threshold_ms=100):
    """Performans loglaması (yavaş işler için uyarı)"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import time
            start = time.time()
            
            try:
                result = func(*args, **kwargs)
                elapsed_ms = (time.time() - start) * 1000
                
                if elapsed_ms > threshold_ms:
                    logger.warning(
                        f"PERF: {func.__name__} took {elapsed_ms:.1f}ms "
                        f"(threshold: {threshold_ms}ms)"
                    )
                else:
                    logger.debug(f"PERF: {func.__name__} took {elapsed_ms:.1f}ms")
                
                return result
            except Exception as e:
                elapsed_ms = (time.time() - start) * 1000
                logger.error(f"PERF: {func.__name__} failed after {elapsed_ms:.1f}ms")
                raise
        
        return wrapper
    return decorator


def log_audit_event(action, resource, status, details=None):
    """Audit event logla"""
    audit_log = {
        "action": action,
        "resource": resource,
        "status": status,
        "user_id": getattr(g, 'user_id', 'anonymous'),
        "timestamp": datetime.utcnow().isoformat(),
        "ip": request.remote_addr if request else 'N/A',
        "details": details or {}
    }
    
    logger.info(f"AUDIT: {json.dumps(audit_log)}")


def log_database_operation(operation, collection, query, duration_ms):
    """Database operasyonunu logla"""
    logger.debug(
        f"DB: {operation} on {collection} | "
        f"Query: {query} | Duration: {duration_ms:.1f}ms"
    )


def log_api_error(error_code, error_message, status_code, context=None):
    """API hatasını logla"""
    error_log = {
        "error_code": error_code,
        "error_message": error_message,
        "status_code": status_code,
        "request_id": getattr(g, 'request_id', 'N/A'),
        "user_id": getattr(g, 'user_id', 'anonymous'),
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if context:
        error_log["context"] = context
    
    logger.error(f"API_ERROR: {json.dumps(error_log)}")


def log_external_api_call(service, method, url, status_code, duration_ms):
    """Harici API çağrısını logla"""
    logger.info(
        f"EXT_API: {service} | {method} {url} | "
        f"Status: {status_code} | Duration: {duration_ms:.1f}ms"
    )


def log_security_event(event_type, details):
    """Güvenlik olayını logla"""
    security_log = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": getattr(g, 'user_id', 'anonymous'),
        "ip": request.remote_addr if request else 'N/A',
        "details": details
    }
    
    logger.warning(f"SECURITY: {json.dumps(security_log)}")


# Context-aware logging classes

class OperationLogger:
    """Operasyon loglaması (with context)"""
    
    def __init__(self, operation_name, user_id=None):
        self.operation_name = operation_name
        self.user_id = user_id or getattr(g, 'user_id', 'anonymous')
        self.start_time = None
    
    def __enter__(self):
        import time
        self.start_time = time.time()
        logger.info(f"START: {self.operation_name} (user: {self.user_id})")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        duration_ms = (time.time() - self.start_time) * 1000
        
        if exc_type:
            logger.error(
                f"FAILED: {self.operation_name} after {duration_ms:.1f}ms | "
                f"Error: {exc_val}"
            )
        else:
            logger.info(
                f"SUCCESS: {self.operation_name} completed in {duration_ms:.1f}ms"
            )


class StructuredLogger:
    """Yapılandırılmış logla (JSON format)"""
    
    @staticmethod
    def info(message, **context):
        """Info logla"""
        ctx = get_request_context()
        ctx.update(context)
        logger.info(f"{message} | {json.dumps(ctx)}")
    
    @staticmethod
    def warning(message, **context):
        """Warning logla"""
        ctx = get_request_context()
        ctx.update(context)
        logger.warning(f"{message} | {json.dumps(ctx)}")
    
    @staticmethod
    def error(message, exception=None, **context):
        """Error logla"""
        ctx = get_request_context()
        ctx.update(context)
        if exception:
            ctx["exception"] = str(exception)
        logger.error(f"{message} | {json.dumps(ctx)}")


# Performance metrics

class MetricsCollector:
    """Performans metrikleri topla"""
    
    @staticmethod
    def record_endpoint_metric(endpoint, method, status_code, duration_ms):
        """Endpoint metrikleri kaydet"""
        logger.debug(
            f"METRIC: endpoint={endpoint} method={method} "
            f"status={status_code} duration_ms={duration_ms:.1f}"
        )
    
    @staticmethod
    def record_database_metric(operation, collection, duration_ms):
        """Database metrikleri kaydet"""
        logger.debug(
            f"METRIC: db_operation={operation} collection={collection} "
            f"duration_ms={duration_ms:.1f}"
        )
    
    @staticmethod
    def record_cache_metric(key, operation, hit, duration_ms):
        """Cache metrikleri kaydet"""
        logger.debug(
            f"METRIC: cache_key={key} operation={operation} "
            f"hit={hit} duration_ms={duration_ms:.1f}"
        )


logger.info("✅ Logging modülü yüklendi")
