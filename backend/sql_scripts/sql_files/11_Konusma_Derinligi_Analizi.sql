-- 11_Konusma_Derinligi_Analizi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

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
        {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
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