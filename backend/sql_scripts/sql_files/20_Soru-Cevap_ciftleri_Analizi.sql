-- 20_Soru-Cevap_ciftleri_Analizi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

WITH ordered_messages AS (
    SELECT 
        session_id,
        message_id,
        role,
        content,
        created_date,
        message_length,
        has_context,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_date) AS msg_order
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
)
SELECT 
    q.session_id,
    q.content AS question,
    a.content AS answer,
    q.message_length AS question_length,
    a.message_length AS answer_length,
    a.has_context AS answer_used_context,
    EXTRACT(EPOCH FROM (a.created_date - q.created_date)) AS response_time_seconds
FROM 
    ordered_messages q
JOIN 
    ordered_messages a ON q.session_id = a.session_id AND q.msg_order + 1 = a.msg_order
WHERE 
    q.role = 'userMessage' AND a.role = 'apiMessage'
ORDER BY 
    q.created_date DESC
LIMIT 1000;
