SQL TABLO YAPISI:

CREATE TABLE customer_testicerik (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    message_id UUID NOT NULL,
    
    -- Mesaj temel bilgileri
    role TEXT NOT NULL,           -- 'userMessage' veya 'apiMessage'
    content TEXT,                 -- Mesaj içeriği
    created_date TIMESTAMP WITH TIME ZONE,
    
    -- Sıralama ve ilişkilendirme için
    chat_id UUID,                 -- API'den gelen chatId
    chatflow_id UUID,             -- API'den gelen chatflowid
    
    -- Meta veriler
    chat_type TEXT,               -- Örn: EXTERNAL
    memory_type TEXT,             -- Örn: DynamoDB Chat Memory
    
    -- Context ve araç kullanımı bilgileri (ayrı bir alanda)
    context_info JSONB,           -- Context bilgisi (used_tools içeriğinden)
    context_summary TEXT,         -- Context'in özeti (raporlama için)
    
    -- Diğer isteğe bağlı alanlar
    source_documents JSONB,
    file_uploads JSONB,
    file_annotations JSONB,
    agent_reasoning JSONB,
    artifacts JSONB,
    action JSONB,
    lead_email TEXT,
    follow_up_prompts JSONB,
    
    -- Analiz ve raporlama için
    message_length INT,            -- Mesaj uzunluğu
    response_time INT,             -- Yanıt süresi (ms) - Hesaplanabilir
    has_context BOOLEAN DEFAULT FALSE  -- Context kullanılmış mı?
);

-- Performans için indeksler
CREATE INDEX idx_testicerik_session_id ON customer_testicerik(session_id);
CREATE INDEX idx_testicerik_created_date ON customer_testicerik(created_date);
CREATE INDEX idx_testicerik_role ON customer_testicerik(role);
CREATE INDEX idx_testicerik_has_context ON customer_testicerik(has_context);


## AŞAĞIDA Kİ TÜM SQL KODLARI customer_denizmuzesi TABLOSU İÇİN GEÇERLİDİR.
örnek bir oturum konuşma takibi:
SELECT 
  session_id, 
  role, 
  content, 
  context_summary,
  created_date 
FROM customer_denizmuzesi 
WHERE session_id = '47137f82-ad48-4df1-baca-1dee92ae1397' 
ORDER BY created_date;


Belirli bir gündeki konuşma oturumlarını listele:
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
	

Seçilen oturumdaki tüm mesajları kronolojik sırayla listele:
SELECT 
    message_id,
    role,
    content,
    created_date,
    has_context,
    context_summary,
    message_length
FROM 
    customer_denizmuzesi
WHERE 
    session_id = '47137f82-ad48-4df1-baca-1dee92ae1397'  -- Kullanıcının seçtiği oturum ID'si
ORDER BY 
    created_date ASC;
	
	
Context kullanan yanıtlar dahil detaylı oturum görünümü:
SELECT 
    m.message_id,
    m.role,
    m.content,
    m.created_date,
    m.has_context,
    m.context_summary,
    -- Önceki mesaj bilgisi (kullanıcı sorusu için)
    LAG(m.content) OVER (ORDER BY m.created_date) AS previous_message
FROM 
    customer_denizmuzesi m
WHERE 
    m.session_id = '47137f82-ad48-4df1-baca-1dee92ae1397'
ORDER BY 
    m.created_date ASC;
	

Günlük konuşma istatistikleri:
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
	

En sık kullanılan içerik/kelimeler:
SELECT 
    word,
    COUNT(*) AS occurrence_count
FROM (
    SELECT 
        regexp_split_to_table(LOWER(content), '\s+') AS word
    FROM 
        customer_denizmuzesi
    WHERE 
        role = 'userMessage'
        AND LENGTH(word) > 3  -- 3 karakterden uzun kelimeleri filtrele
) words
GROUP BY 
    word
ORDER BY 
    occurrence_count DESC
LIMIT 20;


Context kullanım istatistikleri:
SELECT 
    DATE(created_date) AS date,
    COUNT(*) AS total_ai_responses,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS responses_with_context,
    ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END) * 100.0 / COUNT(*)) AS context_usage_percentage
