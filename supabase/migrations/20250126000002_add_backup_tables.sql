-- Create user_backups table for tracking automated backups
CREATE TABLE IF NOT EXISTS user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  backup_type VARCHAR(50) NOT NULL DEFAULT 'automatic', -- 'automatic', 'manual'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  google_drive_file_id VARCHAR(255),
  google_drive_file_name VARCHAR(255),
  backup_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_backups
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own backups
CREATE POLICY "Users can view their own backups" ON user_backups
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own backups
CREATE POLICY "Users can insert their own backups" ON user_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own backups
CREATE POLICY "Users can update their own backups" ON user_backups
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own backups
CREATE POLICY "Users can delete their own backups" ON user_backups
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_backups
CREATE TRIGGER update_user_backups_updated_at BEFORE UPDATE
    ON user_backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create google_drive_configs table for storing user's Google Drive settings
CREATE TABLE IF NOT EXISTS google_drive_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  backup_folder_id VARCHAR(255),
  auto_backup_enabled BOOLEAN DEFAULT FALSE,
  backup_frequency VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  last_backup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for google_drive_configs
ALTER TABLE google_drive_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own Google Drive config
CREATE POLICY "Users can view their own google drive config" ON google_drive_configs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own Google Drive config
CREATE POLICY "Users can insert their own google drive config" ON google_drive_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Google Drive config
CREATE POLICY "Users can update their own google drive config" ON google_drive_configs
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own Google Drive config
CREATE POLICY "Users can delete their own google drive config" ON google_drive_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for google_drive_configs
CREATE TRIGGER update_google_drive_configs_updated_at BEFORE UPDATE
    ON google_drive_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_backups_user_id ON user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backups_backup_date ON user_backups(backup_date);
CREATE INDEX IF NOT EXISTS idx_user_backups_status ON user_backups(status);
CREATE INDEX IF NOT EXISTS idx_google_drive_configs_user_id ON google_drive_configs(user_id);
