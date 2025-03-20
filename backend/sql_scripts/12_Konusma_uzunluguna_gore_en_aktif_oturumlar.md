SELECT 
    session_id,
    COUNT(*) AS message_count,
    MIN(created_date) AS start_time,
    MAX(created_date) AS end_time,
    SUM(CASE WHEN role = 'userMessage' THEN 1 ELSE 0 END) AS user_messages,
    SUM(CASE WHEN role = 'apiMessage' THEN 1 ELSE 0 END) AS ai_messages,
    SUM(message_length) AS total_content_length
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
GROUP BY 
    session_id
ORDER BY 
    message_count DESC
LIMIT 1000;
