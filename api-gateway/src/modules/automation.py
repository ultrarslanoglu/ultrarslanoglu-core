#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automation Modülü
Rutin görevler ve otomasyon
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime
from ..shared.celery_app import celery
from ..shared.database import db

automation_bp = Blueprint('automation', __name__)


@celery.task
def run_automation_task(task_id, task_type, parameters):
    """Otomasyon görevi çalıştır"""
    logger.info(f"🤖 Automation task: {task_type}")
    return {"task_id": task_id, "status": "completed"}


@automation_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({"module": "automation", "status": "healthy"})


@automation_bp.route('/tasks', methods=['POST'])
def create_task():
    """Otomasyon görevi oluştur"""
    data = request.json
    task_type = data.get('task_type')
    parameters = data.get('parameters', {})
    schedule = data.get('schedule')
    
    try:
        task_doc = {
            "task_type": task_type,
            "parameters": parameters,
            "schedule": schedule,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        task_id = db.automation_tasks.insert_one(task_doc).inserted_id
        
        # Background task başlat
        celery_task = run_automation_task.delay(str(task_id), task_type, parameters)
        
        return jsonify({
            "success": True,
            "task_id": str(task_id),
            "celery_task_id": celery_task.id
        }), 201
    except Exception as e:
        logger.error(f"Task creation error: {e}")
        return jsonify({"error": str(e)}), 500


@automation_bp.route('/tasks', methods=['GET'])
def list_tasks():
    """Görevleri listele"""
    status = request.args.get('status')
    limit = int(request.args.get('limit', 50))
    
    try:
        query = {}
        if status:
            query['status'] = status
        
        tasks = list(db.automation_tasks.find(query).limit(limit))
        
        for task in tasks:
            task['_id'] = str(task['_id'])
        
        return jsonify({"success": True, "tasks": tasks})
    except Exception as e:
        logger.error(f"List tasks error: {e}")
        return jsonify({"error": str(e)}), 500


@automation_bp.route('/workflows', methods=['POST'])
def create_workflow():
    """Workflow oluştur"""
    data = request.json
    
    try:
        data['created_at'] = datetime.utcnow()
        data['status'] = 'active'
        workflow_id = db.workflows.insert_one(data).inserted_id
        return jsonify({"success": True, "workflow_id": str(workflow_id)}), 201
    except Exception as e:
        logger.error(f"Workflow creation error: {e}")
        return jsonify({"error": str(e)}), 500
