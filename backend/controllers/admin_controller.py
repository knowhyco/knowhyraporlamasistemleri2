from flask import Blueprint, request, jsonify
import logging
import bcrypt
import jwt
from datetime import datetime, timedelta
import sys
import os
import json
import traceback
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import execute_query, is_setup_done, check_table_exists
from config import (
    JWT_SECRET, JWT_EXPIRATION, SYSTEM_TABLE_PREFIX, SYSTEM_ID,
    DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, update_system_id
)

admin_bp = Blueprint('admin', __name__)

def get_token_payload(request):
    """JWT token'dan payload bilgisini çıkarır"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        logging.warning("Authorization header eksik veya geçersiz format")
        return None
    
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        logging.debug(f"Token çözümlendi: {payload}")
        return payload
    except Exception as e:
        logging.error(f"Token çözme hatası: {e}")
        return None

def admin_required(func):
    """Admin yetkisi gerektiren endpoint'ler için decorator"""
    def wrapper(*args, **kwargs):
        payload = get_token_payload(request)
        logging.info(f"Admin required check - Token payload: {payload}")
        
        if not payload:
            logging.warning("Token doğrulanamadı veya bulunamadı")
            return jsonify({'status': 'error', 'message': 'Yetkisiz erişim - Token geçersiz'}), 401
            
        # Token'da rol kontrolü
        if 'role' not in payload:
            logging.warning(f"Token'da rol bilgisi yok: {payload}")
            return jsonify({'status': 'error', 'message': 'Yetkisiz erişim - Rol bilgisi bulunamadı'}), 401
            
        if payload['role'] != 'admin':
            logging.warning(f"Admin rolü gerekli, kullanıcı rolü: {payload['role']}")
            return jsonify({'status': 'error', 'message': 'Yetkisiz erişim - Admin yetkisi gerekli'}), 403
            
        logging.info(f"Admin yetkilendirmesi başarılı: {payload['username']}")
        return func(payload, *args, **kwargs)
    wrapper.__name__ = func.__name__
    return wrapper

