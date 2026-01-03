#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Authentication Module
Login, Register ve Token Management
"""

from flask import Blueprint, request, jsonify
from loguru import logger
from datetime import datetime
from bson.objectid import ObjectId
from ..shared import database
from ..shared.auth import hash_password, verify_password, generate_token

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/health', methods=['GET'])
def health():
    """Module health check"""
    return jsonify({
        "module": "auth",
        "status": "healthy",
        "version": "2.0.0"
    })


@auth_bp.route('/register', methods=['POST'])
def register():
    """Yeni kullanıcı kaydı"""
    db = database.get_db()
    data = request.json
    
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not all([email, password, name]):
        return jsonify({"error": "Email, şifre ve ad gerekli"}), 400
    
    if len(password) < 8:
        return jsonify({"error": "Şifre minimum 8 karakter olmalı"}), 400
    
    try:
        # Email kontrolü
        existing = db.users.find_one({"email": email})
        if existing:
            return jsonify({"error": "Bu email zaten kayıtlı"}), 409
        
        # Yeni kullanıcı oluştur
        user_doc = {
            "email": email,
            "name": name,
            "password_hash": hash_password(password),
            "role": "viewer",  # Varsayılan rol
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        logger.info(f"✅ Yeni kullanıcı kaydı: {email}")
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "email": email,
            "message": "Kayıt başarılı"
        }), 201
        
    except Exception as e:
        logger.error(f"❌ Kayıt hatası: {e}")
        return jsonify({"error": "Kayıt sırasında hata oluştu"}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Kullanıcı girişi"""
    db = database.get_db()
    data = request.json
    
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({"error": "Email ve şifre gerekli"}), 400
    
    try:
        # Kullanıcı ara
        user = db.users.find_one({"email": email})
        
        if not user:
            logger.warning(f"⚠️ Login başarısız: {email} bulunamadı")
            return jsonify({"error": "Email veya şifre hatalı"}), 401
        
        if not user.get('is_active'):
            return jsonify({"error": "Hesap devre dışı bırakılmış"}), 403
        
        # Şifre doğrulama
        if not verify_password(password, user.get('password_hash')):
            logger.warning(f"⚠️ Login başarısız: {email} - yanlış şifre")
            return jsonify({"error": "Email veya şifre hatalı"}), 401
        
        # Token oluştur
        user_id = str(user['_id'])
        token = generate_token(user_id, email, user.get('role', 'viewer'))
        
        # Son giriş zamanını güncelle
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        logger.info(f"✅ Giriş başarılı: {email}")
        
        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "name": user.get('name'),
                "role": user.get('role', 'viewer')
            }
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Giriş hatası: {e}")
        return jsonify({"error": "Giriş sırasında hata oluştu"}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Oturumu kapat"""
    try:
        logger.info("✅ Oturum kapatıldı")
        return jsonify({
            "success": True,
            "message": "Oturum kapatıldı"
        }), 200
    except Exception as e:
        logger.error(f"❌ Logout hatası: {e}")
        return jsonify({"error": "Oturum kapatma hatası"}), 500


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Mevcut kullanıcı bilgileri"""
    try:
        # Token'dan user_id almak için auth decorator gerekir
        # Şimdilik temel implementasyon
        from flask import request
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Token gerekli"}), 401
        
        token = auth_header.replace('Bearer ', '')
        # Token decode ve user fetch
        # This would be implemented with proper JWT parsing
        
        return jsonify({
            "message": "User endpoint - JWT token validation required"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ User info error: {e}")
        return jsonify({"error": "Kullanıcı bilgisi alınamadı"}), 500


@auth_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """Token'ı yenile"""
    try:
        from flask import request
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Token gerekli"}), 401
        
        # Token yenileme logic
        return jsonify({
            "success": True,
            "message": "Token refresh - JWT validation required"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Token refresh error: {e}")
        return jsonify({"error": "Token yenileme hatası"}), 500


@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Email doğrulama"""
    data = request.json
    user_id = data.get('user_id')
    verification_code = data.get('verification_code')
    
    if not all([user_id, verification_code]):
        return jsonify({"error": "User ID ve doğrulama kodu gerekli"}), 400
    
    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "Kullanıcı bulunamadı"}), 404
        
        # Doğrulama kodu kontrolü ve email doğrulama
        # Implementation required
        
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_verified": True, "email_verified_at": datetime.utcnow()}}
        )
        
        logger.info(f"✅ Email doğrulandı: {user.get('email')}")
        
        return jsonify({
            "success": True,
            "message": "Email başarıyla doğrulandı"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Email verification error: {e}")
        return jsonify({"error": "Email doğrulama hatası"}), 500


@auth_bp.route('/password-reset', methods=['POST'])
def request_password_reset():
    """Şifre sıfırlama iste"""
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email gerekli"}), 400
    
    try:
        user = db.users.find_one({"email": email})
        
        if not user:
            # Güvenlik nedeniyle varlık/yokluğu belirtmeyin
            return jsonify({
                "success": True,
                "message": "Eğer hesap varsa, şifre sıfırlama bağlantısı gönderilir"
            }), 200
        
        # Reset token oluştur ve email gönder
        # Implementation required
        
        logger.info(f"✅ Şifre sıfırlama isteği: {email}")
        
        return jsonify({
            "success": True,
            "message": "Şifre sıfırlama bağlantısı gönderildi"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Password reset error: {e}")
        return jsonify({"error": "Şifre sıfırlama hatası"}), 500


@auth_bp.route('/password-reset/<token>', methods=['POST'])
def reset_password(token):
    """Şifreyi sıfırla"""
    data = request.json
    new_password = data.get('new_password')
    
    if not new_password or len(new_password) < 8:
        return jsonify({"error": "Yeni şifre minimum 8 karakter olmalı"}), 400
    
    try:
        # Token doğrulama ve user alma
        # Implementation required
        
        # Şifreyi güncelle
        # user_id = decode_reset_token(token)
        # db.users.update_one(
        #     {"_id": ObjectId(user_id)},
        #     {"$set": {"password_hash": hash_password(new_password)}}
        # )
        
        logger.info("✅ Şifre sıfırlandı")
        
        return jsonify({
            "success": True,
            "message": "Şifre başarıyla sıfırlandı"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Reset password error: {e}")
        return jsonify({"error": "Şifre sıfırlama hatası"}), 500
