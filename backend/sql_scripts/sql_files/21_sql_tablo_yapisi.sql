-- 21_sql_tablo_yapisi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

CREATE TABLE {TABLE_NAME} (
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
CREATE INDEX idx_testicerik_session_id ON {TABLE_NAME}(session_id);
CREATE INDEX idx_testicerik_created_date ON {TABLE_NAME}(created_date);
CREATE INDEX idx_testicerik_role ON {TABLE_NAME}(role);
CREATE INDEX idx_testicerik_has_context ON {TABLE_NAME}(has_context);