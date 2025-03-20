import os
import re
import logging
from datetime import datetime, timedelta
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import SQL_SCRIPTS_FOLDER, SYSTEM_TABLE_PREFIX

def get_sql_file_path(report_name):
    """
    Rapor adına göre SQL dosya yolunu döndürür.
    
    Args:
        report_name (str): Rapor adı
        
    Returns:
        str: SQL dosya yolu
    """
    # Önce SQL dosyalarının olduğu dizinde ara
    sql_file = os.path.join(SQL_SCRIPTS_FOLDER, "sql_files", f"{report_name}.sql")
    
    if os.path.exists(sql_file):
        return sql_file
    
    # Yoksa .md dosyalarını kontrol et
    md_file = os.path.join(SQL_SCRIPTS_FOLDER, f"{report_name}.md")
    
    if os.path.exists(md_file):
        return md_file
        
    # Bulunamazsa hata fırlat
    logging.error(f"SQL dosyası bulunamadı: {report_name}")
    raise FileNotFoundError(f"SQL dosyası bulunamadı: {report_name}")

def read_sql_file(report_name):
    """
    SQL dosyasını okur ve içeriği döndürür.
    
    Args:
        report_name (str): Rapor adı
        
    Returns:
        str: SQL sorgusu
    """
    sql_file = get_sql_file_path(report_name)
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # .md uzantılı dosya ise içindeki SQL sorgusunu çıkar
    if sql_file.endswith('.md'):
        # Markdown dosyasında ```sql ... ``` bloğunu ara
        sql_match = re.search(r'```sql\s*(.*?)\s*```', content, re.DOTALL)
        
        # Yoksa direkt içeriği kullan (bazı .md dosyaları SQL bloğu içermeyebilir)
        if sql_match:
            content = sql_match.group(1).strip()
        
        # SQL yorum satırlarını temizle
        content = re.sub(r'--.*?\n', '\n', content)
        # Özel tablo isimlerini {TABLE_NAME} ile değiştir
        content = re.sub(r'customer_\w+', '{TABLE_NAME}', content)
    
    return content.strip()

def extract_parameters(sql_query):
    """
    SQL sorgusundan parametre adlarını çıkarır.
    
    Args:
        sql_query (str): SQL sorgusu
        
    Returns:
        list: Parametre adları listesi
    """
    # {PARAMETER} şeklindeki parametreleri bul
    param_matches = re.findall(r'\{([A-Z_]+)\}', sql_query)
    
    # Tekrar eden parametreleri çıkar ve sırala
    return sorted(list(set(param_matches)))

def replace_placeholders(sql_query, params):
    """
    SQL sorgusundaki yer tutucuları gerçek değerlerle değiştirir.
    
    Args:
        sql_query (str): SQL sorgusu
        params (dict): Parametre adı-değer çiftleri
        
    Returns:
        str: Parametrelerle değiştirilmiş SQL sorgusu
    """
    result = sql_query
    
    for key, value in params.items():
        # Güvenlik: Tehlikeli karakterleri temizle
        if isinstance(value, str):
            # SQL injection önleme için özel karakterleri escape et
            value = value.replace("'", "''")
        
        # {KEY} placeholder'ını değerle değiştir
        result = result.replace(f"{{{key}}}", str(value))
    
    return result

def get_default_parameter_value(param_name):
    """
    Parametre adına göre varsayılan değer döndürür.
    
    Args:
        param_name (str): Parametre adı
        
    Returns:
        str: Varsayılan değer
    """
    today = datetime.now()
    
    # Tablo adı
    if param_name == 'TABLE_NAME':
        return 'customer_denizmuzesi'
    
    # Tarih parametreleri için varsayılan değerler
    if param_name == 'START_DATE':
        return (today - timedelta(days=7)).strftime('%Y-%m-%d')
    elif param_name == 'END_DATE':
        return today.strftime('%Y-%m-%d')
    elif param_name == 'SELECTED_DATE':
        return today.strftime('%Y-%m-%d')
    elif param_name == 'INTERVAL':
        return '24 hours'
    elif param_name == 'TIME_ZONE':
        return 'UTC'
    elif param_name == 'DAYS_INTERVAL':
        return '30'
    elif param_name == 'HOURS_INTERVAL':
        return '24'
    # İçerik parametreleri
    elif param_name == 'EXCLUDED_WORDS':
        return "'ve', 'veya', 'için', 'bir', 'ile', 'bu', 'de', 'da'"
    elif param_name == 'MIN_WORD_LENGTH':
        return '3'
    elif param_name == 'MIN_WORD_COUNT':
        return '5'
    elif param_name == 'MIN_OCCURRENCE':
        return '5'
    elif param_name == 'WORD_LIMIT':
        return '100'
    elif param_name == 'RESULT_LIMIT':
        return '100'
    # Performans parametreleri
    elif param_name == 'RESPONSE_TIME_THRESHOLD':
        return '10'
    elif param_name == 'SESSION_LENGTH_MIN':
        return '3'
    elif param_name == 'MESSAGE_COUNT_MIN':
        return '5'
    elif param_name == 'MIN_MESSAGE_COUNT':
        return '2'
    # Detay parametreleri
    elif param_name == 'SESSION_ID':
        return ''
    elif param_name == 'USER_ID':
        return ''
    elif param_name == 'CONTEXT_FILTER':
        return 'TRUE'
    elif param_name == 'TOPIC_CASE_EXPRESSION':
        return "CASE WHEN LOWER(content) LIKE '%saat%' THEN 'Çalışma Saatleri' ELSE 'Diğer' END"
    # Bilinmeyen parametreler için boş string
    else:
        return ''

