--Kelime bulutu oluşturma işlemi admin ekranında sorulacak. Admin'in yazdığı kelimeler buradaki bölüme eklenecek ve sorgulama türü kayıt edilecek. 

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
        customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
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
        AND word NOT IN ('merhaba', 'selam') --Burada ki değişkenler admine sorulacak.
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