import os
import sys
import logging
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db import execute_query, check_table_exists
from config import SYSTEM_TABLE_PREFIX

def create_system_tables():
    """
    Sistem için gerekli temel tabloları oluşturur.
    """
    try:
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
            category VARCHAR(100),
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
        
        # 5. Favoriler tablosu
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
        
        logging.info("Sistem tabloları başarıyla oluşturuldu")
        return True
        
    except Exception as e:
        logging.error(f"Sistem tabloları oluşturulurken hata: {e}")
        return False

def run_migrations():
    """
    Veritabanı tablolarını oluşturur ve gerekli migrasyonları çalıştırır.
    İlk kurulum sırasında veya sistem yükseltmelerinde kullanılır.
    """
    try:
        # Önce ana tabloları oluşturalım, bunlar kurulum sırasında eklenecek
        # Daha sonradan ilişkili tablolar için gerekli olacaklar
        
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
            category VARCHAR(100),
            parameters JSONB,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """, commit=True)
        
        # 4. Loglar tablosu - Bu tablo ilişkilidir, users tablosuna foreign key içerir
        # Tablolar oluşturulduktan sonra ekliyoruz
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
        
        # 5. Favoriler tablosu - Bu tablo ilişkilidir, users ve reports tablolarına foreign key içerir
        try:
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
        except Exception as e:
            # Foreign key constraint hatası durumunda, daha esnek bir şekilde tekrar deneyelim
            # Bu, kurulum aşamasında tablolar henüz oluşmamışsa bile çalışacaktır
            logging.warning(f"Favoriler tablosu oluşturma hatası: {e}")
            logging.info("Foreign key kısıtlamaları olmadan favoriler tablosu oluşturuluyor...")
            
            execute_query(f"""
            CREATE TABLE IF NOT EXISTS {SYSTEM_TABLE_PREFIX}favorites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                report_id INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, report_id)
            )
            """, commit=True)
        
        logging.info("Sistem tabloları başarıyla oluşturuldu")
        return True
    except Exception as e:
        logging.error(f"Veritabanı migrasyonu sırasında hata: {e}")
        raise

if __name__ == "__main__":
    # Script doğrudan çalıştırıldığında migrasyonları başlat
    run_migrations() 