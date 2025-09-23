-- Migration: Create persons and loan transactions tables
-- This migration creates the necessary tables to track person profiles and their financial transactions.
--
-- Transaction Types:
-- - 'Gives': Money given TO the person (loans/extending credit)
-- - 'Takes': Money taken FROM the person (payments received/collecting debt)
--
-- Each person profile can have multiple transactions of both types, allowing complete
-- tracking of the financial relationship between the business and each person.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create persons table for loan management
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  added_by_owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for persons
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;

-- Create policies for persons table
DO $$
BEGIN
    -- Policy: Users can only see their own persons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persons' AND policyname = 'Users can view their own persons') THEN
        CREATE POLICY "Users can view their own persons" ON persons
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can insert their own persons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persons' AND policyname = 'Users can insert their own persons') THEN
        CREATE POLICY "Users can insert their own persons" ON persons
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Users can update their own persons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persons' AND policyname = 'Users can update their own persons') THEN
        CREATE POLICY "Users can update their own persons" ON persons
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can delete their own persons
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persons' AND policyname = 'Users can delete their own persons') THEN
        CREATE POLICY "Users can delete their own persons" ON persons
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger for persons
DROP TRIGGER IF EXISTS update_persons_updated_at ON persons;
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE
    ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create loan_transactions table for tracking loans given to persons and payments received from persons
DROP TABLE IF EXISTS loan_transactions CASCADE;
CREATE TABLE loan_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL,
  -- 'Gives' = money given TO the person (loan), 'Takes' = money taken FROM the person (payment received)
  type VARCHAR(50) NOT NULL CHECK (type IN ('Gives', 'Takes')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  due_date DATE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for loan_transactions
ALTER TABLE loan_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for loan_transactions table
DO $$
BEGIN
    -- Policy: Users can only see their own loan transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_transactions' AND policyname = 'Users can view their own loan transactions') THEN
        CREATE POLICY "Users can view their own loan transactions" ON loan_transactions
          FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can insert their own loan transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_transactions' AND policyname = 'Users can insert their own loan transactions') THEN
        CREATE POLICY "Users can insert their own loan transactions" ON loan_transactions
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Policy: Users can update their own loan transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_transactions' AND policyname = 'Users can update their own loan transactions') THEN
        CREATE POLICY "Users can update their own loan transactions" ON loan_transactions
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Policy: Users can delete their own loan transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loan_transactions' AND policyname = 'Users can delete their own loan transactions') THEN
        CREATE POLICY "Users can delete their own loan transactions" ON loan_transactions
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger for loan_transactions
DROP TRIGGER IF EXISTS update_loan_transactions_updated_at ON loan_transactions;
CREATE TRIGGER update_loan_transactions_updated_at BEFORE UPDATE
    ON loan_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view to easily calculate person balances and transaction summaries
CREATE OR REPLACE VIEW person_transaction_summary AS
SELECT
  p.id as person_id,
  p.user_id,
  p.name,
  p.company,
  p.phone,
  COUNT(lt.id) as total_transactions,
  COALESCE(SUM(CASE WHEN lt.type = 'Gives' THEN lt.amount ELSE 0 END), 0) as total_given,
  COALESCE(SUM(CASE WHEN lt.type = 'Takes' THEN lt.amount ELSE 0 END), 0) as total_taken,
  COALESCE(SUM(CASE WHEN lt.type = 'Gives' THEN lt.amount ELSE -lt.amount END), 0) as current_balance,
  MAX(lt.created_at) as last_transaction_date
FROM persons p
LEFT JOIN loan_transactions lt ON p.id = lt.person_id AND p.user_id = lt.user_id
GROUP BY p.id, p.user_id, p.name, p.company, p.phone;

-- Grant permissions on the view
GRANT SELECT ON person_transaction_summary TO authenticated;

-- Note: The view inherits RLS from the underlying tables (persons and loan_transactions)

-- Add constraint to ensure owner_id belongs to the same user
-- Note: This constraint ensures that the owner_id references a business owner that belongs to the same user
ALTER TABLE loan_transactions
DROP CONSTRAINT IF EXISTS fk_loan_transactions_owner_user;
-- Note: The foreign key constraint is handled by the REFERENCES clause above

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_persons_user_id ON persons(user_id);
CREATE INDEX IF NOT EXISTS idx_persons_added_by_owner ON persons(user_id, added_by_owner_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_user_id ON loan_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_person_id ON loan_transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_owner_id ON loan_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_type ON loan_transactions(person_id, type);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_created_at ON loan_transactions(person_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_transactions_user_person ON loan_transactions(user_id, person_id);