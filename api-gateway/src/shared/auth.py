#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Authentication and authorization
JWT token-based auth
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from loguru import logger

# Global config
jwt_secret = None
jwt_expiry = 86400  # 24 hours


def init_auth(config):
    """Auth sistemini başlat"""
    global jwt_secret, jwt_expiry
    
    jwt_secret = os.getenv('JWT_SECRET', config.get('auth', {}).get('jwt_secret', 'change-this-secret'))
    jwt_expiry = config.get('auth', {}).get('jwt_expiry', 86400)
    
    logger.info("✅ Auth sistemi başlatıldı")


def hash_password(password):
    """Şifreyi hash'le"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """Şifreyi doğrula"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_token(user_id, email, role='viewer'):
    """JWT token oluştur"""
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=jwt_expiry)
    }
    return jwt.encode(payload, jwt_secret, algorithm='HS256')


def decode_token(token):
    """JWT token'ı çöz"""
    try:
        return jwt.decode(token, jwt_secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """Auth decorator"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({"error": "Token gerekli"}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = decode_token(token)
        
        if not payload:
            return jsonify({"error": "Geçersiz veya süresi dolmuş token"}), 401
        
        request.user = payload
        return f(*args, **kwargs)
    
    return decorated


def require_role(role):
    """Role-based auth decorator"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'user'):
                return jsonify({"error": "Kimlik doğrulama gerekli"}), 401
            
            user_role = request.user.get('role', 'viewer')
            
            # Role hierarchy: superadmin > admin > editor > viewer
            roles = ['viewer', 'editor', 'admin', 'superadmin']
            required_level = roles.index(role)
            user_level = roles.index(user_role)
            
            if user_level < required_level:
                return jsonify({"error": "Yetersiz yetki"}), 403
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator
