SELECT 
    session_id,
    MIN(created_date) AS start_time,
    MAX(created_date) AS end_time,
    COUNT(*) AS message_count,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY 
    session_id
HAVING 
    COUNT(*) > 2  -- En az 3 mesaj içeren oturumlar
ORDER BY 
    end_time DESC;
