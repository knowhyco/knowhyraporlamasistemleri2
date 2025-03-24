import psycopg2
import logging
from psycopg2.extras import RealDictCursor
import os
import sys
import traceback
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import (
    SUPABASE_URL, SUPABASE_HOST, SUPABASE_PORT, SUPABASE_DATABASE,
    SUPABASE_USER, SUPABASE_PASSWORD, SYSTEM_TABLE_PREFIX
)

def get_connection():
    """
    PostgreSQL veritabanına bağlantı oluşturur ve bir bağlantı nesnesi döndürür.
    """
    try:
        # SUPABASE_URL varsa, öncelikle onu kullan (tam bağlantı URL'si formatında)
        if SUPABASE_URL:
            conn = psycopg2.connect(SUPABASE_URL)
            logging.info("Supabase bağlantısı URL ile başarılı")
            return conn
        
        # URL yoksa diğer bağlantı parametrelerini kullan
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            database=SUPABASE_DATABASE,
            user=SUPABASE_USER,
            password=SUPABASE_PASSWORD
        )
        logging.info("Supabase bağlantısı parametrelerle başarılı")
        return conn
    except Exception as e:
        logging.error(f"Veritabanı bağlantı hatası: {e}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        raise

def execute_query(query, params=None, fetch_all=True, commit=False, log_error=True):
    """
    Veritabanında bir sorgu çalıştırır ve sonuçları döndürür.
    
    Args:
        query (str): Çalıştırılacak SQL sorgusu
        params (tuple, dict): Parametreler
        fetch_all (bool): Tüm sonuçları getir (True) veya sadece ilk satırı (False)
        commit (bool): İşlem sonrası commit yapılsın mı?
        log_error (bool): Hatayı logla
        
    Returns:
        list: Sorgu sonuçları liste olarak
        dict: Tek satır sorgu sonucu sözlük olarak
        None: Sorgu hiç sonuç döndürmediyse
    """
    conn = None
    try:
        conn = get_connection()
        logging.debug(f"Sorgu çalıştırılıyor: {query}")
        logging.debug(f"Parametreler: {params}")
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            
            if commit:
                conn.commit()
                logging.debug("Commit yapıldı")
                
            if cursor.description:
                if fetch_all:
                    result = cursor.fetchall()
                    logging.debug(f"Sorgu sonucu: {len(result)} satır")
                    return result
                else:
                    result = cursor.fetchone()
                    logging.debug(f"Sorgu sonucu: {result}")
                    return result
            
            return None
    except psycopg2.Error as e:
        if conn and commit:
            conn.rollback()
            logging.debug("Rollback yapıldı")
        
        # İstenirse hatayı logla
        if log_error:
            logging.error(f"SQL Sorgu hatası: {e}")
            logging.error(f"Sorgu: {query}")
            logging.error(f"Parametreler: {params}")
            logging.error(f"Hata detayı: {traceback.format_exc()}")
            logging.error(f"PostgreSQL Hata Kodu: {e.pgcode}")
            
            # Foreign key constraint hatası için özel mesaj
            if e.pgcode == '23503':  # foreign_key_violation
                logging.error("Foreign Key Constraint ihlali. Referans edilen tablo veya anahtarda sorun olabilir.")
                logging.error(f"Diag: {e.diag.message_detail if hasattr(e, 'diag') else 'Detay yok'}")
        
        raise
    except Exception as e:
        if conn and commit:
            conn.rollback()
            logging.debug("Rollback yapıldı")
        
        # İstenirse hatayı logla
        if log_error:
            logging.error(f"Genel sorgu hatası: {e}")
            logging.error(f"Sorgu: {query}")
            logging.error(f"Parametreler: {params}")
            logging.error(f"Hata detayı: {traceback.format_exc()}")
            
        raise
    finally:
        if conn:
            conn.close()
            logging.debug("Veritabanı bağlantısı kapatıldı")

def is_setup_done():
    """
    Sistemin kurulum durumunu kontrol eder.
    
    Returns:
        bool: Kurulum tamamlandıysa True, aksi halde False
    """
    try:
        # Önce knowhy_config tablosu var mı kontrol et
        # Global SYSTEM_TABLE_PREFIX kullanmak yerine DEFAULT prefix kullan
        # çünkü sistem henüz kurulmadığında SYSTEM_ID henüz belirlenmemiş olabilir
        prefix = 'knowhy_'
        
        if SYSTEM_TABLE_PREFIX.startswith('knowhy_') and len(SYSTEM_TABLE_PREFIX) > 7:
            # Eğer özelleştirilmiş prefix varsa, onu kullan
            prefix = SYSTEM_TABLE_PREFIX
        
        logging.debug(f"Kurulum kontrolü için prefix: {prefix}")
        
        # Önce herhangi bir config tablosu aramak için wildcard kullan
        query = """
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'knowhy_%config'
        """
        tables = execute_query(query)
        
        if not tables:
            logging.info("Kurulum kontrolü: Hiçbir config tablosu bulunamadı")
            return False
            
        logging.debug(f"Bulunan config tabloları: {tables}")
        
        # Her bir config tablosunda IS_SETUP_DONE kontrolü yap
        for table in tables:
            table_name = table['table_name']
            query = f"""
            SELECT config_value FROM {table_name} 
            WHERE config_key = 'IS_SETUP_DONE';
            """
            result = execute_query(query, fetch_all=False)
            
            if result and result['config_value'] == 'TRUE':
                logging.info(f"Kurulum kontrolü: '{table_name}' tablosunda tamamlanmış olarak işaretlenmiş")
                return True
                
        # Hiçbir tabloda tamamlanmış kurulum bulunamadı
        logging.info("Kurulum kontrolü: Tamamlanmamış")
        return False
        
    except Exception as e:
        logging.error(f"Kurulum durumu kontrolü hatası: {e}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        return False

def check_table_exists(table_name):
    """
    Belirtilen tablonun var olup olmadığını kontrol eder.
    
    Args:
        table_name (str): Kontrol edilecek tablo adı
        
    Returns:
        bool: Tablo mevcutsa True, aksi halde False
    """
    try:
        query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = %s
        ) AS table_exists;
        """
        result = execute_query(query, (table_name,), fetch_all=False)
        
        exists = result and result['table_exists']
        if exists:
            logging.info(f"'{table_name}' tablosu bulundu")
        else:
            logging.warning(f"'{table_name}' tablosu bulunamadı")
        return exists
    except Exception as e:
        logging.error(f"Tablo kontrolü hatası: {e}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        return False

def test_connection():
    """
    Veritabanı bağlantısını test eder ve sonucu döndürür.
    
    Returns:
        dict: Bağlantı durumu ve mesaj
    """
    try:
        conn = get_connection()
        if conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                conn.close()
                return {"status": "success", "message": "Veritabanı bağlantısı başarılı"}
    except Exception as e:
        logging.error(f"Bağlantı testi hatası: {e}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        return {"status": "error", "message": f"Veritabanı bağlantı hatası: {str(e)}"} 