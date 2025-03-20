import os
from dotenv import load_dotenv

load_dotenv()

# Supabase/PostgreSQL Bağlantı Bilgileri
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_HOST = os.getenv('SUPABASE_HOST')
SUPABASE_PORT = os.getenv('SUPABASE_PORT')
SUPABASE_DATABASE = os.getenv('SUPABASE_DATABASE')
SUPABASE_USER = os.getenv('SUPABASE_USER')
SUPABASE_PASSWORD = os.getenv('SUPABASE_PASSWORD')

# Uygulama Ayarları
SECRET_KEY = os.getenv('SECRET_KEY')
JWT_SECRET = os.getenv('JWT_SECRET')
JWT_EXPIRATION = 86400  # 24 saat (saniye cinsinden)

# Sistem Tabloları Prefix'i
SYSTEM_TABLE_PREFIX = 'knowhy_'

# Varsayılan Admin Bilgileri (ilk kurulum için)
DEFAULT_ADMIN_USERNAME = 'admin'
DEFAULT_ADMIN_PASSWORD = 'admin123'

# SQL Sorgu Dosyaları Klasörü
SQL_SCRIPTS_FOLDER = os.path.join(os.path.dirname(__file__), 'sql_scripts')

# Log Ayarları
LOG_FOLDER = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_FOLDER, exist_ok=True) 