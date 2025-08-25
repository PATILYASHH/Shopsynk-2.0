-- Create business_owners table for multi-owner functionality
CREATE TABLE business_owners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100) DEFAULT 'Owner',
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure each business has only one primary owner
    CONSTRAINT unique_primary_owner_per_user EXCLUDE (user_id WITH =) WHERE (is_primary = true)
);

-- Create index for better query performance
CREATE INDEX idx_business_owners_user_id ON business_owners(user_id);
CREATE INDEX idx_business_owners_active ON business_owners(user_id, is_active) WHERE is_active = true;

-- Enable RLS (Row Level Security)
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own business owners" ON business_owners
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business owners" ON business_owners
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business owners" ON business_owners
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business owners" ON business_owners
    FOR DELETE USING (auth.uid() = user_id);

-- Add owner_id column to transactions table to track who made the transaction
ALTER TABLE transactions 
ADD COLUMN owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL;

-- Create index for owner transactions
CREATE INDEX idx_transactions_owner_id ON transactions(owner_id);

-- Add owner_id column to suppliers table to track who added the supplier
ALTER TABLE suppliers 
ADD COLUMN added_by_owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL;

-- Create index for supplier ownership
CREATE INDEX idx_suppliers_added_by_owner ON suppliers(added_by_owner_id);

-- Create trigger for updating updated_at timestamp on business_owners
CREATE TRIGGER update_business_owners_updated_at BEFORE UPDATE
    ON business_owners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create primary owner when user first accesses the system
CREATE OR REPLACE FUNCTION create_primary_owner_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user already has a primary owner
    IF NOT EXISTS (
        SELECT 1 FROM business_owners 
        WHERE user_id = NEW.id AND is_primary = true
    ) THEN
        -- Create primary owner using user's email
        INSERT INTO business_owners (user_id, owner_name, email, is_primary, is_active)
        VALUES (
            NEW.id, 
            COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)), 
            NEW.email, 
            true, 
            true
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create primary owner (Note: This may need adjustment based on your auth setup)
-- CREATE TRIGGER auto_create_primary_owner
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION create_primary_owner_for_user();

-- Create view for owner transaction statistics
CREATE OR REPLACE VIEW owner_transaction_stats AS
SELECT 
    bo.id as owner_id,
    bo.user_id,
    bo.owner_name,
    COUNT(t.id) as total_transactions,
    COUNT(CASE WHEN t.type = 'new_purchase' THEN 1 END) as total_purchases,
    COUNT(CASE WHEN t.type IN ('pay_due', 'settle_bill') THEN 1 END) as total_payments,
    COALESCE(SUM(CASE WHEN t.type = 'new_purchase' THEN t.amount ELSE 0 END), 0) as total_purchase_amount,
    COALESCE(SUM(CASE WHEN t.type IN ('pay_due', 'settle_bill') THEN t.amount ELSE 0 END), 0) as total_payment_amount
FROM business_owners bo
LEFT JOIN transactions t ON bo.id = t.owner_id
WHERE bo.is_active = true
GROUP BY bo.id, bo.user_id, bo.owner_name;

-- Grant appropriate permissions on the view
-- Note: RLS policies will still apply through the underlying tables
