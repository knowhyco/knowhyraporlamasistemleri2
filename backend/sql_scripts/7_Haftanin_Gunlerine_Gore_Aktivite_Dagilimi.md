SELECT 
    TO_CHAR(created_date, 'Day') AS day_of_week,
    EXTRACT(DOW FROM created_date) AS day_number,
    COUNT(DISTINCT session_id) AS conversation_count,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
GROUP BY 
    day_of_week, day_number
ORDER BY 
    day_number;
	

Ay Bazında Trend Analizi:
SELECT 
    DATE_TRUNC('month', created_date) AS month,
    COUNT(DISTINCT session_id) AS total_conversations,
    COUNT(*) AS total_messages,
    COUNT(DISTINCT session_id)::float / EXTRACT(DAY FROM DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day') AS avg_daily_conversations,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END)::float * 100 / COUNT(*), 2) AS context_usage_percentage
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY 
    month
ORDER BY 
    month;