#!/bin/bash
echo '🧹 Knowhy Raporlama Sistemi Sıfırlama Scripti 🧹'
echo '-------------------------------------------'
echo 'Bu script, Knowhy Raporlama Sistemini tamamen sıfırlar.'
echo 'Tüm sistem tabloları ve yapılandırma silinecektir!'
echo ''
read -p 'Devam etmek istiyor musunuz? (evet/hayır): ' confirm

if [[ $confirm != 'evet' ]]; then
    echo 'İşlem iptal edildi.'
    exit 1
fi

echo 'Sistem sıfırlanıyor...'

# Docker containerlarını durdur
docker-compose down

# .env dosyasından SYSTEM_ID'yi kaldır
grep -v 'SYSTEM_ID=' .env > .env.temp
mv .env.temp .env

echo 'SYSTEM_ID .env dosyasından silindi.'

# Veritabanı bağlantı bilgilerini oku
source .env
SUPABASE_DB_URL=$SUPABASE_URL

# SQL komutunu oluştur
SQL_COMMAND="
DO \$\$ 
BEGIN
    -- Tüm knowhy_ ile başlayan tabloları bul ve sil
    FOR table_name IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE 'knowhy\\_%' 
    )
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || table_name || ' CASCADE';
        RAISE NOTICE 'Tablo silindi: %', table_name;
    END LOOP;
END \$\$;
"

# SQL'i çalıştır (postgresql istemcisi varsa)
if command -v psql &> /dev/null; then
    echo "SQL sorgusu çalıştırılıyor..."
    echo "$SQL_COMMAND" | psql "$SUPABASE_DB_URL"
    echo "Veritabanındaki knowhy_ tabloları silindi."
else
    echo "PostgreSQL istemcisi (psql) bulunamadı."
    echo "Knowhy ile başlayan tüm tabloları manuel olarak silmeniz gerekecek."
fi

echo 'Docker containerları yeniden başlatılıyor...'
docker-compose up -d

echo ''
echo '✅ Sistem başarıyla sıfırlandı!'
echo 'Kurulum sihirbazı ilk girişte otomatik olarak açılacaktır.'
