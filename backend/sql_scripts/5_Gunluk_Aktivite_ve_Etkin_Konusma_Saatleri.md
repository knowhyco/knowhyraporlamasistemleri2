SELECT 
    DATE(created_date) AS day,
    EXTRACT(HOUR FROM created_date) AS hour,
    COUNT(DISTINCT session_id) AS active_sessions,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
    COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_responses,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY 
    day, hour
ORDER BY 
    day DESC, hour;