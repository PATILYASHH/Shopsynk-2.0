-- Execute this SQL in the Supabase SQL Editor to create all necessary tables

-- Create business_owners table
CREATE TABLE IF NOT EXISTS business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user_id and owner_name combination is unique
  UNIQUE(user_id, owner_name)
);

-- Add RLS policies for business_owners
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own business owners
CREATE POLICY "Users can view their own business owners" ON business_owners
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own business owners
CREATE POLICY "Users can insert their own business owners" ON business_owners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own business owners
CREATE POLICY "Users can update their own business owners" ON business_owners
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own business owners
CREATE POLICY "Users can delete their own business owners" ON business_owners
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for business_owners
CREATE TRIGGER update_business_owners_updated_at BEFORE UPDATE
    ON business_owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add owner_id column to transactions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'transactions' AND column_name = 'owner_id') THEN
        ALTER TABLE transactions ADD COLUMN owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_business_owners_user_id ON business_owners(user_id);

-- Create user_backups table for tracking automated backups
CREATE TABLE IF NOT EXISTS user_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_date TIMESTAMP WITH TIME ZONE NOT NULL,
  backup_type VARCHAR(50) NOT NULL DEFAULT 'automatic',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  google_drive_file_id VARCHAR(255),
  google_drive_file_name VARCHAR(255),
  backup_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_backups
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backups" ON user_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups" ON user_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups" ON user_backups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups" ON user_backups
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_backups
CREATE TRIGGER update_user_backups_updated_at BEFORE UPDATE
    ON user_backups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create google_drive_configs table
CREATE TABLE IF NOT EXISTS google_drive_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  backup_folder_id VARCHAR(255),
  auto_backup_enabled BOOLEAN DEFAULT FALSE,
  backup_frequency VARCHAR(50) DEFAULT 'daily',
  last_backup_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for google_drive_configs
ALTER TABLE google_drive_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own google drive config" ON google_drive_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own google drive config" ON google_drive_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own google drive config" ON google_drive_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own google drive config" ON google_drive_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for google_drive_configs
CREATE TRIGGER update_google_drive_configs_updated_at BEFORE UPDATE
    ON google_drive_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user_settings table for general settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger for user_settings
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
    ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_backups_user_id ON user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_backups_backup_date ON user_backups(backup_date);
CREATE INDEX IF NOT EXISTS idx_user_backups_status ON user_backups(status);
CREATE INDEX IF NOT EXISTS idx_google_drive_configs_user_id ON google_drive_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
