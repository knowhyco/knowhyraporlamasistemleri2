-- 10_Konusma_Akisi_Analizi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

WITH session_metrics AS (
    SELECT 
        session_id,
        created_date,
        role,
        LEAD(created_date) OVER (PARTITION BY session_id ORDER BY created_date) AS next_message_time,
        message_length
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
)
SELECT 
    session_id,
    MIN(created_date) AS conversation_start,
    MAX(created_date) AS conversation_end,
    COUNT(*) AS total_messages,
    ROUND(AVG(EXTRACT(EPOCH FROM (next_message_time - created_date)))) AS avg_time_between_messages_sec,
    MAX(EXTRACT(EPOCH FROM (next_message_time - created_date))) AS max_thinking_time_sec,
    MIN(CASE WHEN role = 'userMessage' THEN message_length END) AS min_user_message_length,
    MAX(CASE WHEN role = 'userMessage' THEN message_length END) AS max_user_message_length,
    AVG(CASE WHEN role = 'userMessage' THEN message_length END) AS avg_user_message_length
FROM 
    session_metrics
WHERE 
    next_message_time IS NOT NULL
GROUP BY 
    session_id
ORDER BY 
    conversation_start DESC
LIMIT 5000;