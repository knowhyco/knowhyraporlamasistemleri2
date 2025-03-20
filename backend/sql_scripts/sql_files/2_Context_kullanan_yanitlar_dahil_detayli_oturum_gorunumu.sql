-- 2_Context_kullanan_yanitlar_dahil_detayli_oturum_gorunumu
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

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
    {TABLE_NAME} m
WHERE 
    m.session_id = '47137f82-ad48-4df1-baca-1dee92ae1397' --örnek sesssion kodudur. değişken olmalıdır.
ORDER BY 
    m.created_date ASC;