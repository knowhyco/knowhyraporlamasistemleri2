from flask import Blueprint, request, jsonify
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta
import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import execute_query, is_setup_done, check_table_exists
from config import (
    JWT_SECRET, JWT_EXPIRATION, SYSTEM_TABLE_PREFIX,
    DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD
)

admin_bp = Blueprint('admin', __name__)

def get_token_payload(request):
    """JWT token'dan payload bilgisini çıkarır"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        if payload.get('role') != 'admin':
            return None
        return payload
    except Exception as e:
        logging.error(f"Token çözme hatası: {e}")
        return None

def admin_required(func):
    """Admin yetkisi gerektiren endpoint'ler için decorator"""
    def wrapper(*args, **kwargs):
        payload = get_token_payload(request)
        if not payload:
            return jsonify({'status': 'error', 'message': 'Yetkisiz erişim'}), 401
        return func(payload, *args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@admin_bp.route('/setup', methods=['POST'])
def setup():
    """
    Sistem ilk kurulumu için endpoint
    """
    if is_setup_done():
        return jsonify({'status': 'error', 'message': 'Kurulum zaten tamamlanmış'}), 400
        
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        required_fields = ['admin_username', 'admin_password', 'table_name']
        if not all(field in data for field in required_fields):
            return jsonify({
                'status': 'error', 
                'message': 'Eksik alanlar: admin_username, admin_password, table_name gerekli'
            }), 400
            
        admin_username = data['admin_username']
        admin_password = data['admin_password']
        table_name = data['table_name']
        
        # Şifreyi hashle
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), salt).decode('utf-8')
        
        # Sistem tablolarını oluştur
        # 1. Kullanıcılar tablosu
        execute_query(f"""
        CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
        """, commit=True)
        
        # 2. Konfigürasyon tablosu
        execute_query(f"""
        CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}config (
            id SERIAL PRIMARY KEY,
            config_key VARCHAR(100) UNIQUE NOT NULL,
            config_value TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """, commit=True)
        
        # 3. Raporlar tablosu
        execute_query(f"""
        CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}reports (
            id SERIAL PRIMARY KEY,
            report_name VARCHAR(100) UNIQUE NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            description TEXT,
            parameters JSONB,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """, commit=True)
        
        # 4. Loglar tablosu
        execute_query(f"""
        CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            action VARCHAR(100) NOT NULL,
            details JSONB,
            ip_address VARCHAR(50),
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES {SYSTEM_TABLE_PREFIX}users(id) ON DELETE SET NULL
        )
        """, commit=True)
        
        # Admin kullanıcısını ekle
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}users (username, password, role)
        VALUES (%s, %s, 'admin')
        ON CONFLICT (username) 
        DO UPDATE SET password = EXCLUDED.password, role = 'admin'
        """, (admin_username, hashed_password), commit=True)
        
        # Tablo adını konfig tablosuna kaydet
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
        VALUES ('TABLE_NAME', %s)
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = CURRENT_TIMESTAMP
        """, (table_name,), commit=True)
        
        # Kurulum durumunu güncelle
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
        VALUES ('IS_SETUP_DONE', 'TRUE')
        ON CONFLICT (config_key) 
        DO UPDATE SET config_value = 'TRUE', updated_at = CURRENT_TIMESTAMP
        """, commit=True)
        
        # Rapor tablosunu kontrol et
        if not check_table_exists(table_name):
            return jsonify({
                'status': 'warning',
                'message': f"Kurulum tamamlandı fakat '{table_name}' tablosu mevcut değil. Raporlar çalışmayabilir."
            })
            
        return jsonify({
            'status': 'success',
            'message': 'Kurulum başarıyla tamamlandı'
        })
        
    except Exception as e:
        logging.error(f"Kurulum hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kurulum sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/login', methods=['POST'])
def login():
    """
    Admin girişi için endpoint
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
        
        # İlk kurulum kontrolü
        if not is_setup_done() and username == DEFAULT_ADMIN_USERNAME and password == DEFAULT_ADMIN_PASSWORD:
            # Varsayılan admin ile giriş yapıldı, kurulum gerekiyor
            token = jwt.encode({
                'sub': 'setup',
                'username': username,
                'role': 'admin',
                'exp': datetime.utcnow() + timedelta(seconds=JWT_EXPIRATION)
            }, JWT_SECRET)
            
            return jsonify({
                'status': 'success',
                'message': 'Kurulum gerekiyor',
                'token': token,
                'need_setup': True
            })
        
        # Normal giriş işlemi
        query = f"""
        SELECT id, username, password, role
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE username = %s AND role = 'admin' AND is_active = true
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
        VALUES (%s, 'admin_login', %s, %s)
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
            'need_setup': False
        })
        
    except Exception as e:
        logging.error(f"Giriş hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Giriş sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users(payload):
    """
    Tüm kullanıcıları listele
    """
    try:
        query = f"""
        SELECT id, username, email, role, is_active, created_at, last_login
        FROM {SYSTEM_TABLE_PREFIX}users
        ORDER BY created_at DESC
        """
        users = execute_query(query)
        
        return jsonify({
            'status': 'success',
            'users': users
        })
        
    except Exception as e:
        logging.error(f"Kullanıcı listeleme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kullanıcı listeleme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user(payload):
    """
    Yeni kullanıcı oluştur
    """
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        required_fields = ['username', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({
                'status': 'error', 
                'message': 'Eksik alanlar: username, password gerekli'
            }), 400
            
        username = data['username']
        password = data['password']
        email = data.get('email', '')
        role = data.get('role', 'user')
        is_active = data.get('is_active', True)
        
        # Sadece geçerli roller kabul edilir
        if role not in ['admin', 'user']:
            return jsonify({
                'status': 'error',
                'message': 'Geçersiz rol. Kabul edilen değerler: admin, user'
            }), 400
        
        # Şifreyi hashle
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # Kullanıcıyı ekle
        query = f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}users (username, password, email, role, is_active)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
        """
        result = execute_query(
            query, 
            (username, hashed_password, email, role, is_active), 
            fetch_all=False,
            commit=True
        )
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'create_user', %s, %s)
        """, (
            payload['sub'], 
            f'{{"created_user_id": {result["id"]}, "username": "{username}", "role": "{role}"}}',
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Kullanıcı başarıyla oluşturuldu',
            'user_id': result['id']
        })
        
    except Exception as e:
        logging.error(f"Kullanıcı oluşturma hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kullanıcı oluşturma sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(payload, user_id):
    """
    Kullanıcı bilgilerini günceller
    """
    try:
        data = request.get_json()
        
        # Kullanıcının var olduğunu kontrol et
        query = f"""
        SELECT id, username, role
        FROM {SYSTEM_TABLE_PREFIX}users
        WHERE id = %s
        """
        user = execute_query(query, (user_id,), fetch_all=False)
        
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'Kullanıcı bulunamadı'
            }), 404
        
        # Güncellenecek alanları hazırla
        updates = []
        params = []
        
        if 'email' in data:
            updates.append("email = %s")
            params.append(data['email'])
            
        if 'role' in data:
            role = data['role']
            if role not in ['admin', 'user']:
                return jsonify({
                    'status': 'error',
                    'message': 'Geçersiz rol. Kabul edilen değerler: admin, user'
                }), 400
            updates.append("role = %s")
            params.append(role)
            
        if 'is_active' in data:
            updates.append("is_active = %s")
            params.append(data['is_active'])
            
        if 'password' in data:
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt).decode('utf-8')
            updates.append("password = %s")
            params.append(hashed_password)
            
        if not updates:
            return jsonify({
                'status': 'error',
                'message': 'Güncellenecek alan bulunamadı'
            }), 400
            
        # Güncelleme sorgusunu oluştur
        query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}users
        SET {", ".join(updates)}
        WHERE id = %s
        """
        params.append(user_id)
        
        execute_query(query, params, commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'update_user', %s, %s)
        """, (
            payload['sub'], 
            f'{{"updated_user_id": {user_id}, "username": "{user["username"]}"}}',
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Kullanıcı başarıyla güncellendi'
        })
        
    except Exception as e:
        logging.error(f"Kullanıcı güncelleme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kullanıcı güncelleme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs(payload):
    """
    Sistem loglarını listele
    """
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        query = f"""
        SELECT l.id, l.action, l.details, l.ip_address, l.created_at,
               u.username as user_username
        FROM {SYSTEM_TABLE_PREFIX}logs l
        LEFT JOIN {SYSTEM_TABLE_PREFIX}users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT %s OFFSET %s
        """
        logs = execute_query(query, (limit, offset))
        
        # Toplam log sayısını al
        count_query = f"""
        SELECT COUNT(*) as total
        FROM {SYSTEM_TABLE_PREFIX}logs
        """
        count = execute_query(count_query, fetch_all=False)
        
        return jsonify({
            'status': 'success',
            'logs': logs,
            'total': count['total'],
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        logging.error(f"Log listeleme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Log listeleme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/config/table-name', methods=['GET'])
@admin_required
def get_table_name(payload):
    """
    Kayıtlı tablo adını döndürür
    """
    try:
        query = f"""
        SELECT config_value
        FROM {SYSTEM_TABLE_PREFIX}config
        WHERE config_key = 'TABLE_NAME'
        """
        result = execute_query(query, fetch_all=False)
        
        if not result:
            return jsonify({
                'status': 'error',
                'message': 'Tablo adı tanımlanmamış'
            }), 404
            
        return jsonify({
            'status': 'success',
            'table_name': result['config_value']
        })
        
    except Exception as e:
        logging.error(f"Tablo adı getirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Tablo adı getirme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/config/table-name', methods=['PUT'])
@admin_required
def update_table_name(payload):
    """
    Tablo adını günceller
    """
    try:
        data = request.get_json()
        
        if 'table_name' not in data:
            return jsonify({
                'status': 'error',
                'message': 'table_name alanı gerekli'
            }), 400
            
        table_name = data['table_name']
        
        # Tablonun var olduğunu kontrol et
        if not check_table_exists(table_name):
            return jsonify({
                'status': 'warning',
                'message': f"'{table_name}' tablosu mevcut değil. Raporlar çalışmayabilir."
            })
        
        # Tablo adını güncelle
        query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}config
        SET config_value = %s, updated_at = CURRENT_TIMESTAMP
        WHERE config_key = 'TABLE_NAME'
        """
        execute_query(query, (table_name,), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'update_table_name', %s, %s)
        """, (
            payload['sub'], 
            f'{{"table_name": "{table_name}"}}',
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Tablo adı başarıyla güncellendi'
        })
        
    except Exception as e:
        logging.error(f"Tablo adı güncelleme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Tablo adı güncelleme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/table-name', methods=['GET', 'POST'])
@admin_required
def manage_table_name(payload):
    """
    Tablo adını göster veya güncelle
    """
    if request.method == 'GET':
        try:
            query = f"""
            SELECT config_value 
            FROM {SYSTEM_TABLE_PREFIX}config 
            WHERE config_key = 'TABLE_NAME'
            """
            result = execute_query(query, fetch_all=False)
            
            if result:
                return jsonify({
                    'status': 'success',
                    'table_name': result['config_value']
                })
            else:
                return jsonify({
                    'status': 'error',
                    'message': 'Tablo adı bulunamadı'
                }), 404
                
        except Exception as e:
            logging.error(f"Tablo adı getirme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Tablo adı getirme sırasında hata oluştu: {str(e)}'
            }), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            new_table_name = data.get('table_name')
            
            if not new_table_name:
                return jsonify({
                    'status': 'error',
                    'message': 'Tablo adı gerekli'
                }), 400
            
            # Tablonun var olup olmadığını kontrol et
            if not check_table_exists(new_table_name):
                return jsonify({
                    'status': 'error',
                    'message': f"'{new_table_name}' tablosu veritabanında bulunamadı"
                }), 400
            
            # Tablo adını güncelle
            query = f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
            VALUES ('TABLE_NAME', %s)
            ON CONFLICT (config_key) 
            DO UPDATE SET config_value = %s, updated_at = CURRENT_TIMESTAMP
            """
            execute_query(query, (new_table_name, new_table_name), commit=True)
            
            # Log kaydı
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
            VALUES (%s, 'update_table_name', %s, %s)
            """, (
                payload['sub'], 
                f'{{"old_table_name": "", "new_table_name": "{new_table_name}"}}',
                request.remote_addr
            ), commit=True)
            
            return jsonify({
                'status': 'success',
                'message': f"Tablo adı '{new_table_name}' olarak güncellendi"
            })
            
        except Exception as e:
            logging.error(f"Tablo adı güncelleme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Tablo adı güncelleme sırasında hata oluştu: {str(e)}'
            }), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required
def manage_user(payload, user_id):
    """
    Kullanıcı detaylarını getirme, güncelleme veya silme
    """
    # Kendini silmeyi veya admin rolünü değiştirmeyi engelle
    if int(payload['sub']) == user_id and request.method in ['PUT', 'DELETE']:
        admin_check_query = f"""
        SELECT role FROM {SYSTEM_TABLE_PREFIX}users WHERE id = %s
        """
        user_check = execute_query(admin_check_query, (user_id,), fetch_all=False)
        
        if user_check and user_check['role'] == 'admin' and request.method == 'DELETE':
            return jsonify({
                'status': 'error',
                'message': 'Kendi hesabınızı silemezsiniz'
            }), 403
            
        if request.method == 'PUT':
            data = request.get_json()
            if data.get('role') and data.get('role') != 'admin' and user_check['role'] == 'admin':
                return jsonify({
                    'status': 'error',
                    'message': 'Kendi admin rolünüzü değiştiremezsiniz'
                }), 403
    
    # GET - Kullanıcı detaylarını getir
    if request.method == 'GET':
        try:
            query = f"""
            SELECT id, username, email, role, is_active, created_at, last_login 
            FROM {SYSTEM_TABLE_PREFIX}users 
            WHERE id = %s
            """
            user = execute_query(query, (user_id,), fetch_all=False)
            
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
            logging.error(f"Kullanıcı detayı getirme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Kullanıcı detayı getirme sırasında hata oluştu: {str(e)}'
            }), 500
    
    # PUT - Kullanıcı bilgilerini güncelle
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            # Güncelleme sorgusunu oluştur
            update_fields = []
            params = []
            
            if 'username' in data:
                update_fields.append("username = %s")
                params.append(data['username'])
                
            if 'email' in data:
                update_fields.append("email = %s")
                params.append(data['email'])
                
            if 'role' in data:
                update_fields.append("role = %s")
                params.append(data['role'])
                
            if 'is_active' in data:
                update_fields.append("is_active = %s")
                params.append(data['is_active'])
                
            if 'password' in data:
                salt = bcrypt.gensalt()
                hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt).decode('utf-8')
                update_fields.append("password = %s")
                params.append(hashed_password)
            
            if not update_fields:
                return jsonify({
                    'status': 'error',
                    'message': 'Güncellenecek alan bulunamadı'
                }), 400
                
            # Güncelleme sorgusu
            query = f"""
            UPDATE {SYSTEM_TABLE_PREFIX}users 
            SET {', '.join(update_fields)} 
            WHERE id = %s
            RETURNING id
            """
            params.append(user_id)
            
            result = execute_query(query, tuple(params), fetch_all=False, commit=True)
            
            if not result:
                return jsonify({
                    'status': 'error',
                    'message': 'Kullanıcı bulunamadı veya güncellenemedi'
                }), 404
            
            # Log kaydı
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
            VALUES (%s, 'update_user', %s, %s)
            """, (
                payload['sub'], 
                f'{{"updated_user_id": {user_id}}}',
                request.remote_addr
            ), commit=True)
            
            return jsonify({
                'status': 'success',
                'message': 'Kullanıcı başarıyla güncellendi'
            })
            
        except Exception as e:
            logging.error(f"Kullanıcı güncelleme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Kullanıcı güncelleme sırasında hata oluştu: {str(e)}'
            }), 500
    
    # DELETE - Kullanıcıyı sil
    elif request.method == 'DELETE':
        try:
            # Önce kullanıcının var olup olmadığını kontrol et
            check_query = f"""
            SELECT id FROM {SYSTEM_TABLE_PREFIX}users WHERE id = %s
            """
            user_exists = execute_query(check_query, (user_id,), fetch_all=False)
            
            if not user_exists:
                return jsonify({
                    'status': 'error',
                    'message': 'Kullanıcı bulunamadı'
                }), 404
            
            # Kullanıcıyı sil
            query = f"""
            DELETE FROM {SYSTEM_TABLE_PREFIX}users WHERE id = %s
            """
            execute_query(query, (user_id,), commit=True)
            
            # Log kaydı
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
            VALUES (%s, 'delete_user', %s, %s)
            """, (
                payload['sub'], 
                f'{{"deleted_user_id": {user_id}}}',
                request.remote_addr
            ), commit=True)
            
            return jsonify({
                'status': 'success',
                'message': 'Kullanıcı başarıyla silindi'
            })
            
        except Exception as e:
            logging.error(f"Kullanıcı silme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Kullanıcı silme sırasında hata oluştu: {str(e)}'
            }), 500

@admin_bp.route('/reports', methods=['GET'])
@admin_required
def list_reports(payload):
    """
    Tüm raporları listeler
    """
    try:
        query = f"""
        SELECT id, report_name, display_name, description, category, parameters, is_active, created_at, updated_at 
        FROM {SYSTEM_TABLE_PREFIX}reports 
        ORDER BY created_at DESC
        """
        reports = execute_query(query)
        
        return jsonify({
            'status': 'success',
            'reports': reports
        })
        
    except Exception as e:
        logging.error(f"Rapor listesi getirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor listesi getirme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/reports/create', methods=['POST'])
@admin_required
def create_report(payload):
    """
    Yeni rapor oluşturur
    """
    try:
        data = request.get_json()
        
        report_name = data.get('report_name')
        display_name = data.get('display_name')
        description = data.get('description')
        category = data.get('category')
        parameters = data.get('parameters', {})
        is_active = data.get('is_active', True)
        
        if not report_name or not display_name:
            return jsonify({
                'status': 'error',
                'message': 'Rapor adı ve görünen adı gerekli'
            }), 400
        
        # Raporu ekle
        query = f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}reports 
        (report_name, display_name, description, category, parameters, is_active)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id
        """
        
        result = execute_query(
            query, 
            (report_name, display_name, description, category, json.dumps(parameters), is_active), 
            fetch_all=False,
            commit=True
        )
        
        # Log kaydı
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'create_report', %s, %s)
        """, (
            payload['sub'], 
            f'{{"report_id": {result["id"]}, "report_name": "{report_name}"}}',
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Rapor başarıyla oluşturuldu',
            'report_id': result['id']
        })
        
    except Exception as e:
        logging.error(f"Rapor oluşturma hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor oluşturma sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/reports/<int:report_id>', methods=['GET', 'PUT', 'DELETE'])
@admin_required
def manage_report(payload, report_id):
    """
    Rapor detaylarını getirme, güncelleme veya silme
    """
    # GET - Rapor detaylarını getir
    if request.method == 'GET':
        try:
            query = f"""
            SELECT id, report_name, display_name, description, category, parameters, is_active, created_at, updated_at 
            FROM {SYSTEM_TABLE_PREFIX}reports 
            WHERE id = %s
            """
            report = execute_query(query, (report_id,), fetch_all=False)
            
            if not report:
                return jsonify({
                    'status': 'error',
                    'message': 'Rapor bulunamadı'
                }), 404
                
            return jsonify({
                'status': 'success',
                'report': report
            })
            
        except Exception as e:
            logging.error(f"Rapor detayı getirme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Rapor detayı getirme sırasında hata oluştu: {str(e)}'
            }), 500
    
    # PUT - Rapor bilgilerini güncelle
    elif request.method == 'PUT':
        try:
            data = request.get_json()
            
            # Güncelleme sorgusunu oluştur
            update_fields = []
            params = []
            
            if 'report_name' in data:
                update_fields.append("report_name = %s")
                params.append(data['report_name'])
                
            if 'display_name' in data:
                update_fields.append("display_name = %s")
                params.append(data['display_name'])
                
            if 'description' in data:
                update_fields.append("description = %s")
                params.append(data['description'])
                
            if 'category' in data:
                update_fields.append("category = %s")
                params.append(data['category'])
                
            if 'parameters' in data:
                update_fields.append("parameters = %s")
                params.append(json.dumps(data['parameters']))
                
            if 'is_active' in data:
                update_fields.append("is_active = %s")
                params.append(data['is_active'])
            
            if not update_fields:
                return jsonify({
                    'status': 'error',
                    'message': 'Güncellenecek alan bulunamadı'
                }), 400
                
            # Güncelleme zamanını ekle
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
                
            # Güncelleme sorgusu
            query = f"""
            UPDATE {SYSTEM_TABLE_PREFIX}reports 
            SET {', '.join(update_fields)} 
            WHERE id = %s
            RETURNING id
            """
            params.append(report_id)
            
            result = execute_query(query, tuple(params), fetch_all=False, commit=True)
            
            if not result:
                return jsonify({
                    'status': 'error',
                    'message': 'Rapor bulunamadı veya güncellenemedi'
                }), 404
            
            # Log kaydı
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
            VALUES (%s, 'update_report', %s, %s)
            """, (
                payload['sub'], 
                f'{{"report_id": {report_id}}}',
                request.remote_addr
            ), commit=True)
            
            return jsonify({
                'status': 'success',
                'message': 'Rapor başarıyla güncellendi'
            })
            
        except Exception as e:
            logging.error(f"Rapor güncelleme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Rapor güncelleme sırasında hata oluştu: {str(e)}'
            }), 500
    
    # DELETE - Raporu sil
    elif request.method == 'DELETE':
        try:
            # Önce raporun var olup olmadığını kontrol et
            check_query = f"""
            SELECT id FROM {SYSTEM_TABLE_PREFIX}reports WHERE id = %s
            """
            report_exists = execute_query(check_query, (report_id,), fetch_all=False)
            
            if not report_exists:
                return jsonify({
                    'status': 'error',
                    'message': 'Rapor bulunamadı'
                }), 404
            
            # Raporu sil
            query = f"""
            DELETE FROM {SYSTEM_TABLE_PREFIX}reports WHERE id = %s
            """
            execute_query(query, (report_id,), commit=True)
            
            # Log kaydı
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
            VALUES (%s, 'delete_report', %s, %s)
            """, (
                payload['sub'], 
                f'{{"deleted_report_id": {report_id}}}',
                request.remote_addr
            ), commit=True)
            
            return jsonify({
                'status': 'success',
                'message': 'Rapor başarıyla silindi'
            })
            
        except Exception as e:
            logging.error(f"Rapor silme hatası: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Rapor silme sırasında hata oluştu: {str(e)}'
            }), 500 