-- Buradaki değişkenler admin panelinde sorulmalı ardından sorgulama kayıt edilmeli ve kullanıcı ekranında analiz görünmeli. Admin ekranında "aranacak kelime" "başlık" şeklinde doldurulmalı ve uygun sorgulama yazılmalı ve kayıt edilmeli.

SELECT 
    EXTRACT(HOUR FROM created_date) AS hour_of_day,
    CASE 
        WHEN LOWER(content) LIKE '%saat%' OR LOWER(content) LIKE '%açık%' THEN 'Çalışma Saatleri'
        WHEN LOWER(content) LIKE '%fiyat%' OR LOWER(content) LIKE '%ücret%' THEN 'Bilet Fiyatları'
        WHEN LOWER(content) LIKE '%osmanlı%' THEN 'Osmanlı Dönemi'
        WHEN LOWER(content) LIKE '%atatürk%' THEN 'Atatürk'
        WHEN LOWER(content) LIKE '%gemi%' OR LOWER(content) LIKE '%tekne%' THEN 'Deniz Araçları'
        ELSE 'Diğer'
    END AS query_topic,
    COUNT(*) AS query_count
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    role = 'userMessage'
GROUP BY 
    hour_of_day, query_topic
ORDER BY 
    hour_of_day, query_count DESC;