FROM 
    customer_denizmuzesi
WHERE 
    role = 'apiMessage'
    AND created_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    date
ORDER BY 
    date DESC;
	

Son 24 saatteki aktif oturumlar:
SELECT 
    session_id,
    MIN(created_date) AS start_time,
    MAX(created_date) AS end_time,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
FROM 
    customer_denizmuzesi
WHERE 
    created_date >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY 
    session_id
HAVING 
    COUNT(*) > 2  -- En az 3 mesaj içeren oturumlar
ORDER BY 
    end_time DESC;
	
	

Konuşma uzunluğuna göre en aktif oturumlar:
SELECT 
    session_id,
    COUNT(*) AS message_count,
    MIN(created_date) AS start_time,
    MAX(created_date) AS end_time,
    SUM(CASE WHEN role = 'userMessage' THEN 1 ELSE 0 END) AS user_messages,
    SUM(CASE WHEN role = 'apiMessage' THEN 1 ELSE 0 END) AS ai_messages,
    SUM(message_length) AS total_content_length
FROM 
    customer_denizmuzesi
GROUP BY 
    session_id
ORDER BY 
    message_count DESC
LIMIT 10;


Yanıt verme süresine göre oturumlar:
WITH user_messages AS (
    SELECT 
        session_id,
        message_id,
        created_date AS user_message_time
    FROM 
        customer_denizmuzesi
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
        customer_denizmuzesi
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
	

Son bir saatte gelen yeni konuşmalar:
SELECT 
    session_id,
    MIN(created_date) AS start_time,
    COUNT(*) AS message_count,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_date)))/60 AS minutes_ago
FROM 
    customer_denizmuzesi
WHERE 
    created_date >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY 
    session_id
ORDER BY 
    start_time DESC;
	


Saatlik Aktivite Analizi:
SELECT 
    EXTRACT(HOUR FROM created_date) AS hour_of_day,
    COUNT(DISTINCT session_id) AS conversation_count,
    COUNT(*) AS message_count,
    ROUND(AVG(message_length)) AS avg_message_length,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count
FROM 
    customer_denizmuzesi
GROUP BY 
    hour_of_day
ORDER BY 
    hour_of_day;
	
	
Haftanın Günlerine Göre Aktivite Dağılımı:
SELECT 
    TO_CHAR(created_date, 'Day') AS day_of_week,
    EXTRACT(DOW FROM created_date) AS day_number,
    COUNT(DISTINCT session_id) AS conversation_count,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    customer_denizmuzesi
GROUP BY 
    day_of_week, day_number
ORDER BY 
    day_number;
	

