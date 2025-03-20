-- 15_Secilen_oturumdaki_tüm_mesajlari_kronolojik_sirayla_listele
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    message_id,
    role,
    content,
    created_date,
    has_context,
    context_summary,
    message_length
FROM 
    {TABLE_NAME}
WHERE 
    session_id = '47137f82-ad48-4df1-baca-1dee92ae1397'  -- Kullanıcının seçtiği oturum ID'si
ORDER BY 
    created_date ASC;