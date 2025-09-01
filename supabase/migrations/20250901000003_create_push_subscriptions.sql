-- Create push subscriptions table for PWA notifications
-- This migration adds support for background push notifications

-- Create push_subscriptions table to store user device subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  
  -- Ensure one subscription per user (replace if user subscribes from new device)
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions (user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions (endpoint);

-- Grant permissions
GRANT ALL ON push_subscriptions TO authenticated;
GRANT SELECT ON push_subscriptions TO service_role;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
