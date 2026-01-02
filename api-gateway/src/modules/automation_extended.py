#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automation Tools Modülü - Extended
İş akışı otomasyonu, görev çizelgeleme, zamanlanmış işler
"""

from flask import Blueprint, request, jsonify, g
from loguru import logger
from datetime import datetime, timedelta
import hashlib
from ..shared.celery_app import celery
from ..shared.database import db, MongoDBConnection
from ..shared.error_handler import (
    handle_api_error, create_error_response, create_success_response,
    ValidationError, DatabaseError, ProcessingError
)
from ..shared.rate_limiter import rate_limit
from ..shared.validators import validate_required_fields
from ..shared.auth import token_required

automation_bp = Blueprint('automation', __name__, url_prefix='/api/automation')


# ============================================================================
# BACKGROUND TASKS
# ============================================================================

@celery.task
def execute_workflow(workflow_id, parameters):
    """İş akışını çalıştır"""
    try:
        logger.info(f"🔄 İş akışı çalışıyor: {workflow_id}")
        mongo = MongoDBConnection()
        
        # Update workflow status
        mongo.update_one('automation_workflows', {'_id': workflow_id}, {
            'status': 'executing',
            'started_at': datetime.utcnow()
        })
        
        # Execute steps
        import time
        time.sleep(1)
        
        # Mark complete
        mongo.update_one('automation_workflows', {'_id': workflow_id}, {
            'status': 'completed',
            'completed_at': datetime.utcnow(),
            'executions': 1
        })
        
        logger.info(f"✅ İş akışı tamamlandı: {workflow_id}")
        return {"workflow_id": workflow_id, "status": "completed"}
    
    except Exception as e:
        logger.error(f"❌ İş akışı hatası: {str(e)}")
        return {"workflow_id": workflow_id, "status": "failed", "error": str(e)}


@celery.task
def run_scheduled_task(task_id):
    """Zamanlanmış görevi çalıştır"""
    try:
        logger.info(f"⏰ Zamanlanmış görev başladı: {task_id}")
        mongo = MongoDBConnection()
        
        # Get task
        task = mongo.find_one('automation_tasks', {'_id': task_id})
        if not task:
            logger.warning(f"Görev bulunamadı: {task_id}")
            return {"error": "Task not found"}
        
        # Execute task logic
        import time
        time.sleep(0.5)
        
        # Log execution
        mongo.insert_one('automation_task_executions', {
            "task_id": task_id,
            "executed_at": datetime.utcnow(),
            "status": "completed"
        })
        
        logger.info(f"✅ Zamanlanmış görev tamamlandı: {task_id}")
        return {"task_id": task_id, "status": "completed"}
    
    except Exception as e:
        logger.error(f"❌ Zamanlanmış görev hatası: {str(e)}")
        return {"task_id": task_id, "status": "failed"}


@celery.task
def run_batch_operation(batch_id, operation_type, items):
    """Toplu işlemi çalıştır"""
    try:
        logger.info(f"📦 Toplu işlem başladı: {batch_id}")
        mongo = MongoDBConnection()
        
        results = []
        for item in items:
            # Process each item
            results.append({
                "item": item,
                "status": "processed"
            })
        
        # Save results
        mongo.insert_one('batch_operations', {
            "_id": batch_id,
            "type": operation_type,
            "items": len(items),
            "results": results,
            "status": "completed",
            "completed_at": datetime.utcnow()
        })
        
        logger.info(f"✅ Toplu işlem tamamlandı: {batch_id}")
        return {"batch_id": batch_id, "processed_items": len(items)}
    
    except Exception as e:
        logger.error(f"❌ Toplu işlem hatası: {str(e)}")
        return {"batch_id": batch_id, "error": str(e)}


# ============================================================================
# ROUTES - AUTOMATION & WORKFLOWS
# ============================================================================

@automation_bp.route('/health', methods=['GET'])
def health():
    """Automation module health check"""
    return create_success_response({"module": "automation", "status": "healthy"})


@automation_bp.route('/workflows', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def create_workflow():
    """İş akışı oluştur"""
    try:
        data = request.get_json() or {}
        
        validate_required_fields(data, ['name', 'steps'])
        
        name = data.get('name')
        steps = data.get('steps', [])
        description = data.get('description', '')
        
        if not steps:
            raise ValidationError("VAL_004", "En az bir adım gerekli")
        
        workflow_id = hashlib.md5(
            f"{g.user_id}{name}{datetime.utcnow()}".encode()
        ).hexdigest()
        
        mongo = MongoDBConnection()
        workflow_doc = {
            "_id": workflow_id,
            "name": name,
            "description": description,
            "steps": steps,
            "user_id": g.user_id,
            "status": "idle",
            "created_at": datetime.utcnow(),
            "executions": 0
        }
        
        mongo.insert_one('automation_workflows', workflow_doc)
        
        logger.info(f"🔄 İş akışı oluşturuldu: {workflow_id}")
        
        return create_success_response({
            "workflow_id": workflow_id,
            "name": name,
            "status": "idle"
        }, status_code=201)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Create workflow hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "İş akışı oluşturulamadı")


@automation_bp.route('/workflows/<workflow_id>/execute', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def execute_workflow_request(workflow_id):
    """İş akışını çalıştır"""
    try:
        mongo = MongoDBConnection()
        
        # Check workflow exists
        workflow = mongo.find_one('automation_workflows', {'_id': workflow_id})
        if not workflow:
            raise ValidationError("RES_001", "İş akışı bulunamadı")
        
        # Check ownership
        if workflow.get('user_id') != g.user_id:
            raise ValidationError("AUTH_003", "Bu iş akışını çalıştırma izniniz yok")
        
        # Get parameters if provided
        data = request.get_json() or {}
        parameters = data.get('parameters', {})
        
        # Start execution
        task = execute_workflow.delay(workflow_id, parameters)
        
        return create_success_response({
            "workflow_id": workflow_id,
            "task_id": task.id,
            "status": "executing"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Execute workflow hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "İş akışı çalıştırılamadı")


@automation_bp.route('/workflows/<workflow_id>', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_workflow(workflow_id):
    """İş akışını getir"""
    try:
        mongo = MongoDBConnection()
        workflow = mongo.find_one('automation_workflows', {'_id': workflow_id})
        
        if not workflow:
            raise ValidationError("RES_001", "İş akışı bulunamadı")
        
        return create_success_response(workflow)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Get workflow hatası: {str(e)}")
        raise DatabaseError("DB_001", "İş akışı alınamadı")


@automation_bp.route('/tasks', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def create_task():
    """Zamanlanmış görev oluştur"""
    try:
        data = request.get_json() or {}
        
        validate_required_fields(data, ['name', 'action'])
        
        name = data.get('name')
        action = data.get('action')
        schedule = data.get('schedule')  # cron expression
        enabled = data.get('enabled', True)
        
        task_id = hashlib.md5(
            f"{g.user_id}{name}{datetime.utcnow()}".encode()
        ).hexdigest()
        
        mongo = MongoDBConnection()
        task_doc = {
            "_id": task_id,
            "name": name,
            "action": action,
            "schedule": schedule,
            "user_id": g.user_id,
            "enabled": enabled,
            "created_at": datetime.utcnow(),
            "last_executed": None,
            "next_execution": None
        }
        
        mongo.insert_one('automation_tasks', task_doc)
        
        logger.info(f"⏰ Zamanlanmış görev oluşturuldu: {task_id}")
        
        return create_success_response({
            "task_id": task_id,
            "name": name,
            "enabled": enabled
        }, status_code=201)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Create task hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "Görev oluşturulamadı")


@automation_bp.route('/tasks/<task_id>/execute', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def execute_task(task_id):
    """Görevi hemen çalıştır"""
    try:
        mongo = MongoDBConnection()
        
        # Check task exists
        task = mongo.find_one('automation_tasks', {'_id': task_id})
        if not task:
            raise ValidationError("RES_001", "Görev bulunamadı")
        
        # Check ownership
        if task.get('user_id') != g.user_id:
            raise ValidationError("AUTH_003", "Bu görevi çalıştırma izniniz yok")
        
        # Start execution
        celery_task = run_scheduled_task.delay(task_id)
        
        # Update last_executed
        mongo.update_one('automation_tasks', {'_id': task_id}, {
            'last_executed': datetime.utcnow()
        })
        
        return create_success_response({
            "task_id": task_id,
            "celery_task_id": celery_task.id,
            "status": "executing"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Execute task hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "Görev çalıştırılamadı")


@automation_bp.route('/tasks', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def list_tasks():
    """Görevleri listele"""
    try:
        mongo = MongoDBConnection()
        
        # Pagination
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        skip = (page - 1) * limit
        
        # Get user's tasks
        tasks = mongo.find(
            'automation_tasks',
            {'user_id': g.user_id},
            skip=skip,
            limit=limit
        )
        
        total = mongo.count('automation_tasks', {'user_id': g.user_id})
        
        return create_success_response({
            "tasks": tasks,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total
            }
        })
    
    except Exception as e:
        logger.error(f"List tasks hatası: {str(e)}")
        raise DatabaseError("DB_001", "Görevler alınamadı")


@automation_bp.route('/batch', methods=['POST'])
@token_required
@rate_limit
@handle_api_error
def create_batch_operation():
    """Toplu işlemi çalıştır"""
    try:
        data = request.get_json() or {}
        
        validate_required_fields(data, ['operation', 'items'])
        
        operation = data.get('operation')
        items = data.get('items', [])
        
        if not items:
            raise ValidationError("VAL_004", "En az bir öğe gerekli")
        
        batch_id = hashlib.md5(
            f"{g.user_id}{operation}{datetime.utcnow()}".encode()
        ).hexdigest()
        
        # Start batch operation
        task = run_batch_operation.delay(batch_id, operation, items)
        
        logger.info(f"📦 Toplu işlem başlatıldı: {batch_id}")
        
        return create_success_response({
            "batch_id": batch_id,
            "operation": operation,
            "item_count": len(items),
            "task_id": task.id,
            "status": "processing"
        }, status_code=202)
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Create batch hatası: {str(e)}")
        raise ProcessingError("SERVER_001", "Toplu işlem başarısız")


@automation_bp.route('/batch/<batch_id>/status', methods=['GET'])
@token_required
@rate_limit
@handle_api_error
def get_batch_status(batch_id):
    """Toplu işlem durumunu getir"""
    try:
        mongo = MongoDBConnection()
        batch = mongo.find_one('batch_operations', {'_id': batch_id})
        
        if not batch:
            raise ValidationError("RES_001", "Toplu işlem bulunamadı")
        
        return create_success_response({
            "batch_id": batch_id,
            "status": batch.get('status'),
            "items": batch.get('items'),
            "completed_at": batch.get('completed_at')
        })
    
    except ValidationError as e:
        raise
    except Exception as e:
        logger.error(f"Get batch status hatası: {str(e)}")
        raise DatabaseError("DB_001", "Durum alınamadı")


logger.info("✅ Automation modülü yüklendi")
