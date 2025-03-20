SELECT 
    EXTRACT(HOUR FROM created_date) AS hour_of_day,
    COUNT(DISTINCT session_id) AS conversation_count,
    COUNT(*) AS message_count,
    ROUND(AVG(message_length)) AS avg_message_length,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
GROUP BY 
    hour_of_day
ORDER BY 
    hour_of_day;
