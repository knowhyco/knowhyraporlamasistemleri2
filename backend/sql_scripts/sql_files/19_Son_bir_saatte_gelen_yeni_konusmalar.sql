-- 19_Son_bir_saatte_gelen_yeni_konusmalar
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    session_id,
    MIN(created_date) AS start_time,
    COUNT(*) AS message_count,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_date)))/60 AS minutes_ago
FROM 
    {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY 
    session_id
ORDER BY 
    start_time DESC;
