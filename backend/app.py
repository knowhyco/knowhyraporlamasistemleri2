from flask import Flask, jsonify
from flask_cors import CORS
# from flask_socketio import SocketIO
import logging
import os
from config import LOG_FOLDER, SQL_SCRIPTS_FOLDER
from utils.sql_helper import convert_md_to_sql_files
from migrations.setup_db import run_migrations

# Loglama yapılandırması
os.makedirs(LOG_FOLDER, exist_ok=True)
log_file = os.path.join(LOG_FOLDER, 'app.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

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

# Veritabanı migration'larını çalıştır
try:
    run_migrations()
    logging.info("Veritabanı migrasyonları tamamlandı.")
except Exception as e:
    logging.error("Veritabanı migrasyonları sırasında hata: %s", str(e))

# Uygulama ve Socket.IO başlatma
app = Flask(__name__)
CORS(app)
# socketio = SocketIO(app, cors_allowed_origins="*")

# Blueprints (Controller'lar) import edilecek
from controllers.admin_controller import admin_bp
from controllers.user_controller import user_bp
from controllers.report_controller import report_bp

# Blueprints kayıt
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(user_bp, url_prefix='/api/users')
app.register_blueprint(report_bp, url_prefix='/api/reports')

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
    return jsonify({
        'status': 'error',
        'message': 'Sunucu hatası'
    }), 500

# Başlat
if __name__ == '__main__':
    # socketio.run(app, host='0.0.0.0', port=8000, debug=True)
    app.run(host='0.0.0.0', port=8000, debug=True) 