-- Database function to get users without daily response for a given date range
CREATE OR REPLACE FUNCTION get_users_without_daily_response(
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  notification_enabled BOOLEAN,
  notification_mode TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.notification_enabled,
    u.notification_mode
  FROM users u
  WHERE u.notification_enabled = true
    AND NOT EXISTS (
      SELECT 1 
      FROM daily_responses dr
      WHERE dr.user_id = u.id
        AND dr.created_at >= start_date
        AND dr.created_at <= end_date
    );
END;
$$ LANGUAGE plpgsql;
