-- Add cleanup scheduling and optimize notifications table
-- This migration adds automatic cleanup functionality

-- Create a function to cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete notifications older than 7 days
  DELETE FROM notifications 
  WHERE created_at < (NOW() - INTERVAL '7 days');
  
  -- Delete read notifications older than 3 days  
  DELETE FROM notifications 
  WHERE read = true AND created_at < (NOW() - INTERVAL '3 days');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at);

-- Grant execute permission for cleanup function
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_notifications() TO service_role;

-- Create a simple view for notification statistics
CREATE VIEW notification_stats AS
SELECT 
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN read = true THEN 1 END) as read_notifications,
  COUNT(CASE WHEN read = false THEN 1 END) as unread_notifications,
  COUNT(DISTINCT user_id) as total_users
FROM notifications;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;
