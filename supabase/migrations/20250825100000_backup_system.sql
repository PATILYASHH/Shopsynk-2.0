-- Create user_backups table for tracking backup history
CREATE TABLE user_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    backup_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    google_drive_file_id TEXT,
    suppliers_count INTEGER DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    backup_size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_user_backups_user_id ON user_backups(user_id);
CREATE INDEX idx_user_backups_date ON user_backups(backup_date DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users can only see their own backups
CREATE POLICY "Users can view their own backups" ON user_backups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups" ON user_backups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups" ON user_backups
    FOR UPDATE USING (auth.uid() = user_id);

-- Create user_settings table for storing Google Drive connection status
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    google_drive_connected BOOLEAN DEFAULT FALSE,
    google_drive_email TEXT,
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    backup_time TEXT DEFAULT '00:00', -- 24-hour format for backup time
    last_backup_date TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for user settings
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable RLS for user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_user_backups_updated_at BEFORE UPDATE
    ON user_backups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
    ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
