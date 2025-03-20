-- Buradaki değişkenler admin panelinde sorulmalı ardından sorgulama kayıt edilmeli ve kullanıcı ekranında analiz görünmeli. Admin ekranında "aranacak kelime" "başlık" şeklinde doldurulmalı ve uygun sorgulama yazılmalı ve kayıt edilmeli. Uygun sayfa ve kodlama tasarımını yapmalısın.


SELECT 
    DATE_TRUNC('week', created_date) AS week,
    CASE 
        WHEN LOWER(content) LIKE '%saat%' OR LOWER(content) LIKE '%çalışma saatleri%' THEN 'Müze Çalışma Saatleri'
        WHEN LOWER(content) LIKE '%osmanlı%' THEN 'Osmanlı Dönemi'
        WHEN LOWER(content) LIKE '%atatürk%' THEN 'Atatürk İle İlgili'
        WHEN LOWER(content) LIKE '%gemi%' OR LOWER(content) LIKE '%tekne%' THEN 'Gemiler'
        WHEN LOWER(content) LIKE '%sancak%' THEN 'Sancak'
        ELSE 'Diğer'
    END AS topic,
    COUNT(*) AS question_count
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    role = 'userMessage'
    AND created_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY 
    week, topic
ORDER BY 
    week DESC, question_count DESC;