Ay Bazında Trend Analizi:
SELECT 
    DATE_TRUNC('month', created_date) AS month,
    COUNT(DISTINCT session_id) AS total_conversations,
    COUNT(*) AS total_messages,
    COUNT(DISTINCT session_id)::float / EXTRACT(DAY FROM DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day') AS avg_daily_conversations,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END)::float * 100 / COUNT(*), 2) AS context_usage_percentage
FROM 
    customer_denizmuzesi
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY 
    month
ORDER BY 
    month;
	

Konuşma Derinliği Analizi:
SELECT 
    message_count_range,
    COUNT(*) AS conversation_count,
    ROUND(AVG(duration_minutes), 2) AS avg_duration_minutes,
    ROUND(AVG(avg_response_length), 2) AS avg_response_length
FROM (
    SELECT 
        session_id,
        COUNT(*) AS message_count,
        CASE 
            WHEN COUNT(*) BETWEEN 1 AND 2 THEN '1-2 messages'
            WHEN COUNT(*) BETWEEN 3 AND 5 THEN '3-5 messages'
            WHEN COUNT(*) BETWEEN 6 AND 10 THEN '6-10 messages'
            ELSE '10+ messages'
        END AS message_count_range,
        EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes,
        AVG(CASE WHEN role = 'apiMessage' THEN message_length ELSE NULL END) AS avg_response_length
    FROM 
        customer_denizmuzesi
    GROUP BY 
        session_id
) subquery
GROUP BY 
    message_count_range
ORDER BY 
    MIN(CASE 
        WHEN message_count_range = '1-2 messages' THEN 1
        WHEN message_count_range = '3-5 messages' THEN 2
        WHEN message_count_range = '6-10 messages' THEN 3
        ELSE 4
    END);
	

Soru-Cevap Çiftleri Analizi:
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
        customer_denizmuzesi
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



Konuşma Akışı Analizi:
WITH session_metrics AS (
    SELECT 
        session_id,
        created_date,
        role,
        LEAD(created_date) OVER (PARTITION BY session_id ORDER BY created_date) AS next_message_time,
        message_length
    FROM 
        customer_denizmuzesi
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


En Sık Sorulan Sorular/Konular:
SELECT 
    CASE 
        WHEN LOWER(content) LIKE '%saat%' OR LOWER(content) LIKE '%çalışma saatleri%' THEN 'Müze Çalışma Saatleri'
        WHEN LOWER(content) LIKE '%fiyat%' OR LOWER(content) LIKE '%ücret%' OR LOWER(content) LIKE '%bilet%' THEN 'Bilet Fiyatları'
        WHEN LOWER(content) LIKE '%osmanlı%' THEN 'Osmanlı Dönemi'
        WHEN LOWER(content) LIKE '%atatürk%' THEN 'Atatürk İle İlgili'
        WHEN LOWER(content) LIKE '%gemi%' OR LOWER(content) LIKE '%tekne%' OR LOWER(content) LIKE '%yat%' THEN 'Gemiler ve Deniz Araçları'
        WHEN LOWER(content) LIKE '%sancak%' OR LOWER(content) LIKE '%bayrak%' THEN 'Sancak ve Bayraklar'
        WHEN LOWER(content) LIKE '%tarih%' THEN 'Deniz Tarihi'
        WHEN LOWER(content) LIKE '%nasıl%' OR LOWER(content) LIKE '%nerede%' THEN 'Yönlendirme/Konum'
        ELSE 'Diğer Konular'
    END AS question_category,
    COUNT(*) AS question_count,
    ROUND(AVG(message_length)) AS avg_question_length,
    COUNT(DISTINCT session_id) AS unique_sessions
FROM 
    customer_denizmuzesi
WHERE 
    role = 'userMessage'
GROUP BY 
    question_category
ORDER BY 
    question_count DESC;
	
	
Trend Analizi - Konuların Zaman İçinde Değişimi:
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
    customer_denizmuzesi
WHERE 
    role = 'userMessage'
    AND created_date >= CURRENT_DATE - INTERVAL '3 months'
GROUP BY 
    week, topic
ORDER BY 
    week DESC, question_count DESC;
	

Yanıt Süresi Analizi:
WITH user_messages AS (
    SELECT 
        session_id,
        created_date AS user_time,
        LEAD(created_date) OVER (PARTITION BY session_id ORDER BY created_date) AS next_user_time,
        content AS user_question,
        message_length AS question_length,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_date) AS msg_order
    FROM 
        customer_denizmuzesi
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
        customer_denizmuzesi
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
LIMIT 1000;



Zaman ve Konu İlişkisi:
SELECT 
    EXTRACT(HOUR FROM created_date) AS hour_of_day,
    CASE 
        WHEN LOWER(content) LIKE '%saat%' OR LOWER(content) LIKE '%açık%' THEN 'Çalışma Saatleri'
        WHEN LOWER(content) LIKE '%fiyat%' OR LOWER(content) LIKE '%ücret%' THEN 'Bilet Fiyatları'
        WHEN LOWER(content) LIKE '%osmanlı%' THEN 'Osmanlı Dönemi'
        WHEN LOWER(content) LIKE '%atatürk%' THEN 'Atatürk'
        WHEN LOWER(content) LIKE '%gemi%' OR LOWER(content) LIKE '%tekne%' THEN 'Deniz Araçları'
        ELSE 'Diğer'
    END AS query_topic,
    COUNT(*) AS query_count
FROM 
    customer_denizmuzesi
WHERE 
    role = 'userMessage'
GROUP BY 
    hour_of_day, query_topic
ORDER BY 
    hour_of_day, query_count DESC;
	


Sesssion Uzunluğu ve Kullanıcı Soruları Arasındaki İlişki:
WITH session_stats AS (
    SELECT 
        session_id,
        COUNT(*) AS message_count,
        COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_message_count,
        EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
    FROM 
        customer_denizmuzesi
    GROUP BY 
        session_id
),
first_questions AS (
    SELECT DISTINCT ON (session_id)
        session_id,
        content AS first_question,
        message_length
    FROM 
        customer_denizmuzesi
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
	

Kelime Kullanım Matriksi (Word Cloud Verisi):
WITH word_extraction AS (
    SELECT 
        role,
        regexp_split_to_table(
            regexp_replace(
                regexp_replace(
                    LOWER(content), 
                    '[^\w\s]', ' ', 'g'
                ),
                '\s+', ' ', 'g'
            ),
            ' '
        ) AS word
    FROM 
        customer_denizmuzesi
    WHERE 
        LENGTH(content) > 0
),
filtered_words AS (
    SELECT 
        role,
        word
    FROM 
        word_extraction
    WHERE 
        LENGTH(word) > 3
        AND word NOT IN ('merhaba', 'selam', 'nasıl', 'için', 'daha', 'evet', 'hayır', 'teşekkür', 'teşekkürler', 'müze', 'önemli', 'main', 'githubusercontent', 'ikondepo', 'knowhycodata', 'jpeg', 'https', 'hakkında', 'olarak', 'veya', 'dair', 'fazla', 'belirli', 'biri', 'olup')
)
SELECT 
    role,
    word,
    COUNT(*) AS word_count
FROM 
    filtered_words
GROUP BY 
    role, word
HAVING 
    COUNT(*) > 5
ORDER BY 
    role, word_count DESC
LIMIT 1000;



Günlük Aktivite ve Etkin Konuşma Saatleri: (son 14 gün)
SELECT 
    DATE(created_date) AS day,
    EXTRACT(HOUR FROM created_date) AS hour,
    COUNT(DISTINCT session_id) AS active_sessions,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
    COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_responses,
    ROUND(AVG(message_length)) AS avg_message_length
FROM 
    customer_denizmuzesi
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY 
    day, hour
ORDER BY 
    day DESC, hour;



Sistemin Genel Özeti:
WITH user_counts AS (
    SELECT COUNT(DISTINCT session_id) AS total_sessions FROM customer_denizmuzesi
),
message_counts AS (
    SELECT 
        COUNT(*) AS total_messages,
        COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
        COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_messages
    FROM customer_denizmuzesi
),
context_usage AS (
    SELECT 
        COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
        ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN role = 'apiMessage' THEN 1 END), 2) AS context_usage_percentage
    FROM customer_denizmuzesi
),
time_stats AS (
    SELECT 
        MIN(created_date) AS first_message_date,
        MAX(created_date) AS last_message_date,
        EXTRACT(DAY FROM NOW() - MIN(created_date)) AS days_active
    FROM customer_denizmuzesi
),
avg_stats AS (
    SELECT 
        ROUND(AVG(message_count)) AS avg_messages_per_session,
        ROUND(AVG(CASE WHEN message_count > 2 THEN duration_minutes END)) AS avg_session_duration
    FROM (
        SELECT 
            session_id, 
            COUNT(*) AS message_count,
            EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
        FROM customer_denizmuzesi
        GROUP BY session_id
    ) sessions
)
SELECT 
    uc.total_sessions,
    mc.total_messages,
    mc.user_messages,
    mc.ai_messages,
    ROUND(mc.total_messages::numeric / uc.total_sessions, 2) AS messages_per_session,
    cu.context_used_count,
    cu.context_usage_percentage,
    ts.first_message_date,
    ts.last_message_date,
    ts.days_active,
    ROUND(uc.total_sessions::numeric / ts.days_active, 2) AS avg_daily_sessions,
    ROUND(mc.total_messages::numeric / ts.days_active, 2) AS avg_daily_messages,
    avgs.avg_messages_per_session,
    avgs.avg_session_duration
FROM 
    user_counts uc, message_counts mc, context_usage cu, time_stats ts, avg_stats avgs;