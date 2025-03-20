-- 25_Yanit_verme_suresine_gore_oturumlar
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

WITH user_messages AS (
    SELECT 
        session_id,
        message_id,
        created_date AS user_message_time
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
    WHERE 
        role = 'userMessage'
),
ai_messages AS (
    SELECT 
        session_id,
        message_id,
        created_date AS ai_message_time,
        LAG(created_date) OVER (PARTITION BY session_id ORDER BY created_date) AS prev_message_time
    FROM 
        {TABLE_NAME}
    WHERE 
        role = 'apiMessage'
)
SELECT 
    u.session_id,
    COUNT(DISTINCT u.message_id) AS total_user_messages,
    COUNT(DISTINCT a.message_id) AS total_ai_messages,
    ROUND(AVG(EXTRACT(EPOCH FROM (a.ai_message_time - u.user_message_time)))) AS avg_response_time_seconds
FROM 
    user_messages u
JOIN 
    ai_messages a ON u.session_id = a.session_id 
    AND a.ai_message_time > u.user_message_time
GROUP BY 
    u.session_id
ORDER BY 
    avg_response_time_seconds;