-- 27_Aylik_Trend_Analizi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
    DATE_TRUNC('month', created_date) AS month,
    COUNT(DISTINCT session_id) AS total_conversations,
    COUNT(*) AS total_messages,
    COUNT(DISTINCT session_id)::float / EXTRACT(DAY FROM DATE_TRUNC('month', NOW()) + INTERVAL '1 month - 1 day') AS avg_daily_conversations,
    COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
    ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END)::float * 100 / COUNT(*), 2) AS context_usage_percentage
FROM 
    {TABLE_NAME} --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= CURRENT_DATE - INTERVAL '6' months
GROUP BY 
    month
ORDER BY 
    month;

-- Bu sorgu, aylık bazda aşağıdaki istatistikleri hesaplar:
-- 1. Toplam konuşma (oturum) sayısı
-- 2. Toplam mesaj sayısı
-- 3. Günlük ortalama konuşma sayısı
-- 4. Context kullanım sayısı
-- 5. Context kullanım yüzdesi
-- 
-- Varsayılan olarak son 6 ay için hesaplama yapar, ancak bu değer admin panelinden değiştirilebilir.
-- Sonuçlar ay bazında gruplandırılır ve kronolojik sırayla listelenir. 