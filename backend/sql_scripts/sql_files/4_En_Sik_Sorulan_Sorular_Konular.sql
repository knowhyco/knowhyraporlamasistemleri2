-- 4_En_Sik_Sorulan_Sorular_Konular
-- Parametreler:
-- {END_DATE} - End Date (örn. 2025-03-21)
-- {START_DATE} - Start Date (örn. 2025-03-14)
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)
-- {TOPIC_CASE_EXPRESSION} - Topic Case Expression (örn. CASE WHEN LOWER(content) LIKE '%saat%' THEN 'Çalışma Saatleri' ELSE 'Diğer' END)

-- Buradaki değişkenler admin panelinde sorulmalı ardından sorgulama kayıt edilmeli ve kullanıcı ekranında analiz görünmeli. Admin ekranında "aranacak kelime" "başlık" şeklinde doldurulmalı ve uygun sorgulama yazılmalı ve kayıt edilmeli. Uygun sayfa ve kodlama tasarımını yapmalısın.

SELECT 
    {{TOPIC_CASE_EXPRESSION}} AS question_category,
    COUNT(*) AS question_count,
    ROUND(AVG(message_length)) AS avg_question_length,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM 
    {{TABLE_NAME}}
WHERE 
    role = 'userMessage'
    AND created_date BETWEEN '{{START_DATE}}' AND '{{END_DATE}}'
GROUP BY 
    question_category
ORDER BY 
    question_count DESC;
