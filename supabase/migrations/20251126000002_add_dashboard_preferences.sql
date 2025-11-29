-- Create dashboard_preferences table for storing user dashboard widget settings
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id VARCHAR(100) NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user can have one preference per widget
  UNIQUE(user_id, widget_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id ON dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_widget_id ON dashboard_preferences(user_id, widget_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_position ON dashboard_preferences(user_id, position) WHERE is_visible = true;

-- Enable Row Level Security
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own dashboard preferences" ON dashboard_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard preferences" ON dashboard_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard preferences" ON dashboard_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard preferences" ON dashboard_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dashboard_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_dashboard_preferences_updated_at
    BEFORE UPDATE ON dashboard_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_dashboard_preferences_updated_at();
