import os
import uuid
import json
from dotenv import load_dotenv
import logging
import traceback

# .env dosyasını yükle
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

# Sistem ID'si (farklı kurulumlar için)
# NOT: Bu ID artık kurulum sihirbazında kullanıcı tarafından girilecek
# .env'de tanımlı bir SYSTEM_ID varsa kullan, yoksa bu sadece geçici bir değerdir ve kurulum sırasında değiştirilecektir
SYSTEM_ID = os.getenv('SYSTEM_ID', 'DEFAULT')

# Sistem Tabloları Prefix'i - Eğer henüz ID atanmadıysa geçici bir değer kullan
# Kurulum tamamlandığında bu değer kullanıcının girdiği ID ile güncellenecek
SYSTEM_TABLE_PREFIX = f'knowhy_{SYSTEM_ID}_' if SYSTEM_ID != 'DEFAULT' else 'knowhy_setup_'

def update_system_id(new_id):
    """
    Sistem ID'sini günceller ve .env dosyasına kaydeder
    
    Args:
        new_id (str): Yeni sistem ID'si
    
    Returns:
        bool: İşlem başarılıysa True, değilse False
    """
    global SYSTEM_ID, SYSTEM_TABLE_PREFIX
    
    try:
        # Global değişkenleri güncelle
        SYSTEM_ID = new_id
        SYSTEM_TABLE_PREFIX = f'knowhy_{SYSTEM_ID}_'
        
        # .env dosyasını güncelle
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        logging.info(f"Güncellenecek .env dosyası yolu: {env_path}")
        
        try:
            # Docker konteynerindeki dosya yolu farklı olabilir, o yüzden hem mevcut çalışma dizinindeki 
            # hem de uygulama dizinindeki .env dosyalarını kontrol edelim
            if not os.path.exists(env_path):
                logging.warning(f".env dosyası {env_path} yolunda bulunamadı, alternatif yol deneniyor")
                env_path = os.path.join(os.getcwd(), '.env')
                
                if not os.path.exists(env_path):
                    logging.warning(f".env dosyası {env_path} yolunda da bulunamadı, /app/.env yolu deneniyor")
                    env_path = '/app/.env'
                    
                    if not os.path.exists(env_path):
                        # Son çare olarak direkt yazılabilir bir dosya oluşturalım
                        logging.warning("Hiçbir .env dosyası bulunamadı, yeni bir dosya oluşturuluyor")
                        env_path = os.path.join(os.getcwd(), '.env')
                        with open(env_path, 'w') as f:
                            f.write(f'SYSTEM_ID={new_id}\n')
                        logging.info(f"Yeni .env dosyası oluşturuldu: {env_path}")
                        return True
            
            # Mevcut dosyayı oku
            with open(env_path, 'r') as f:
                env_content = f.read()
                
            # SYSTEM_ID satırı var mı kontrol et
            if 'SYSTEM_ID=' in env_content:
                # Satırı güncelle
                env_lines = env_content.splitlines()
                updated_lines = []
                for line in env_lines:
                    if line.startswith('SYSTEM_ID='):
                        updated_lines.append(f'SYSTEM_ID={new_id}')
                    else:
                        updated_lines.append(line)
                env_content = '\n'.join(updated_lines)
            else:
                # Yeni satır ekle
                env_content += f'\nSYSTEM_ID={new_id}'
                
            # Dosyaya yaz
            with open(env_path, 'w') as f:
                f.write(env_content)
                
            logging.info(f"SYSTEM_ID başarıyla güncellendi: {new_id}, dosya: {env_path}")
            return True
        except Exception as e:
            logging.error(f".env dosyası güncelleme hatası: {e}")
            logging.error(traceback.format_exc())
            
            # .env dosyasına yazamasak bile global değişkenleri güncelledik
            # Bu durumda kurulum işlemine devam edip sadece bir uyarı gösterelim
            logging.warning("SYSTEM_ID .env dosyasına yazılamadı, ancak uygulama hafızasında güncellendi")
            return True
    except Exception as e:
        logging.error(f"SYSTEM_ID güncellenirken hata oluştu: {e}")
        logging.error(traceback.format_exc())
        return False

# Varsayılan Admin Bilgileri (ilk kurulum için)
DEFAULT_ADMIN_USERNAME = 'admin'
DEFAULT_ADMIN_PASSWORD = 'admin123'

# SQL Sorgu Dosyaları Klasörü
SQL_SCRIPTS_FOLDER = os.path.join(os.path.dirname(__file__), 'sql_scripts')

# Log Ayarları
LOG_FOLDER = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_FOLDER, exist_ok=True) 