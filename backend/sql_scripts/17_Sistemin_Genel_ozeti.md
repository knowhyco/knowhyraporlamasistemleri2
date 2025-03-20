WITH user_counts AS (
    SELECT COUNT(DISTINCT session_id) AS total_sessions FROM customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
),
message_counts AS (
    SELECT 
        COUNT(*) AS total_messages,
        COUNT(CASE WHEN role = 'userMessage' THEN 1 END) AS user_messages,
        COUNT(CASE WHEN role = 'apiMessage' THEN 1 END) AS ai_messages
    FROM customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
),
context_usage AS (
    SELECT 
        COUNT(CASE WHEN has_context = TRUE THEN 1 END) AS context_used_count,
        ROUND(COUNT(CASE WHEN has_context = TRUE THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN role = 'apiMessage' THEN 1 END), 2) AS context_usage_percentage
    FROM customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
),
time_stats AS (
    SELECT 
        MIN(created_date) AS first_message_date,
        MAX(created_date) AS last_message_date,
        EXTRACT(DAY FROM NOW() - MIN(created_date)) AS days_active
    FROM customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
),
avg_stats AS (
    SELECT 
        ROUND(AVG(message_count)) AS avg_messages_per_session,
        ROUND(AVG(CASE WHEN message_count > 2 THEN duration_minutes END)) AS avg_session_duration
    FROM (
        SELECT 
            session_id, 
            COUNT(*) AS message_count,
            EXTRACT(EPOCH FROM (MAX(created_date) - MIN(created_date)))/60 AS duration_minutes
        FROM customer_denizmuzesi --bu değişken adminin yazacağı tabloya göre değişmeli
        GROUP BY session_id
    ) sessions
)
SELECT 
    uc.total_sessions,
    mc.total_messages,
    mc.user_messages,
    mc.ai_messages,
    ROUND(mc.total_messages::numeric / uc.total_sessions, 2) AS messages_per_session,
    cu.context_used_count,
    cu.context_usage_percentage,
    ts.first_message_date,
    ts.last_message_date,
    ts.days_active,
    ROUND(uc.total_sessions::numeric / ts.days_active, 2) AS avg_daily_sessions,
    ROUND(mc.total_messages::numeric / ts.days_active, 2) AS avg_daily_messages,
    avgs.avg_messages_per_session,
    avgs.avg_session_duration
FROM 
    user_counts uc, message_counts mc, context_usage cu, time_stats ts, avg_stats avgs;