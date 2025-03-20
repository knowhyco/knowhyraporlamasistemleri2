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

def execute_query(query, params=None, fetch_all=True, commit=False):
    """
    Veritabanında bir sorgu çalıştırır ve sonuçları döndürür.
    
    Args:
        query (str): Çalıştırılacak SQL sorgusu
        params (tuple, dict): Parametreler
        fetch_all (bool): Tüm sonuçları getir (True) veya sadece ilk satırı (False)
        commit (bool): İşlem sonrası commit yapılsın mı?
        
    Returns:
        list: Sorgu sonuçları liste olarak
        dict: Tek satır sorgu sonucu sözlük olarak
        None: Sorgu hiç sonuç döndürmediyse
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            
            if commit:
                conn.commit()
                
            if cursor.description:
                if fetch_all:
                    return cursor.fetchall()
                else:
                    return cursor.fetchone()
            
            return None
    except Exception as e:
        if conn and commit:
            conn.rollback()
        logging.error(f"Sorgu hatası: {e}")
        logging.error(f"Sorgu: {query}")
        logging.error(f"Parametreler: {params}")
        logging.error(f"Hata detayı: {traceback.format_exc()}")
        raise
    finally:
        if conn:
            conn.close()

def is_setup_done():
    """
    Sistemin kurulum durumunu kontrol eder.
    
    Returns:
        bool: Kurulum tamamlandıysa True, aksi halde False
    """
    try:
        # Önce knowhy_config tablosu var mı kontrol et
        query = """
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = %s
        ) AS table_exists;
        """
        result = execute_query(query, (f"{SYSTEM_TABLE_PREFIX}config",), fetch_all=False)
        
        if not result or not result['table_exists']:
            logging.info("Kurulum kontrolü: knowhy_config tablosu bulunamadı")
            return False
            
        # IS_SETUP_DONE değerini kontrol et
        query = """
        SELECT config_value FROM %s 
        WHERE config_key = 'IS_SETUP_DONE';
        """
        query = query % (f"{SYSTEM_TABLE_PREFIX}config")
        result = execute_query(query, fetch_all=False)
        
        setup_done = result and result['config_value'] == 'TRUE'
        logging.info(f"Kurulum kontrolü: {'Tamamlanmış' if setup_done else 'Tamamlanmamış'}")
        return setup_done
        
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