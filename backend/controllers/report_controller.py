from flask import Blueprint, request, jsonify
import logging
import os
import sys
import re
import traceback
from flask_socketio import emit
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db import execute_query, is_setup_done, check_table_exists
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
        logging.error(traceback.format_exc())
        
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
        data = request.get_json()
        
        if 'report_name' not in data:
            return jsonify({
                'status': 'error',
                'message': 'report_name alanı gerekli'
            }), 400
            
        report_name = data['report_name']
        param_values = data.get('parameters', {})
        
        # Tablo adını al
        query = f"""
        SELECT config_value
        FROM {SYSTEM_TABLE_PREFIX}config
        WHERE config_key = 'TABLE_NAME'
        """
        table_result = execute_query(query, fetch_all=False)
        
        if not table_result:
            return jsonify({
                'status': 'error',
                'message': 'Tablo adı tanımlı değil'
            }), 400
            
        table_name = table_result['config_value']
        
        # SQL sorgusunu oku
        try:
            sql_query = read_sql_file(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f"SQL dosyası okuma hatası: {str(e)}"
            }), 500
        
        # Parametreleri ve tablo adını SQL sorgusuna ekle
        param_values['TABLE_NAME'] = table_name
        sql_with_params = replace_placeholders(sql_query, param_values)
        
        # Sorguyu çalıştır
        try:
            results = execute_query(sql_with_params)
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f"SQL sorgu hatası: {str(e)}"
            }), 500
        
        # Sonuçları önbelleğe alabilir veya kaydetebiliriz
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'run_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({
                'report_name': report_name,
                'parameters': param_values,
                'result_count': len(results) if results else 0
            }),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'report_name': report_name,
            'parameters': param_values,
            'results': results,
            'count': len(results) if results else 0
        })
        
    except Exception as e:
        logging.error(f"Rapor çalıştırma hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor çalıştırma sırasında hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/details/<report_name>', methods=['GET'])
@auth_required
def get_report_details(payload, report_name):
    """
    Rapor detaylarını döndürür
    """
    try:
        # SQL sorgusunu oku
        try:
            sql_query = read_sql_file(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        
        # Markdown dosyasından başlık ve açıklamayı çıkarmaya çalış
        sql_file = get_sql_file_path(report_name)
        with open(sql_file, 'r', encoding='utf-8') as f:
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
        
        # Veritabanında kayıtlı mı kontrol et
        query = f"""
        SELECT id, parameters, is_active 
        FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        db_report = execute_query(query, (report_name,), fetch_all=False)
        
        is_registered = db_report is not None
        
        # Veritabanındaki parametreleri kullan (varsa)
        if is_registered and db_report['parameters']:
            if isinstance(db_report['parameters'], str):
                try:
                    parameters = json.loads(db_report['parameters'])
                except:
                    pass
            else:
                parameters = db_report['parameters']
        
        return jsonify({
            'status': 'success',
            'report_name': report_name,
            'display_name': display_name,
            'description': description,
            'parameters': parameters,
            'sql_query': sql_query,
            'is_registered': is_registered,
            'is_active': db_report['is_active'] if is_registered else True,
            'id': db_report['id'] if is_registered else None
        })
        
    except Exception as e:
        logging.error(f"Rapor detay getirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor detay getirme sırasında hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/update-params/<report_name>', methods=['PUT'])
@auth_required
def update_report_parameters(payload, report_name):
    """
    Rapor parametrelerini günceller
    """
    try:
        data = request.get_json()
        
        if 'parameters' not in data:
            return jsonify({
                'status': 'error',
                'message': 'parameters alanı gerekli'
            }), 400
            
        parameters = data['parameters']
        
        # Veritabanında kayıtlı mı kontrol et
        query = f"""
        SELECT id FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        db_report = execute_query(query, (report_name,), fetch_all=False)
        
        if not db_report:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' raporu veritabanında kayıtlı değil"
            }), 404
        
        # Parametreleri güncelle
        update_query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}reports
        SET parameters = %s, updated_at = CURRENT_TIMESTAMP
        WHERE report_name = %s
        """
        execute_query(update_query, (json.dumps(parameters), report_name), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'update_report_parameters', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Rapor parametreleri başarıyla güncellendi'
        })
        
    except Exception as e:
        logging.error(f"Rapor parametre güncelleme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor parametre güncelleme sırasında hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/toggle-active/<int:report_id>', methods=['PUT'])
@auth_required
def toggle_report_active(payload, report_id):
    """
    Raporun aktif/pasif durumunu değiştirir
    """
    try:
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        # Raporun var olduğunu kontrol et
        query = f"""
        SELECT report_name FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE id = %s
        """
        report = execute_query(query, (report_id,), fetch_all=False)
        
        if not report:
            return jsonify({
                'status': 'error',
                'message': 'Rapor bulunamadı'
            }), 404
        
        # Rapor durumunu güncelle
        update_query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}reports
        SET is_active = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """
        execute_query(update_query, (is_active, report_id), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'toggle_report_active', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({
                'report_name': report['report_name'],
                'is_active': is_active
            }),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': f"Rapor {'aktif' if is_active else 'pasif'} duruma getirildi"
        })
        
    except Exception as e:
        logging.error(f"Rapor durum değiştirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor durum değiştirme sırasında hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/detail/<report_name>', methods=['GET'])
@auth_required
def get_report_detail(payload, report_name):
    """
    Rapor detaylarını ve SQL kodunu döndürür
    """
    try:
        # Veritabanında rapor var mı kontrol et
        try:
            # Önce category sütunu eklenmiş mi kontrol et
            check_query = f"""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '{SYSTEM_TABLE_PREFIX}reports'
            AND column_name = 'category'
            """
            category_exists = execute_query(check_query, fetch_all=True)
            
            if category_exists and len(category_exists) > 0:
                # Category sütunu varsa
                query = f"""
                SELECT id, report_name, display_name, description, parameters, category, is_active
                FROM {SYSTEM_TABLE_PREFIX}reports
                WHERE report_name = %s
                """
            else:
                # Category sütunu yoksa
                query = f"""
                SELECT id, report_name, display_name, description, parameters, is_active
                FROM {SYSTEM_TABLE_PREFIX}reports
                WHERE report_name = %s
                """
                
            report = execute_query(query, (report_name,), fetch_all=False)
        except Exception as db_error:
            logging.error(f"Veritabanı tablosu/sütunu hatası: {db_error}")
            # Fallback sorgu - Sadece temel bilgileri sorgula
            query = f"""
            SELECT id, report_name, display_name, description, parameters, is_active
            FROM {SYSTEM_TABLE_PREFIX}reports
            WHERE report_name = %s
            """
            report = execute_query(query, (report_name,), fetch_all=False)
        
        # SQL dosyasını oku
        try:
            sql_code = read_sql_file(report_name)
        except FileNotFoundError:
            sql_code = ""
            
        # Parametreleri hazırla
        if report and isinstance(report.get('parameters'), str):
            try:
                parameters = json.loads(report['parameters'])
            except:
                parameters = {}
        else:
            parameters = {}
            if report and report.get('parameters'):
                parameters = report['parameters']
        
        # Rapor bilgilerini döndür
        result = {
            'report_name': report_name,
            'display_name': report['display_name'] if report else report_name,
            'description': report['description'] if report else "",
            'category': report.get('category', 'time') if report else "time",
            'parameters': parameters,
            'is_active': report['is_active'] if report else False,
            'sql_code': sql_code
        }
        
        return jsonify({
            'status': 'success',
            **result
        })
        
    except Exception as e:
        logging.error(f"Rapor detay hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Rapor detayı alınırken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/sql-code/<report_name>', methods=['GET'])
@auth_required
def get_report_sql_code(payload, report_name):
    """
    Rapor SQL kodunu döndürür
    """
    try:
        # SQL dosyasını oku
        try:
            sql_code = read_sql_file(report_name)
        except FileNotFoundError:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' rapor dosyası bulunamadı"
            }), 404
        
        return jsonify({
            'status': 'success',
            'report_name': report_name,
            'sql_code': sql_code
        })
        
    except Exception as e:
        logging.error(f"SQL kodu hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'SQL kodu alınırken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/create', methods=['POST'])
@auth_required
def create_report(payload):
    """
    Yeni bir rapor oluşturur
    """
    try:
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['report_name', 'display_name', 'sql_code']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'status': 'error',
                    'message': f"'{field}' alanı gerekli"
                }), 400
        
        report_name = data['report_name']
        display_name = data['display_name']
        description = data.get('description', '')
        category = data.get('category', 'time')
        sql_code = data['sql_code']
        parameters = data.get('parameters', [])
        
        # Rapor adının benzersiz olup olmadığını kontrol et
        check_query = f"""
        SELECT id FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        existing = execute_query(check_query, (report_name,), fetch_all=False)
        
        if existing:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' adında bir rapor zaten mevcut"
            }), 400
        
        # SQL dosyasını oluştur
        sql_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.sql")
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_code)
        
        # Markdown dosyasını oluştur
        md_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
        with open(md_file_path, 'w', encoding='utf-8') as f:
            f.write(f"# {display_name}\n")
            f.write(f"{description}\n\n")
            f.write("```sql\n")
            f.write(sql_code)
            f.write("\n```\n")
        
        # Parametreleri JSON formatına dönüştür
        parameters_json = json.dumps(parameters)
        
        # Category sütunu var mı kontrol et
        check_query = f"""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '{SYSTEM_TABLE_PREFIX}reports'
        AND column_name = 'category'
        """
        category_exists = execute_query(check_query, fetch_all=True)
        
        # Raporu veritabanına kaydet
        if category_exists and len(category_exists) > 0:
            # Category sütunu varsa
            query = f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}reports 
            (report_name, display_name, description, category, parameters, is_active)
            VALUES (%s, %s, %s, %s, %s, true)
            RETURNING id
            """
            result = execute_query(query, (
                report_name, 
                display_name, 
                description,
                category,
                parameters_json
            ), fetch_all=False, commit=True)
        else:
            # Category sütunu yoksa
            query = f"""
            INSERT INTO {SYSTEM_TABLE_PREFIX}reports 
            (report_name, display_name, description, parameters, is_active)
            VALUES (%s, %s, %s, %s, true)
            RETURNING id
            """
            result = execute_query(query, (
                report_name, 
                display_name, 
                description,
                parameters_json
            ), fetch_all=False, commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'create_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Rapor başarıyla oluşturuldu',
            'report_id': result['id'] if result else None
        })
        
    except Exception as e:
        logging.error(f"Rapor oluşturma hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Rapor oluşturulurken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/update/<report_name>', methods=['POST'])
@auth_required
def update_report(payload, report_name):
    """
    Var olan bir raporu günceller
    """
    try:
        data = request.get_json()
        
        # Zorunlu alanları kontrol et
        required_fields = ['display_name', 'sql_code']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'status': 'error',
                    'message': f"'{field}' alanı gerekli"
                }), 400
        
        display_name = data['display_name']
        description = data.get('description', '')
        category = data.get('category', 'time')
        sql_code = data['sql_code']
        parameters = data.get('parameters', [])
        
        # Raporun var olup olmadığını kontrol et
        check_query = f"""
        SELECT id FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        existing = execute_query(check_query, (report_name,), fetch_all=False)
        
        if not existing:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' adında bir rapor bulunamadı"
            }), 404
        
        # SQL dosyasını güncelle
        sql_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.sql")
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_code)
        
        # Markdown dosyasını güncelle
        md_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
        with open(md_file_path, 'w', encoding='utf-8') as f:
            f.write(f"# {display_name}\n")
            f.write(f"{description}\n\n")
            f.write("```sql\n")
            f.write(sql_code)
            f.write("\n```\n")
        
        # Parametreleri JSON formatına dönüştür
        parameters_json = json.dumps(parameters)
        
        # Category sütunu var mı kontrol et
        check_query = f"""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '{SYSTEM_TABLE_PREFIX}reports'
        AND column_name = 'category'
        """
        category_exists = execute_query(check_query, fetch_all=True)
        
        # Raporu veritabanında güncelle
        if category_exists and len(category_exists) > 0:
            # Category sütunu varsa
            query = f"""
            UPDATE {SYSTEM_TABLE_PREFIX}reports
            SET display_name = %s,
                description = %s,
                category = %s,
                parameters = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE report_name = %s
            """
            execute_query(query, (
                display_name, 
                description,
                category,
                parameters_json,
                report_name
            ), commit=True)
        else:
            # Category sütunu yoksa
            query = f"""
            UPDATE {SYSTEM_TABLE_PREFIX}reports
            SET display_name = %s,
                description = %s,
                parameters = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE report_name = %s
            """
            execute_query(query, (
                display_name, 
                description,
                parameters_json,
                report_name
            ), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'update_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'Rapor başarıyla güncellendi'
        })
        
    except Exception as e:
        logging.error(f"Rapor güncelleme hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'Rapor güncellenirken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/update-sql/<report_name>', methods=['POST'])
@auth_required
def update_report_sql(payload, report_name):
    """
    Sadece rapor SQL kodunu günceller
    """
    try:
        data = request.get_json()
        
        if 'sql_code' not in data or not data['sql_code']:
            return jsonify({
                'status': 'error',
                'message': "SQL kodu gerekli"
            }), 400
        
        sql_code = data['sql_code']
        
        # Raporun var olup olmadığını kontrol et
        check_query = f"""
        SELECT id, display_name FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        report = execute_query(check_query, (report_name,), fetch_all=False)
        
        if not report:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' adında bir rapor bulunamadı"
            }), 404
        
        # SQL dosyasını güncelle
        sql_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.sql")
        with open(sql_file_path, 'w', encoding='utf-8') as f:
            f.write(sql_code)
        
        # Markdown dosyasını güncelle
        md_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
        
        # Önce markdown dosyasını oku (eğer varsa)
        try:
            with open(md_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Başlığı ve açıklamayı çıkar
            title_match = re.search(r'^# (.*?)$', content, re.MULTILINE)
            display_name = title_match.group(1) if title_match else report['display_name']
            
            desc_match = re.search(r'^# .*?\n(.*?)(?=\n```|\n#|$)', content, re.DOTALL)
            description = desc_match.group(1).strip() if desc_match else ""
            
        except (FileNotFoundError, Exception) as e:
            # Dosya yoksa veya okuma hatası varsa veritabanından al
            display_name = report['display_name']
            description = ""
        
        # Markdown'ı güncelle
        with open(md_file_path, 'w', encoding='utf-8') as f:
            f.write(f"# {display_name}\n")
            f.write(f"{description}\n\n")
            f.write("```sql\n")
            f.write(sql_code)
            f.write("\n```\n")
        
        # Veritabanında updated_at'i güncelle
        query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}reports
        SET updated_at = CURRENT_TIMESTAMP
        WHERE report_name = %s
        """
        execute_query(query, (report_name,), commit=True)
        
        # SQL dosyasından parametreleri çıkar
        extracted_params = extract_parameters(sql_code)
        
        # Mevcut parametreleri al (varsa eski değerleri koru)
        param_query = f"""
        SELECT parameters FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        """
        param_result = execute_query(param_query, (report_name,), fetch_all=False)
        
        if param_result and param_result.get('parameters'):
            try:
                if isinstance(param_result['parameters'], str):
                    current_params = json.loads(param_result['parameters'])
                else:
                    current_params = param_result['parameters']
            except:
                current_params = {}
        else:
            current_params = {}
        
        # Yeni parametreler için default değerleri ekle
        updated_params = {}
        for param in extracted_params:
            if param in current_params:
                # Mevcut parametreyi koru
                updated_params[param] = current_params[param]
            else:
                # Yeni parametre için varsayılan değer ata
                updated_params[param] = {
                    'type': 'text',
                    'default': '',
                    'options': []
                }
                
                # Tarih parametreleri için özel durum
                if 'DATE' in param:
                    updated_params[param]['type'] = 'date'
        
        # Parametreleri güncelle
        update_params_query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}reports
        SET parameters = %s
        WHERE report_name = %s
        """
        execute_query(update_params_query, (
            json.dumps(updated_params),
            report_name
        ), commit=True)
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'update_report_sql', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': 'SQL kodu başarıyla güncellendi'
        })
        
    except Exception as e:
        logging.error(f"SQL kodu güncelleme hatası: {e}")
        logging.error(traceback.format_exc())
        return jsonify({
            'status': 'error',
            'message': f'SQL kodu güncellenirken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/toggle-active/<report_name>', methods=['PUT'])
@auth_required
def toggle_report_active_by_name(payload, report_name):
    """
    Report aktif/pasif durumunu değiştirir (rapor adı ile)
    """
    try:
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        # Raporu veritabanında güncelle
        query = f"""
        UPDATE {SYSTEM_TABLE_PREFIX}reports
        SET is_active = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE report_name = %s
        RETURNING id
        """
        
        result = execute_query(query, (is_active, report_name), fetch_all=False, commit=True)
        
        if not result:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' raporu bulunamadı"
            }), 404
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'toggle_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name, 'is_active': is_active}),
            request.remote_addr
        ), commit=True)
        
        return jsonify({
            'status': 'success',
            'message': f"Rapor başarıyla {'aktifleştirildi' if is_active else 'pasifleştirildi'}"
        })
        
    except Exception as e:
        logging.error(f"Rapor durumu değiştirme hatası: {e}")
        return jsonify({
            'status': 'error',
            'message': f'Rapor durumu değiştirilirken hata oluştu: {str(e)}'
        }), 500

