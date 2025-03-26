from flask import Blueprint, request, jsonify
import logging
import os
import sys
import re
import traceback
from flask_socketio import emit
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import execute_query, is_setup_done, check_table_exists, test_connection
from utils.sql_helper import (
    read_sql_file, extract_parameters, replace_placeholders, 
    get_default_parameter_value, get_sql_file_path
)
from config import SYSTEM_TABLE_PREFIX, SQL_SCRIPTS_FOLDER
import json

report_bp = Blueprint('report', __name__)

# JWT token kontrolü için user_controller'dan alınan fonksiyonlar
from controllers.user_controller import auth_required, get_token_payload

@report_bp.route('/list', methods=['GET'])
def get_reports():
    """
    Sistemdeki raporları listeler
    
    Not: Bu endpoint hem auth_required hem de direkt erişime izin verir.
    Kurulum sırasında token olmadan çağrılabilir.
    """
    try:
        # Kurulum tamamlanmamışsa sadece SQL dosyalarından raporları dön
        setup_done = is_setup_done()
        db_reports = []
        
        # Kurulum tamamlanmışsa veritabanından raporları getir
        if setup_done:
            try:
                logging.debug("Kurulum tamamlanmış, DB'den raporlar alınıyor")
                query = f"""
                SELECT id, report_name, display_name, description, parameters, is_active
                FROM {SYSTEM_TABLE_PREFIX}reports
                ORDER BY display_name
                """
                db_reports = execute_query(query)
                logging.debug(f"Veritabanından {len(db_reports)} rapor alındı")
            except Exception as e:
                logging.error(f"Veritabanı raporları alınırken hata: {e}")
                logging.error(traceback.format_exc())
                # Hata durumunda SQL dosyalarıyla devam et
                db_reports = []
        else:
            logging.info("Kurulum tamamlanmamış, SQL dosyalarından raporlar alınıyor")
        
        # SQL script dosyalarından raporları bul
        file_reports = []
        
        try:
            if os.path.exists(SQL_SCRIPTS_FOLDER):
                for file in os.listdir(SQL_SCRIPTS_FOLDER):
                    if file.endswith('.md'):
                        report_name = file[:-3]  # .md uzantısını kaldır
                        
                        # Bu rapor zaten veritabanında tanımlı mı kontrol et
                        if not any(r['report_name'] == report_name for r in db_reports):
                            try:
                                # Dosyadan SQL sorgusunu oku
                                sql_query = read_sql_file(report_name)
                                
                                # Markdown dosyasından başlık ve açıklamayı çıkarmaya çalış
                                with open(os.path.join(SQL_SCRIPTS_FOLDER, file), 'r', encoding='utf-8') as f:
                                    content = f.read()
                                
                                # Başlık (ilk satır)
                                title_match = re.search(r'^# (.*?)$', content, re.MULTILINE)
                                display_name = title_match.group(1) if title_match else report_name
                                
                                # Açıklama (ikinci satır)
                                desc_match = re.search(r'^# .*?\n(.*?)(?=\n```|\n#|$)', content, re.DOTALL)
                                description = desc_match.group(1).strip() if desc_match else ""
                                
                                # Parametreleri çıkar
                                params = extract_parameters(sql_query)
                                parameters = {}
                                for param in params:
                                    parameters[param] = get_default_parameter_value(param)
                                
                                file_reports.append({
                                    'id': None,
                                    'report_name': report_name,
                                    'display_name': display_name,
                                    'description': description,
                                    'parameters': parameters,
                                    'is_active': True,
                                    'is_registered': False
                                })
                            except Exception as e:
                                logging.error(f"Dosya okuma hatası ({file}): {e}")
            else:
                logging.warning(f"SQL_SCRIPTS_FOLDER yolu bulunamadı: {SQL_SCRIPTS_FOLDER}")
        except Exception as e:
            logging.error(f"SQL dosyalarını okurken hata: {e}")
            logging.error(traceback.format_exc())
        
        # Veritabanı raporlarını formatlama
        formatted_db_reports = []
        for report in db_reports:
            # parameters alanını JSON'dan Python dict'e çevir
            if isinstance(report['parameters'], str):
                try:
                    params = json.loads(report['parameters'])
                except:
                    params = {}
            else:
                params = report['parameters'] or {}
            
            formatted_db_reports.append({
                'id': report['id'],
                'report_name': report['report_name'],
                'display_name': report['display_name'],
                'description': report['description'],
                'parameters': params,
                'is_active': report['is_active'],
                'is_registered': True
            })
        
        # Birleştirip sırala
        all_reports = formatted_db_reports + file_reports
        all_reports.sort(key=lambda x: x['display_name'])
        
        logging.info(f"Toplam {len(all_reports)} rapor listelendi")
        return jsonify({
            'status': 'success',
            'reports': all_reports,
            'setup_complete': setup_done
        })
        
    except Exception as e:
        logging.error(f"Rapor listeleme hatası: {e}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        
        # Hata durumunda boş liste dön, hata dönme
        return jsonify({
            'status': 'success',
            'reports': [],
            'setup_complete': False,
            'warning': f'Rapor listeleme sırasında hata oluştu: {str(e)}'
        })

@report_bp.route('/register', methods=['POST'])
@auth_required
def register_report(payload):
    """
    Bir SQL rapor dosyasını sisteme kaydeder
    """
    try:
        data = request.get_json()
        
        if 'report_name' not in data:
            return jsonify({
                'status': 'error',
                'message': 'report_name alanı gerekli'
            }), 400
            
        report_name = data['report_name']
        display_name = data.get('display_name', report_name)
        description = data.get('description', '')
        
        # Rapor dosyasının varlığını kontrol et
        try:
            sql_file = get_sql_file_path(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        
        # SQL sorgusunu oku
        sql_query = read_sql_file(report_name)
        
        # Parametreleri çıkar
        params = extract_parameters(sql_query)
        parameters = {}
        for param in params:
            parameters[param] = get_default_parameter_value(param)
        
        # Raporu veritabanına kaydet
        query = f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}reports 
        (report_name, display_name, description, parameters, is_active)
        VALUES (%s, %s, %s, %s, true)
        ON CONFLICT (report_name) 
        DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            parameters = EXCLUDED.parameters,
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id
        """
        
        result = execute_query(query, (
            report_name, 
            display_name, 
            description, 
            json.dumps(parameters)
        ), fetch_all=False, commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'register_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Rapor başarıyla kaydedildi',
            'report_id': result['id'] if result else None,
            'parameters': parameters
        })
        
    except Exception as e:
        logging.error(f"Rapor kaydetme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor kaydetme sırasında hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/run', methods=['POST'])
@auth_required
def run_report(payload):
    """
    Rapor çalıştırır ve sonuçları döndürür
    """
    try:
        # Veritabanı bağlantısını test et
        connection_test = test_connection()
        if connection_test['status'] != 'success':
            return jsonify({
                'status': 'error',
                'message': f'Veritabanı bağlantı hatası: {connection_test["message"]}'
            }), 500
            
        data = request.get_json()
        
        if 'report_name' not in data:
            return jsonify({
                'status': 'error',
                'message': 'report_name alanı gerekli'
            }), 400
            
        report_name = data['report_name']
        param_values = data.get('parameters', {})
        
        # Tablo adını al
        table_name = os.environ.get('CUSTOMER_TABLE', 'customer_denizmuzesi')
        
        # Rapor dosyasını bul
        try:
            sql_file = get_sql_file_path(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        
        # SQL sorgusunu oku
        sql_query = read_sql_file(report_name)
        
        # Parametreleri çıkar
        extracted_params = extract_parameters(sql_query)
        
        # TABLE_NAME parametresini her zaman ekle
        if 'TABLE_NAME' not in param_values:
            param_values['TABLE_NAME'] = table_name
            
        # Eksik parametreler için varsayılan değerler ata
        for param in extracted_params:
            if param not in param_values or not param_values[param]:
                param_values[param] = get_default_parameter_value(param)
                
        logging.info(f"Parametreler: {param_values}")
                
        # Parametrelerle SQL sorgusunu oluştur
        sql_with_params = replace_placeholders(sql_query, param_values)
        
        # SQL sorgusunu logla
        logging.debug(f"Çalıştırılan SQL sorgusu:\n{sql_with_params}")
        
        # Sorguyu çalıştır
        try:
            results = execute_query(sql_with_params)
            
            # Sonuçları serileştirilebilir hale getir
            serializable_results = []
            for row in results:
                serializable_row = {}
                for key, value in row.items():
                    # datetime, float, int, bool, None ve string dışındaki değerler için özel işlem
                    if value is not None and not isinstance(value, (str, int, float, bool)):
                        serializable_row[key] = str(value)
                    else:
                        serializable_row[key] = value
                serializable_results.append(serializable_row)
                
            # Sorgu başarılı, sonuçları dön
            return jsonify({
                'status': 'success',
                'message': 'Rapor başarıyla çalıştırıldı',
                'results': serializable_results,
                'rowCount': len(serializable_results)
            })
            
        except Exception as e:
            logging.error(f"SQL sorgusu çalıştırma hatası: {e}")
            logging.error(f"Sorgu: {sql_with_params}")
            
            # Özel hata mesajlarını yakalamaya çalış
            error_message = str(e)
            if "column" in error_message.lower() and "does not exist" in error_message.lower():
                return jsonify({
                    'status': 'error',
                    'message': f'Sorgu hatası: Kolona erişim hatası. Tabloda belirtilen sütun mevcut değil. Tablo yapısında değişiklik olmuş olabilir. Detay: {error_message}'
                }), 400
            elif "relation" in error_message.lower() and "does not exist" in error_message.lower():
                return jsonify({
                    'status': 'error',
                    'message': f'Sorgu hatası: Tablo bulunamadı. Veritabanında {table_name} tablosu mevcut değil. Tablo adını kontrol edin. Detay: {error_message}'
                }), 400
            elif "syntax error" in error_message.lower():
                return jsonify({
                    'status': 'error',
                    'message': f'Sorgu hatası: SQL sözdizimi hatası. Rapor SQL kodu hatalı olabilir. Detay: {error_message}'
                }), 400
            else:
                return jsonify({
                    'status': 'error',
                    'message': f'Sorgu çalıştırma hatası: {error_message}'
                }), 500
        
    except Exception as e:
        logging.error(f"Rapor çalıştırma hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Rapor çalıştırma hatası: {str(e)}'
        }), 500

@report_bp.route('/details/<report_name>', methods=['GET'])
@auth_required
def get_report_details(payload, report_name):
    """
    Belirli bir raporun detaylarını döndürür
    """
    try:
        # Rapor dosyasını bul
        try:
            sql_file = get_sql_file_path(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        
        # SQL sorgusunu oku
        sql_query = read_sql_file(report_name)
        
        # Parametreleri çıkar
        params = extract_parameters(sql_query)
        parameters = {}
        for param in params:
            parameters[param] = get_default_parameter_value(param)
        
        # Raporun veritabanındaki kaydını kontrol et
        query = f"""
        SELECT id, report_name, display_name, description, parameters, is_active
        FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        
        db_report = execute_query(query, (report_name,), fetch_all=False)
        
        # Raporun markdown dosyasından başlık ve açıklamasını oku
        display_name = report_name
        description = ""
        
        try:
            md_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
            if os.path.exists(md_file_path):
                with open(md_file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Başlık (ilk satır)
                title_match = re.search(r'^# (.*?)$', content, re.MULTILINE)
                if title_match:
                    display_name = title_match.group(1)
                
                # Açıklama (ikinci satır)
                desc_match = re.search(r'^# .*?\n(.*?)(?=\n```|\n#|$)', content, re.DOTALL)
                if desc_match:
                    description = desc_match.group(1).strip()
        except Exception as e:
            logging.error(f"Markdown dosyası okuma hatası: {e}")
        
        # Veritabanındaki bilgileri ve dosyadan okunanları birleştir
        if db_report:
            # Veritabanındaki parametreleri kullan (eğer varsa)
            if isinstance(db_report['parameters'], str):
                try:
                    db_params = json.loads(db_report['parameters'])
                    parameters = db_params
                except:
                    pass
            elif db_report['parameters']:
                parameters = db_report['parameters']
            
            # Veritabanındaki başlık ve açıklamayı kullan
            if db_report['display_name']:
                display_name = db_report['display_name']
            if db_report['description']:
                description = db_report['description']
        
        return jsonify({
            'report_name': report_name,
            'display_name': display_name,
            'description': description,
            'parameters': parameters,
            'sql': sql_query,
            'is_registered': db_report is not None,
            'is_active': db_report['is_active'] if db_report else True
        })
        
    except Exception as e:
        logging.error(f"Rapor detayları getirme hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Rapor detayları getirme hatası: {str(e)}'
        }), 500

@report_bp.route('/summary', methods=['GET'])
@auth_required
def get_system_summary(payload):
    """
    Sistemin genel istatistiklerini döndürür
    """
    try:
        # Tablo adını al
        table_name = os.environ.get('CUSTOMER_TABLE', 'customer_denizmuzesi')
        
        # Tablo varlığını kontrol et
        if not check_table_exists(table_name):
            logging.warning(f"'{table_name}' tablosu bulunamadı")
            return jsonify({
                'status': 'error',
                'message': f"'{table_name}' tablosu bulunamadı"
            }), 404
            
        # Toplam oturum sayısı
        query_sessions = f"""
        SELECT COUNT(DISTINCT session_id) as total_sessions
        FROM {table_name}
        """
        
        # Toplam mesaj sayısı
        query_messages = f"""
        SELECT COUNT(*) as total_messages
        FROM {table_name}
        """
        
        # Context kullanım oranı
        query_context = f"""
        SELECT
            COUNT(CASE WHEN has_context = TRUE THEN 1 END) as context_used,
            COUNT(CASE WHEN has_context = FALSE THEN 1 END) as context_not_used,
            ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END) * 100.0 / COUNT(*), 2) as context_usage_percentage
        FROM {table_name}
        WHERE role = 'apiMessage'
        """
        
        # Son 24 saatteki aktif oturumlar
        query_active = f"""
        SELECT COUNT(DISTINCT session_id) as active_sessions
        FROM {table_name}
        WHERE created_date >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        """
        
        # Haftalık aktivite - günlere göre oturum sayısı
        query_weekly = f"""
        SELECT 
            EXTRACT(DOW FROM created_date) as day_of_week,
            COUNT(DISTINCT session_id) as session_count
        FROM {table_name}
        WHERE created_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY day_of_week
        ORDER BY day_of_week
        """
        
        try:
            result_sessions = execute_query(query_sessions, fetch_all=False)
            result_messages = execute_query(query_messages, fetch_all=False)
            result_context = execute_query(query_context, fetch_all=False)
            result_active = execute_query(query_active, fetch_all=False)
            result_weekly = execute_query(query_weekly)
            
            # Haftalık aktiviteyi formatlama
            weekly_activity = [0] * 7  # 0=Pazar, 1=Pazartesi, ... 6=Cumartesi
            for row in result_weekly:
                day = int(row['day_of_week'])
                weekly_activity[day] = row['session_count']
            
            # Sonuçları birleştir
            summary = {
                'total_sessions': result_sessions['total_sessions'] if result_sessions else 0,
                'total_messages': result_messages['total_messages'] if result_messages else 0,
                'context_usage': {
                    'used': result_context['context_used'] if result_context else 0,
                    'not_used': result_context['context_not_used'] if result_context else 0,
                    'percentage': float(result_context['context_usage_percentage']) if result_context else 0
                },
                'active_sessions': result_active['active_sessions'] if result_active else 0,
                'weekly_activity': weekly_activity
            }
            
            return jsonify({
                'status': 'success',
                'summary': summary
            })
            
        except Exception as e:
            logging.error(f"Özet istatistikler sorgulanırken hata: {e}")
            return jsonify({
                'status': 'error',
                'message': f'Özet istatistikler sorgulanırken hata: {str(e)}'
            }), 500
            
    except Exception as e:
        logging.error(f"Sistem özeti getirme hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Sistem özeti getirme hatası: {str(e)}'
        }), 500

