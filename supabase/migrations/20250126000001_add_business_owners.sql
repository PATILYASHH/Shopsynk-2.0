-- Create business_owners table
CREATE TABLE IF NOT EXISTS business_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
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

-- Create updated_at trigger for business_owners
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- Create index on owner_id for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_owner_id ON transactions(owner_id);

-- Create index on business_owners user_id for better performance  
CREATE INDEX IF NOT EXISTS idx_business_owners_user_id ON business_owners(user_id);

-- Insert a default primary owner for existing users
INSERT INTO business_owners (user_id, owner_name, is_primary)
SELECT 
  id as user_id,
  COALESCE(email, 'Primary Owner') as owner_name,
  TRUE as is_primary
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM business_owners WHERE business_owners.user_id = auth.users.id AND is_primary = TRUE
)
ON CONFLICT (user_id, owner_name) DO NOTHING;
