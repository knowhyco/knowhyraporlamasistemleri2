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