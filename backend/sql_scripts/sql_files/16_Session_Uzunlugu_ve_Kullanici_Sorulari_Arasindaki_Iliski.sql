-- 16_Session_Uzunlugu_ve_Kullanici_Sorulari_Arasindaki_İliski
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

WITH session_stats AS (
    SELECT 
        session_id,
        COUNT(*) AS message_count,
        COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_message_count,
        EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
    GROUP BY 
        session_id
),
first_questions AS (
    SELECT DISTINCT ON (session_id)
        session_id,
        content AS first_question,
        message_length
    FROM 
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
    WHERE 
        role = 'userMessage'
    ORDER BY 
        session_id, created_date
)
SELECT 
    CASE 
        WHEN ss.message_count <= 2 THEN 'Kısa (1-2 mesaj)'
        WHEN ss.message_count BETWEEN 3 AND 6 THEN 'Orta (3-6 mesaj)'
        ELSE 'Uzun (7+ mesaj)'
    END AS session_length_category,
    ROUND(AVG(ss.duration_minutes), 2) AS avg_duration_minutes,
    ROUND(AVG(fq.message_length), 2) AS avg_first_question_length,
    COUNT(*) AS session_count,
    CASE
        WHEN AVG(fq.message_length) < 50 THEN 'Kısa soru (<50 karakter)'
        WHEN AVG(fq.message_length) BETWEEN 50 AND 150 THEN 'Orta uzunlukta soru (50-150)'
        ELSE 'Uzun soru (>150 karakter)'
    END AS question_length_category
FROM 
    session_stats ss
JOIN 
    first_questions fq ON ss.session_id = fq.session_id
GROUP BY 
    session_length_category
ORDER BY 
    AVG(ss.message_count);