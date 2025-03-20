SELECT 
    session_id,
    MIN(created_date) AS start_time,
    COUNT(*) AS message_count,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_date)))/60 AS minutes_ago
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
GROUP BY 
    session_id
ORDER BY 
    start_time DESC;
