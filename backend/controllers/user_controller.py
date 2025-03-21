from flask import Blueprint, request, jsonify
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import execute_query, is_setup_done
from config import JWT_SECRET, JWT_EXPIRATION, SYSTEM_TABLE_PREFIX

user_bp = Blueprint('user', __name__)

def get_token_payload(request):
    """JWT token'dan payload bilgisini çıkarır"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except Exception as e:
        logging.error(f"Token çözme hatası: {e}")
        return None

def auth_required(func):
    """Kimlik doğrulama gerektiren endpoint'ler için decorator"""
    def wrapper(*args, **kwargs):
        payload = get_token_payload(request)
        if not payload:
            return jsonify({'status': 'error', 'message': 'Yetkisiz erişim'}), 401
        return func(payload, *args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@user_bp.route('/login', methods=['POST'])
def login():
    """
    Kullanıcı girişi için endpoint
    """
    try:
        data = request.get_json()
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'status': 'error',
                'message': 'Kullanıcı adı ve şifre gerekli'
            }), 400
        
        # Kurulum kontrolü
        setup_done = is_setup_done()
        logging.info(f"Login attempt: {username}, Setup done: {setup_done}")
        
        # Kurulum tamamlanmamışsa ve admin/admin123 girişi yapılıyorsa
        if not setup_done and username == 'admin' and password == 'admin123':
            # Geçici admin token'ı oluştur
            token = jwt.encode({
                'sub': '0',
                'username': 'admin',
                'role': 'admin',
                'is_temp_admin': True,
                'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
            }, JWT_SECRET)
            
            logging.info("Temporary admin login for setup")
            
            return jsonify({
                'status': 'success',
                'message': 'Kurulum için geçici admin girişi başarılı',
                'token': token,
                'user': {
                    'id': 0,
                    'username': 'admin',
                    'role': 'admin',
                    'is_temp': True
                }
            })
            
        # Kurulum tamamlanmamış ve varsayılan admin girişi değilse
        if not setup_done and (username != 'admin' or password != 'admin123'):
            return jsonify({
                'status': 'error',
                'message': 'Sistem kurulumu tamamlanmamış. Lütfen varsayılan admin bilgileriyle giriş yapın.'
            }), 400
        
        # Kurulum tamamlanmışsa, normal giriş işlemi
        # Kullanıcıyı bul
        query = f"""
        SELECT id, username, password, role
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE username = %s AND is_active = true
        """
        user = execute_query(query, (username,), fetch_all=False)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Geçersiz kullanıcı adı veya şifre'
            }), 401
        
        # Şifre kontrolü
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({
                'status': 'error',
                'message': 'Geçersiz kullanıcı adı veya şifre'
            }), 401
        
        # Son giriş tarihini güncelle
        execute_query(f"""
        UPDATE {SYSTEM_TABLE_PREFIX}users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = %s
        """, (user['id'],), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'user_login', %s, %s)
        """, (
            user['id'], 
            '{"status": "success"}',
            request.remote_addr
        ), commit=True)
        
        # JWT token oluştur
        token = jwt.encode({
            'sub': str(user['id']),
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
        }, JWT_SECRET)
        
        return jsonify({
            'status': 'success',
            'message': 'Giriş başarılı',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        logging.error(f"Giriş hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Giriş sırasında hata oluştu: {str(e)}'
        }), 500

@user_bp.route('/refresh-token', methods=['POST'])
def refresh_token():
    """
    Token yenileme endpoint'i
    """
    payload = get_token_payload(request)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Geçersiz token'}), 401
    
    try:
        # Kullanıcı kontrolü
        query = f"""
        SELECT id, username, role
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE id = %s AND is_active = true
        """
        user = execute_query(query, (payload['sub'],), fetch_all=False)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Kullanıcı bulunamadı veya aktif değil'
            }), 401
        
        # Yeni token oluştur
        token = jwt.encode({
            'sub': str(user['id']),
            'username': user['username'],
            'role': user['role'],
            'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
        }, JWT_SECRET)
        
        return jsonify({
            'status': 'success',
            'token': token
        })
        
    except Exception as e:
        logging.error(f"Token yenileme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Token yenileme sırasında hata oluştu: {str(e)}'
        }), 500

@user_bp.route('/me', methods=['GET'])
@auth_required
def get_user_info(payload):
    """
    Kullanıcı bilgilerini döndürür
    """
    try:
        query = f"""
        SELECT id, username, email, role, created_at, last_login
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE id = %s
        """
        user = execute_query(query, (payload['sub'],), fetch_all=False)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Kullanıcı bulunamadı'
            }), 404
            
        return jsonify({
            'status': 'success',
            'user': user
        })
        
    except Exception as e:
        logging.error(f"Kullanıcı bilgisi getirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kullanıcı bilgisi getirme sırasında hata oluştu: {str(e)}'
        }), 500

@user_bp.route('/change-password', methods=['POST'])
@auth_required
def change_password(payload):
    """
    Kullanıcı şifresini değiştirir
    """
    try:
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({
                'status': 'error',
                'message': 'Mevcut şifre ve yeni şifre gerekli'
            }), 400
        
        # Kullanıcıyı bul
        query = f"""
        SELECT id, password
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE id = %s
        """
        user = execute_query(query, (payload['sub'],), fetch_all=False)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Kullanıcı bulunamadı'
            }), 404
        
        # Mevcut şifre kontrolü
        if not bcrypt.checkpw(current_password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({
                'status': 'error',
                'message': 'Mevcut şifre yanlış'
            }), 400
        
        # Yeni şifreyi hashle
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
        
        # Şifreyi güncelle
        execute_query(f"""
        UPDATE {SYSTEM_TABLE_PREFIX}users
        SET password = %s
        WHERE id = %s
        """, (hashed_password, payload['sub']), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'change_password', %s, %s)
        """, (
            payload['sub'], 
            '{"status": "success"}',
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Şifre başarıyla değiştirildi'
        })
        
    except Exception as e:
        logging.error(f"Şifre değiştirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Şifre değiştirme sırasında hata oluştu: {str(e)}'
        }), 500 