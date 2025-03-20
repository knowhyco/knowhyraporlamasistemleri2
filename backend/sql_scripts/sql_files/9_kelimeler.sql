-- 9_kelimeler
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    word,
    COUNT(*) AS occurrence_count
FROM (
    SELECT 
        regexp_split_to_table(LOWER(content), '\s+') AS word
    FROM 
        {TABLE_NAME}
    WHERE 
        role = 'userMessage'
        AND LENGTH(word) > 3  -- 3 karakterden uzun kelimeleri filtrele
) words
GROUP BY 
    word
ORDER BY 
    occurrence_count DESC
LIMIT 200;
