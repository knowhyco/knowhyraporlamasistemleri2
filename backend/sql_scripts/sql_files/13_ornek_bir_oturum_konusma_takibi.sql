-- 13_ornek_bir_oturum_konusma_takibi
-- Parametreler:
-- {TABLE_NAME} - Table Name (örn. customer_denizmuzesi)

SELECT 
  session_id, 
  role, 
  content, 
  context_summary,
  created_date 
FROM {TABLE_NAME} 
WHERE session_id = '47137f82-ad48-4df1-baca-1dee92ae1397' 
ORDER BY created_date;