@admin_bp.route('/setup', methods=['POST'])
def setup():
    """
    Sistem ilk kurulumu için endpoint
    """
    logging.info("Setup endpoint'i çağrıldı")
    if is_setup_done():
        logging.warning("Kurulum zaten tamamlanmış, yeni kurulum isteği reddedildi")
        return jsonify({'status': 'error', 'message': 'Kurulum zaten tamamlanmış'}), 400
        
    try:
        data = request.get_json()
        logging.debug(f"Setup isteği verileri: {data}")
        
        # Gerekli alanları kontrol et
        required_fields = ['admin_username', 'admin_password', 'table_name', 'system_id']
        if not all(field in data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in data]
            logging.warning(f"Eksik alanlar: {missing_fields}")
            return jsonify({
                'status': 'error', 
                'message': f'Eksik alanlar: {", ".join(missing_fields)} gerekli'
            }), 400
            
        admin_username = data['admin_username']
        admin_password = data['admin_password']
        table_name = data['table_name']
        system_id = data['system_id']
        
        logging.info(f"Kurulum verileri alındı: admin_username={admin_username}, table_name={table_name}, system_id={system_id}")
        
        # Sistem ID formatını kontrol et (sadece alfanumerik ve en az 4 karakter olmalı)
        if not system_id.isalnum() or len(system_id) < 4:
            logging.warning(f"Geçersiz system_id formatı: {system_id}")
            return jsonify({
                'status': 'error',
                'message': 'Sistem ID en az 4 karakter uzunluğunda olmalı ve sadece harf ve rakamlardan oluşmalıdır'
            }), 400
            
        # Sistem ID'sini güncelle
        logging.info(f"Sistem ID güncelleniyor: {system_id}")
        update_success = update_system_id(system_id)
        if not update_success:
            logging.error(f"Sistem ID güncellenemedi: {system_id}")
            return jsonify({
                'status': 'error',
                'message': 'Sistem ID güncellenirken bir hata oluştu'
            }), 500
        
        # Şifreyi hashle
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), salt).decode('utf-8')
        
        # Güncel sistem tabloları prefix'ini kullanmak için değişkeni yeniden alalım
        from config import SYSTEM_TABLE_PREFIX
        logging.info(f"Güncel SYSTEM_TABLE_PREFIX: {SYSTEM_TABLE_PREFIX}")
        
        # Sistem tablolarını oluştur
        logging.info("Sistem tabloları oluşturuluyor...")
        
        # 1. Kullanıcılar tablosu
        try:
            logging.debug(f"Kullanıcılar tablosu oluşturuluyor: {SYSTEM_TABLE_PREFIX}users")
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
            logging.info("Kullanıcılar tablosu oluşturuldu")
        except Exception as e:
            logging.error(f"Kullanıcılar tablosu oluşturma hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # 2. Konfigürasyon tablosu
        try:
            logging.debug(f"Konfigürasyon tablosu oluşturuluyor: {SYSTEM_TABLE_PREFIX}config")
            execute_query(f"""
            CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}config (
                id SERIAL PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value TEXT,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """, commit=True)
            logging.info("Konfigürasyon tablosu oluşturuldu")
        except Exception as e:
            logging.error(f"Konfigürasyon tablosu oluşturma hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # 3. Raporlar tablosu
        try:
            logging.debug(f"Raporlar tablosu oluşturuluyor: {SYSTEM_TABLE_PREFIX}reports")
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
            logging.info("Raporlar tablosu oluşturuldu")
        except Exception as e:
            logging.error(f"Raporlar tablosu oluşturma hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # 4. Loglar tablosu
        try:
            logging.debug(f"Loglar tablosu oluşturuluyor: {SYSTEM_TABLE_PREFIX}logs")
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
            logging.info("Loglar tablosu oluşturuldu")
        except Exception as e:
            logging.error(f"Loglar tablosu oluşturma hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # 5. Favoriler tablosu
        try:
            logging.debug(f"Favoriler tablosu oluşturuluyor: {SYSTEM_TABLE_PREFIX}favorites")
            execute_query(f"""
            CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                report_id INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES {SYSTEM_TABLE_PREFIX}users(id) ON DELETE CASCADE,
                FOREIGN KEY (report_id) REFERENCES {SYSTEM_TABLE_PREFIX}reports(id) ON DELETE CASCADE,
                UNIQUE(user_id, report_id)
            )
            """, commit=True)
            logging.info("Favoriler tablosu oluşturuldu")
        except Exception as e:
            logging.error(f"Favoriler tablosu oluşturma hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # Admin kullanıcısını ekle
        logging.info(f"Admin kullanıcısı ekleniyor: {admin_username}")
        try:
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}users (username, password, role)
            VALUES (%s, %s, 'admin')
            ON CONFLICT (username) 
            DO UPDATE SET password = EXCLUDED.password, role = 'admin'
            """, (admin_username, hashed_password), commit=True)
            logging.info("Admin kullanıcısı eklendi")
        except Exception as e:
            logging.error(f"Admin kullanıcısı ekleme hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # Tablo adını konfig tablosuna kaydet
        logging.info(f"Tablo adı kaydediliyor: {table_name}")
        try:
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
            VALUES ('TABLE_NAME', %s)
            ON CONFLICT (config_key) 
            DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = CURRENT_TIMESTAMP
            """, (table_name,), commit=True)
            logging.info("Tablo adı kaydedildi")
        except Exception as e:
            logging.error(f"Tablo adı kaydetme hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # Sistem ID'sini kaydet
        logging.info(f"Sistem ID kaydediliyor: {system_id}")
        try:
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
            VALUES ('SYSTEM_ID', %s)
            ON CONFLICT (config_key) 
            DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = CURRENT_TIMESTAMP
            """, (system_id,), commit=True)
            logging.info("Sistem ID kaydedildi")
        except Exception as e:
            logging.error(f"Sistem ID kaydetme hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # Kurulum durumunu güncelle
        logging.info("Kurulum durumu güncelleniyor")
        try:
            execute_query(f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}config (config_key, config_value)
            VALUES ('IS_SETUP_DONE', 'TRUE')
            ON CONFLICT (config_key) 
            DO UPDATE SET config_value = 'TRUE', updated_at = CURRENT_TIMESTAMP
            """, commit=True)
            logging.info("Kurulum durumu güncellendi")
        except Exception as e:
            logging.error(f"Kurulum durumu güncelleme hatası: {e}")
            logging.error(traceback.format_exc())
            raise
        
        # Rapor tablosunu kontrol et
        logging.info(f"Tablo varlığı kontrol ediliyor: {table_name}")
        if not check_table_exists(table_name):
            logging.warning(f"Tablo bulunamadı: {table_name}")
            return jsonify({
                'status': 'warning',
                'message': f"Kurulum tamamlandı fakat '{table_name}' tablosu mevcut değil. Raporlar çalışmayabilir."
            })
        
        logging.info("Kurulum başarıyla tamamlandı")
        return jsonify({
            'status': 'success',
            'message': 'Kurulum başarıyla tamamlandı',
            'system_id': system_id,
            'system_table_prefix': SYSTEM_TABLE_PREFIX
        })
        
    except Exception as e:
        logging.error(f"Kurulum hatası: {e}")
        logging.error(traceback.format_exc())
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

@admin_bp.route('/setup-status', methods=['GET'])
def check_setup_status():
    """
    Kurulum durumunu kontrol eden endpoint
    """
    try:
        setup_done = is_setup_done()
        return jsonify({
            'status': 'success',
            'is_completed': setup_done
        })
    except Exception as e:
        logging.error(f"Kurulum durumu kontrol hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Kurulum durumu kontrolü sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/system-info', methods=['GET'])
def get_system_info():
    """
    Sistem bilgilerini döndüren endpoint
    """
    try:
        return jsonify({
            'status': 'success',
            'system_id': SYSTEM_ID,
            'system_table_prefix': SYSTEM_TABLE_PREFIX,
            'is_setup_done': is_setup_done()
        })
    except Exception as e:
        logging.error(f"Sistem bilgileri getirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Sistem bilgileri getirme sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/reset-system', methods=['POST'])
@admin_required
def reset_system(payload):
    """
    Sistemi sıfırlar (sadece admin kullanıcıları için)
    Bu tehlikeli bir işlemdir ve tüm yapılandırma, kullanıcı ve log verilerini siler
    """
    try:
        # İstek gövdesini kontrol et
        data = request.get_json()
        
        # Güvenlik için onay kontrolü
        confirmation = data.get('confirmation', '').strip().lower()
        if confirmation != 'reset':
            return jsonify({
                'status': 'error',
                'message': 'Onay geçersiz. Sistemi sıfırlamak için "reset" yazın'
            }), 400
        
        # Eski sistem tablolarını sil
        tables = [
            f"{SYSTEM_TABLE_PREFIX}logs",
            f"{SYSTEM_TABLE_PREFIX}reports",
            f"{SYSTEM_TABLE_PREFIX}users",
            f"{SYSTEM_TABLE_PREFIX}config"
        ]
        
        for table in tables:
            try:
                query = f"DROP TABLE IF EXISTS {table} CASCADE"
                execute_query(query, commit=True)
                logging.info(f"Tablo silindi: {table}")
            except Exception as e:
                logging.error(f"Tablo silinemedi {table}: {e}")
        
        # .env dosyasında SYSTEM_ID'yi sil veya sıfırla
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        
        try:
            with open(env_path, 'r') as f:
                env_content = f.read()
                
            # SYSTEM_ID satırını filtrele
            env_lines = env_content.splitlines()
            updated_lines = []
            for line in env_lines:
                if not line.startswith('SYSTEM_ID='):
                    updated_lines.append(line)
            env_content = '\n'.join(updated_lines)
                
            with open(env_path, 'w') as f:
                f.write(env_content)
                
            logging.info("SYSTEM_ID .env dosyasından silindi")
        except Exception as e:
            logging.error(f".env dosyası güncellenirken hata: {e}")
        
        return jsonify({
            'status': 'success',
            'message': 'Sistem başarıyla sıfırlandı. Lütfen uygulamayı yeniden başlatın.'
        })
        
    except Exception as e:
        logging.error(f"Sistem sıfırlama hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Sistem sıfırlama sırasında hata oluştu: {str(e)}'
        }), 500

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard(payload):
    """
    Admin paneli için öz dashboard bilgilerini döndürür
    Kullanıcı sayısı, rapor sayısı gibi özet veriler
    """
    try:
        logging.info(f"Admin dashboard istendi: {payload['username']}")
        
        # Kullanıcı sayısını al
        user_count = execute_query(f"""
        SELECT COUNT(*) as count FROM {SYSTEM_TABLE_PREFIX}users
        """, fetch_all=False)
        
        # Rapor sayısını al
        report_count = execute_query(f"""
        SELECT COUNT(*) as count FROM {SYSTEM_TABLE_PREFIX}reports
        """, fetch_all=False)
        
        # Son loglar
        recent_logs = execute_query(f"""
        SELECT id, user_id, action, created_at
        FROM {SYSTEM_TABLE_PREFIX}logs
        ORDER BY created_at DESC
        LIMIT 5
        """)
        
        # Sistem özet bilgileri
        system_info = {
            'user_count': user_count['count'] if user_count else 0,
            'report_count': report_count['count'] if report_count else 0,
            'recent_logs': recent_logs,
            'system_id': SYSTEM_ID,
            'table_prefix': SYSTEM_TABLE_PREFIX
        }
        
        return jsonify({
            'status': 'success',
            'message': 'Admin dashboard verileri alındı',
            'data': system_info
        })
        
    except Exception as e:
        logging.error(f"Admin dashboard hatası: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Dashboard verileri alınırken hata oluştu: {str(e)}'
        }), 500 