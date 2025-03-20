-- 5_Gunluk_Aktivite_ve_Etkin_Konusma_Saatleri
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    DATE(created_date) AS day,
    EXTRACT(HOUR FROM created_date) AS hour,
    COUNT(DISTINCT session_id) AS active_sessions,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
    COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_responses,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY 
    day, hour
ORDER BY 
    day DESC, hour;