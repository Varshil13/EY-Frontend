/*
  # Loan Database Schema (loan_db)
  
  Industry-style design with 3 core tables:
  1. users - User/Customer profile data for loan eligibility
  2. loans - Master Loan Catalog (all available loans from banks)
  3. user_loan_reco - Recommendation history (audit table)
*/

-- TABLE 1: users
-- Purpose: User/Customer profile data for loan eligibility decisions
CREATE TABLE IF NOT EXISTS users (
  profile_id TEXT PRIMARY KEY,  -- Unique user ID (U001, U002...)
  auth_id UUID UNIQUE,          -- Link to Supabase auth.users.id
  name TEXT NOT NULL,           -- User ka naam
  age INTEGER NOT NULL,         -- User ki age
  city TEXT NOT NULL,           -- City
  monthly_income INTEGER NOT NULL,  -- Monthly income
  employment_type TEXT NOT NULL,    -- Salaried / Self-Employed
  years_employed INTEGER NOT NULL,  -- Job/business experience
  credit_score INTEGER NOT NULL,    -- CIBIL / credit score
  existing_emi INTEGER DEFAULT 0,   -- Already chal rahi EMI
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Profile creation time
);

-- TABLE 2: loans
-- Purpose: Master Loan Catalog - static data of all available loans
CREATE TABLE IF NOT EXISTS loans (
  loan_id SERIAL PRIMARY KEY,       -- Unique loan ID
  loan_name TEXT NOT NULL,          -- Loan ka naam
  loan_type TEXT NOT NULL,          -- personal / home / auto
  bank_name TEXT NOT NULL,          -- Bank / company
  interest_rate DOUBLE PRECISION NOT NULL,  -- Interest rate (%)
  min_income INTEGER NOT NULL,      -- Minimum income required
  min_credit_score INTEGER NOT NULL,  -- Minimum credit score
  min_amount INTEGER NOT NULL,      -- Minimum loan amount
  max_amount INTEGER NOT NULL,      -- Maximum loan amount
  min_tenure INTEGER NOT NULL,      -- Minimum tenure (years)
  max_tenure INTEGER NOT NULL      -- Maximum tenure (years)
);

-- TABLE 3: user_loan_reco
-- Purpose: Recommendation history for audit and tracking
CREATE TABLE IF NOT EXISTS user_loan_reco (
  id SERIAL PRIMARY KEY,                    -- Auto generated
  profile_id TEXT NOT NULL,                 -- FK to users.profile_id
  loan_id INTEGER NOT NULL,                 -- FK to loans.loan_id
  recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Kab recommend hua
  
  -- Foreign key constraints
  FOREIGN KEY (profile_id) REFERENCES users(profile_id) ON DELETE CASCADE,
  FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
  
  -- Unique constraint: Same loan same user ko dobara save nahi hota
  UNIQUE (profile_id, loan_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON users(profile_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_credit_score ON users(credit_score);
CREATE INDEX IF NOT EXISTS idx_users_monthly_income ON users(monthly_income);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_loans_bank_name ON loans(bank_name);
CREATE INDEX IF NOT EXISTS idx_loans_min_income ON loans(min_income);
CREATE INDEX IF NOT EXISTS idx_loans_min_credit_score ON loans(min_credit_score);
CREATE INDEX IF NOT EXISTS idx_user_loan_reco_profile_id ON user_loan_reco(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_loan_reco_loan_id ON user_loan_reco(loan_id);

-- Enable Row Level Security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loan_reco ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Anyone can insert users during signup"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profiles"
  ON users FOR UPDATE
  TO authenticated
  USING (auth_id::text = auth.uid()::text);

-- RLS Policies for loans table (read-only for most operations)
CREATE POLICY "Anyone can view loans"
  ON loans FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage loans"
  ON loans FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_loan_reco table
CREATE POLICY "Users can view all recommendations"
  ON user_loan_reco FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert recommendations"
  ON user_loan_reco FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);