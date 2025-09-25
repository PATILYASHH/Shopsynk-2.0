-- Create spends table for personal expense tracking
CREATE TABLE IF NOT EXISTS spends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL DEFAULT 'General',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_spends_user_id ON spends(user_id);
CREATE INDEX IF NOT EXISTS idx_spends_date ON spends(date);
CREATE INDEX IF NOT EXISTS idx_spends_category ON spends(category);

-- Enable Row Level Security
ALTER TABLE spends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own spends" ON spends
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spends" ON spends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spends" ON spends
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spends" ON spends
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_spends_updated_at
    BEFORE UPDATE ON spends
    FOR EACH ROW
    EXECUTE FUNCTION update_spends_updated_at();