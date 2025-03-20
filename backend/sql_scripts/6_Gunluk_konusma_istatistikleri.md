SELECT 
    DATE(created_date) AS date,
    COUNT(DISTINCT session_id) AS total_conversations,
    COUNT(*) AS total_messages,
    COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
    COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_messages,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS messages_with_context,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    customer_denizmuzesi
WHERE 
    created_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE
GROUP BY 
    DATE(created_date)
ORDER BY 
    date DESC;