def execute_sql_from_file(report_name, params=None):
    """
    SQL dosyasını okur, parametreleri değiştirir ve veritabanında çalıştırır.
    
    Args:
        report_name (str): Rapor adı
        params (dict): Parametre değerleri
        
    Returns:
        list: Sorgu sonuçları
    """
    from utils.db import execute_query
    
    # SQL dosyasını oku
    sql_query = read_sql_file(report_name)
    
    # Parametreleri çıkar
    all_params = extract_parameters(sql_query)
    
    # Eksik parametrelere varsayılan değerler ata
    params = params or {}
    for param in all_params:
        if param not in params:
            params[param] = get_default_parameter_value(param)
    
    # Parametreleri değiştir
    sql_with_params = replace_placeholders(sql_query, params)
    
    # Sorguyu çalıştır
    return execute_query(sql_with_params)

def convert_md_to_sql_files():
    """
    MD formatındaki SQL sorgularını SQL dosyalarına dönüştürür.
    """
    md_files_dir = SQL_SCRIPTS_FOLDER
    sql_files_dir = os.path.join(SQL_SCRIPTS_FOLDER, "sql_files")
    
    # SQL_files dizini yoksa oluştur
    if not os.path.exists(sql_files_dir):
        os.makedirs(sql_files_dir)
    
    # MD dosyalarını listele
    for filename in os.listdir(md_files_dir):
        if filename.endswith('.md') and not filename.startswith('checklist') and not filename == 'README.md':
            md_file_path = os.path.join(md_files_dir, filename)
            
            # SQL dosya adını oluştur (.md -> .sql)
            sql_filename = filename[:-3] + '.sql'
            # Türkçe karakterleri düzelt
            sql_filename = sql_filename.replace('İ', 'I').replace('ı', 'i').replace('ğ', 'g').replace('ü', 'u').replace('ş', 's').replace('ç', 'c').replace('ö', 'o')
            sql_file_path = os.path.join(sql_files_dir, sql_filename)
            
            # MD dosyasını oku
            try:
                with open(md_file_path, 'r', encoding='utf-8') as md_file:
                    content = md_file.read()
                
                # Markdown içinden SQL sorgusunu çıkar
                sql_match = re.search(r'```sql\s*(.*?)\s*```', content, re.DOTALL)
                
                # SQL bloğu yoksa, direkt içeriği SQL kabul et
                sql_content = sql_match.group(1).strip() if sql_match else content
                
                # Özel tablo isimlerini {TABLE_NAME} ile değiştir
                sql_content = re.sub(r'customer_\w+', '{TABLE_NAME}', sql_content)
                
                # Başlığı bul ve açıklama olarak ekle
                title_match = re.search(r'^# (.*?)$', content, re.MULTILINE)
                title = title_match.group(1) if title_match else os.path.splitext(filename)[0]
                
                # Açıklamayı bul
                desc_match = re.search(r'^# .*?\n(.*?)(?=\n```|\n#|$)', content, re.DOTALL)
                description = desc_match.group(1).strip() if desc_match else ""
                
                # Parametreleri bul
                parameters = extract_parameters(sql_content)
                
                # SQL dosyasını oluştur
                with open(sql_file_path, 'w', encoding='utf-8') as sql_file:
                    sql_file.write(f"-- {title}\n")
                    if description:
                        sql_file.write(f"-- {description}\n")
                    sql_file.write("-- Parametreler:\n")
                    
                    for param in parameters:
                        default_value = get_default_parameter_value(param)
                        sql_file.write(f"-- {{{param}}} - {param.replace('_', ' ').title()} ")
                        if default_value:
                            sql_file.write(f"(örn. {default_value})")
                        sql_file.write("\n")
                    
                    sql_file.write("\n")
                    sql_file.write(sql_content)
                
                logging.info(f"'{md_file_path}' dosyası '{sql_file_path}' olarak dönüştürüldü.")
                
            except Exception as e:
                logging.error(f"'{md_file_path}' dosyası dönüştürülürken hata: {e}") 