-- Belirli bir tarih aralığındaki konuşma oturumlarını listeler
-- Parametreler:
-- {TABLE_NAME} - Mesaj tablosunun adı
-- {START_DATE} - Başlangıç tarihi (YYYY-MM-DD HH:MM:SS formatında)
-- {END_DATE} - Bitiş tarihi (YYYY-MM-DD HH:MM:SS formatında)

SELECT 
    session_id,
    MIN(created_date) AS conversation_start,
    MAX(created_date) AS conversation_end,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS messages_with_context
FROM 
    {TABLE_NAME}
WHERE 
    created_date BETWEEN '{START_DATE}' AND '{END_DATE}'
GROUP BY 
    session_id
ORDER BY 
    conversation_start DESC; 