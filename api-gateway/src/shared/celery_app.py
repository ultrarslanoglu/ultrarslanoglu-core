#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Celery task queue configuration
Background job processing
"""

import os
from celery import Celery
from loguru import logger

# Global celery instance - preemptively create
celery = Celery(
    'ultrarslanoglu',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Default configuration
celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Istanbul',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3000,  # 50 minutes
)


def init_celery(config):
    """Celery'yi başlat"""
    try:
        redis_url = os.getenv('REDIS_URL', config.get('redis', {}).get('connection_string', 'redis://localhost:6379'))
        
        celery.conf.update(
            broker_url=redis_url,
            result_backend=redis_url,
        )
        
        logger.info("✅ Celery başlatıldı")
    except Exception as e:
        logger.error(f"❌ Celery başlatma hatası: {e}")
        raise


def get_celery():
    """Celery instance'ını döndür"""
    return celery
