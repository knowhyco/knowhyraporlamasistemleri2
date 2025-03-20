SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_messages,
    ROUND(AVG(CASE WHEN has_context = TRUE THEN 1 ELSE 0 END) * 100, 2) as context_usage_percentage
FROM 
    customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
WHERE 
    created_date >= NOW() - INTERVAL '24' HOURS;

-- Bu sorgu, belirli bir saat aralığındaki (varsayılan olarak son 24 saat) aşağıdaki istatistikleri hesaplar:
-- 1. Toplam oturum sayısı
-- 2. Toplam mesaj sayısı
-- 3. Context kullanım yüzdesi
--
-- Bu sorgu, dashboard'da hızlı bir genel bakış sağlamak için kullanılabilir.
-- Saat aralığı admin panelinden değiştirilebilir (örneğin son 12 saat, son 48 saat vb.). 