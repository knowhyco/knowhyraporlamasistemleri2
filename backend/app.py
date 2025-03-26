from flask import Flask, jsonify
from flask_cors import CORS
# from flask_socketio import SocketIO
import logging
import os
import traceback
from config import LOG_FOLDER, SQL_SCRIPTS_FOLDER
from utils.sql_helper import convert_md_to_sql_files
from migrations.setup_db import run_migrations

# Loglama yapılandırması
os.makedirs(LOG_FOLDER, exist_ok=True)
log_file = os.path.join(LOG_FOLDER, 'app.log')

# Ana logger'ı yapılandır
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Dosya handler'ı
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.DEBUG)

# Konsol handler'ı
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Format
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Handler'ları ekle
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# SQL dosyalarının yolunu kontrol et
sql_files_dir = os.path.join(SQL_SCRIPTS_FOLDER, "sql_files")
if not os.path.exists(sql_files_dir):
    os.makedirs(sql_files_dir, exist_ok=True)
    logging.info("SQL dosyaları dizini oluşturuldu: %s", sql_files_dir)

# MD formatındaki SQL dosyalarını SQL formatına dönüştür
try:
    convert_md_to_sql_files()
    logging.info("SQL sorgularının dönüştürülmesi tamamlandı.")
except Exception as e:
    logging.error("SQL sorgularının dönüştürülmesi sırasında hata: %s", str(e))
    logging.error(traceback.format_exc())

# Veritabanı migration'larını çalıştır
try:
    run_migrations()
    logging.info("Veritabanı migrasyonları tamamlandı.")
except Exception as e:
    logging.error("Veritabanı migrasyonları sırasında hata: %s", str(e))
    logging.error(traceback.format_exc())

# Uygulama ve Socket.IO başlatma
app = Flask(__name__)

# CORS yapılandırması - Belirli kaynaklardan gelen isteklere izin ver
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://100.26.61.207:3000", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# socketio = SocketIO(app, cors_allowed_origins="*")

# Blueprints (Controller'lar) import edilecek
from controllers.admin_controller import admin_bp
from controllers.user_controller import user_bp
from controllers.report_controller import report_bp

# Blueprints kayıt
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(report_bp, url_prefix='/api/reports')

# Auth blueprintini kaydet - isim çakışmasını önlemek için farklı bir isim ver
from controllers.user_controller import user_bp as auth_bp
app.register_blueprint(auth_bp, url_prefix='/api/auth', name='auth')

# Ana root endpoint
@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': 'Knowhy Raporlama Sistemleri API'
    })

# Sağlık kontrolü endpoint'i
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'success',
        'message': 'API çalışıyor'
    })

# Sistem durumu endpoint'i
@app.route('/api/system/setup-status')
def setup_status():
    from utils.db import is_setup_done
    return jsonify({
        'status': 'success',
        'is_setup_complete': is_setup_done()
    })

# Hata yakalayıcılar
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'status': 'error',
        'message': 'Endpoint bulunamadı'
    }), 404

@app.errorhandler(500)
def server_error(error):
    logging.error(f"500 error: {error}")
    logging.error(traceback.format_exc())
    return jsonify({
        'status': 'error',
        'message': 'Sunucu hatası',
        'error_details': str(error) if app.debug else None
    }), 500

# Başlat
if __name__ == '__main__':
    # socketio.run(app, host='0.0.0.0', port=8000, debug=True)
    app.run(host='0.0.0.0', port=8000, debug=True) 