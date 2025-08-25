/*
  # Supplier Dues Management System Database Schema

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, company name)
      - `contact_person` (text, optional)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `address` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `type` (text, transaction type: 'pay_due', 'settle_bill', 'new_purchase')
      - `amount` (decimal, transaction amount)
      - `description` (text, transaction description)
      - `due_date` (date, optional)
      - `is_paid` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Create indexes for better performance

  3. Functions
    - Add function to calculate running balance
    - Add triggers for updated_at timestamps
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('pay_due', 'settle_bill', 'new_purchase')),
  amount decimal(10,2) NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date date,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Users can manage their own suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS suppliers_name_idx ON suppliers(name);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_supplier_id_idx ON transactions(supplier_id);
CREATE INDEX IF NOT EXISTS transactions_due_date_idx ON transactions(due_date);
CREATE INDEX IF NOT EXISTS transactions_is_paid_idx ON transactions(is_paid);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();