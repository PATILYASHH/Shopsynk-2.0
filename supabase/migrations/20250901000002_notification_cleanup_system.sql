-- Add cleanup scheduling and optimize notifications table
-- This migration adds automatic cleanup functionality

-- Create a function to cleanup old notifications (run via cron or trigger)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 7 days
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Delete read notifications older than 3 days  
  DELETE FROM notifications 
  WHERE read = true AND created_at < NOW() - INTERVAL '3 days';
  
  -- Keep only latest 50 notifications per user
  DELETE FROM notifications
  WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM notifications
    ) t
    WHERE t.rn > 50
  );
  
  RAISE NOTICE 'Notification cleanup completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to auto-delete read notifications after delay
CREATE OR REPLACE FUNCTION auto_delete_read_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- If notification is marked as read, schedule deletion after 5 minutes
  IF NEW.read = true AND OLD.read = false THEN
    -- Note: This would require pg_cron extension for actual scheduling
    -- For now, we'll rely on the application-level cleanup
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-deletion (optional - requires pg_cron)
-- DROP TRIGGER IF EXISTS trigger_auto_delete_read ON notifications;
-- CREATE TRIGGER trigger_auto_delete_read
--   AFTER UPDATE ON notifications
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_delete_read_notification();

-- Add a partial index for better cleanup performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_cleanup 
ON notifications (created_at, read) 
WHERE created_at < NOW() - INTERVAL '1 day';

-- Add index for efficient user-based cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created 
ON notifications (user_id, created_at DESC);

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = true) as read_notifications,
  COUNT(*) FILTER (WHERE read = false) as unread_notifications,
  COUNT(DISTINCT user_id) as total_users,
  AVG(CASE WHEN read = true THEN 
    EXTRACT(EPOCH FROM (updated_at - created_at))/60 
    ELSE NULL END) as avg_read_time_minutes,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as notifications_last_24h,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as notifications_last_7d
FROM notifications;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;
GRANT SELECT ON notification_stats TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Cleans up old notifications automatically - removes notifications older than 7 days, read notifications older than 3 days, and keeps only latest 50 per user';
COMMENT ON VIEW notification_stats IS 'Provides statistics about notification usage and performance metrics';

-- Create a policy for the cleanup function (can be run by any authenticated user)
-- This allows the application to call the cleanup function when needed
CREATE POLICY "Authenticated users can run cleanup" ON notifications
  FOR DELETE USING (true); -- This is already covered by existing policies but being explicit