@report_bp.route('/delete/<report_name>', methods=['DELETE'])
@auth_required
def delete_report(payload, report_name):
    """
    Raporu siler
    """
    try:
        # Raporu veritabanından sil
        query = f"""
        DELETE FROM {SYSTEM_TABLE_PREFIX}reports
        WHERE report_name = %s
        RETURNING id
        """
        
        result = execute_query(query, (report_name,), fetch_all=False, commit=True)
        
        if not result:
            return jsonify({
                'status': 'error',
                'message': f"'{report_name}' raporu bulunamadı"
            }), 404
        
        # SQL ve Markdown dosyalarını sil
        try:
            sql_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.sql")
            if os.path.exists(sql_file_path):
                os.remove(sql_file_path)
                
            md_file_path = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
            if os.path.exists(md_file_path):
                os.remove(md_file_path)
        except Exception as e:
            logging.warning(f"Rapor dosyaları silinirken hata: {e}")
            # Dosya silme hatası kritik değil, devam et
        
        # Logla
        execute_query(f"""
        INSERT INTO {SYSTEM_TABLE_PREFIX}logs (user_id, action, details, ip_address)
        VALUES (%s, 'delete_report', %s, %s)
        """, (
            payload['sub'], 
            json.dumps({'report_name': report_name}),
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
            'message': f'Rapor silinirken hata oluştu: {str(e)}'
        }), 500 