@report_bp.route('/favorites', methods=['GET'])
@auth_required
def get_favorite_reports(payload):
    """
    Kullanıcının favori raporlarını listeler
    """
    try:
        user_id = payload['sub']
        
        # Favori raporları getir
        query = f"""
        SELECT r.id, r.report_name, r.display_name, r.description, r.parameters, r.is_active
        FROM {SYSTEM_TABLE_PREFIX}reports r
        JOIN {SYSTEM_TABLE_PREFIX}favorites f ON r.id = f.report_id
        WHERE f.user_id = %s AND r.is_active = true
        ORDER BY r.display_name
        """
        
        # Eğer favorites tablosu yoksa veya başka bir DB hatası olursa boş liste dön
        try:
            favorites = execute_query(query, (user_id,))
        except Exception as e:
            logging.error(f"Favoriler sorgulanırken hata: {e}")
            favorites = []
        
        # Verileri formatlama
        formatted_favorites = []
        for report in favorites:
            # parameters alanını JSON'dan Python dict'e çevir
            if isinstance(report['parameters'], str):
                try:
                    params = json.loads(report['parameters'])
                except:
                    params = {}
            else:
                params = report['parameters'] or {}
            
            formatted_favorites.append({
                'id': report['id'],
                'report_name': report['report_name'],
                'display_name': report['display_name'],
                'description': report['description'],
                'parameters': params,
                'is_active': report['is_active'],
                'is_favorite': True
            })
        
        return jsonify({
            'status': 'success',
            'favorites': formatted_favorites
        })
        
    except Exception as e:
        logging.error(f"Favori raporlar listelenirken hata: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'success',
            'favorites': [],
            'warning': f'Favori raporlar listelenirken hata oluştu: {str(e)}'
        })

