SELECT 
    session_id,
    MIN(created_date) AS conversation_start,
    MAX(created_date) AS conversation_end,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
    COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_messages,
    SUBSTRING(MIN(CASE WHEN role = 'userMessage' THEN content END) FOR 50) AS first_user_message
FROM 
    customer_denizmuzesi
WHERE 
    DATE(created_date) = '2025-02-20'  -- Seçilen tarih
GROUP BY 
    session_id
ORDER BY 
    conversation_start DESC;
	

Tarih aralığındaki konuşma oturumlarını listele:
SELECT 
    session_id,
    MIN(created_date) AS conversation_start,
    MAX(created_date) AS conversation_end,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS messages_with_context
FROM 
    customer_denizmuzesi
WHERE 
    created_date BETWEEN '2025-02-15 00:00:00' AND '2025-02-21 23:59:59'
GROUP BY 
    session_id
ORDER BY 
    conversation_start DESC;