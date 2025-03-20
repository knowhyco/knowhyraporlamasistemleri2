-- 24_Yanit_Suresi_Analizi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

WITH user_messages AS (
    SELECT 
        session_id,
        created_date AS user_time,
        LEAD(created_date) OVER (PARTITION BY session_id ORDER BY created_date) AS next_user_time,
        content AS user_question,
        message_length AS question_length,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_date) AS msg_order
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
    WHERE 
        role = 'userMessage'
),
ai_messages AS (
    SELECT 
        session_id,
        created_date AS ai_time,
        content AS ai_answer,
        message_length AS answer_length,
        has_context,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_date) AS msg_order
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
    WHERE 
        role = 'apiMessage'
)
SELECT 
    u.session_id,
    u.user_question,
    a.ai_answer,
    u.question_length,
    a.answer_length,
    a.has_context,
    EXTRACT(EPOCH FROM (a.ai_time - u.user_time)) AS response_time_seconds,
    CASE 
        WHEN EXTRACT(EPOCH FROM (a.ai_time - u.user_time)) < 2 THEN 'Çok Hızlı (<2s)'
        WHEN EXTRACT(EPOCH FROM (a.ai_time - u.user_time)) < 5 THEN 'Hızlı (2-5s)'
        WHEN EXTRACT(EPOCH FROM (a.ai_time - u.user_time)) < 10 THEN 'Normal (5-10s)'
        ELSE 'Yavaş (>10s)'
    END AS response_speed_category
FROM 
    user_messages u
JOIN 
    ai_messages a ON u.session_id = a.session_id AND u.msg_order = a.msg_order
WHERE 
    a.ai_time > u.user_time
ORDER BY 
    response_time_seconds DESC
LIMIT 1000*;