@report_bp.route('/toggle-favorite/<int:report_id>', methods=['POST'])
@auth_required
def toggle_favorite(payload, report_id):
    """
    Belirli bir raporu favorilere ekler veya çıkarır
    """
    try:
        user_id = payload['sub']
        
        # Favoriler tablosunun varlığını kontrol et
        check_query = f"""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '{SYSTEM_TABLE_PREFIX}favorites'
        ) as table_exists
        """
        
        result = execute_query(check_query, fetch_all=False)
        
        # Tablo yoksa oluştur
        if not result['table_exists']:
            create_table_query = f"""
            CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                report_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, report_id)
            )
            """
            execute_query(create_table_query, commit=True)
        
        # Favori durumunu kontrol et
        check_favorite_query = f"""
        SELECT EXISTS (
            SELECT 1 FROM {SYSTEM_TABLE_PREFIX}favorites 
            WHERE user_id = %s AND report_id = %s
        ) as is_favorite
        """
        
        favorite_result = execute_query(check_favorite_query, (user_id, report_id), fetch_all=False)
        is_favorite = favorite_result['is_favorite']
        
        if is_favorite:
            # Favorilerden çıkar
            remove_query = f"""
            DELETE FROM {SYSTEM_TABLE_PREFIX}favorites 
            WHERE user_id = %s AND report_id = %s
            """
            execute_query(remove_query, (user_id, report_id), commit=True)
            message = "Rapor favorilerden çıkarıldı"
            is_favorite = False
        else:
            # Favorilere ekle
            add_query = f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}favorites (user_id, report_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, report_id) DO NOTHING
            """
            execute_query(add_query, (user_id, report_id), commit=True)
            message = "Rapor favorilere eklendi"
            is_favorite = True
        
        return jsonify({
            'status': 'success',
            'message': message,
            'is_favorite': is_favorite
        })
        
    except Exception as e:
        logging.error(f"Favori durumu değiştirilirken hata: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Favori durumu değiştirilirken hata oluştu: {str(e)}'
        }), 500 