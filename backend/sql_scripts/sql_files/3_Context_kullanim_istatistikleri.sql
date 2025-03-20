-- 3_Context_kullanim_istatistikleri
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    DATE(created_date) AS date,
    COUNT(*) AS total_ai_responses,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS responses_with_context,
    ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END) * 100.0 / COUNT(*)) AS context_usage_percentage
FROM 
    {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    role = 'apiMessage'
    AND created_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    date
ORDER BY 
    date DESC;
