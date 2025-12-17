-- Complete Database Setup for EY Loan Recommender
-- Run this in your NEW Supabase project

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    profile_id text PRIMARY KEY,
    auth_id uuid UNIQUE, -- Links to Supabase auth user, can be null for manual creation
    name text NOT NULL,
    age integer NOT NULL CHECK (age >= 18 AND age <= 100),
    city text NOT NULL,
    monthly_income numeric(12,2) NOT NULL CHECK (monthly_income > 0),
    employment_type text NOT NULL CHECK (employment_type IN ('salaried', 'self_employed', 'business', 'freelancer', 'retired')),
    years_employed numeric(4,2) NOT NULL CHECK (years_employed >= 0),
    credit_score integer CHECK (credit_score >= 300 AND credit_score <= 850),
    existing_emi numeric(10,2) DEFAULT 0 CHECK (existing_emi >= 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create loans table
CREATE TABLE IF NOT EXISTS public.loans (
    loan_id text PRIMARY KEY,
    bank_name text NOT NULL,
    loan_type text NOT NULL,
    interest_rate numeric(5,2) NOT NULL CHECK (interest_rate > 0),
    max_amount numeric(12,2) NOT NULL CHECK (max_amount > 0),
    min_amount numeric(12,2) NOT NULL CHECK (min_amount > 0),
    max_tenure_months integer NOT NULL CHECK (max_tenure_months > 0),
    min_tenure_months integer NOT NULL CHECK (min_tenure_months > 0),
    min_income numeric(10,2) NOT NULL CHECK (min_income > 0),
    min_credit_score integer CHECK (min_credit_score >= 300 AND min_credit_score <= 850),
    max_age integer CHECK (max_age >= 18 AND max_age <= 100),
    min_age integer DEFAULT 18 CHECK (min_age >= 18),
    employment_types text[] DEFAULT ARRAY['salaried', 'self_employed', 'business', 'freelancer'],
    processing_fee numeric(8,2) DEFAULT 0,
    features text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CHECK (min_amount <= max_amount),
    CHECK (min_tenure_months <= max_tenure_months),
    CHECK (min_age <= max_age)
);

-- 3. Create user_loan_reco table
CREATE TABLE IF NOT EXISTS public.user_loan_reco (
    reco_id text PRIMARY KEY,
    profile_id text NOT NULL REFERENCES public.users(profile_id) ON DELETE CASCADE,
    loan_id text NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
    eligibility_score numeric(5,2) NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
    recommended_amount numeric(12,2) NOT NULL CHECK (recommended_amount > 0),
    recommended_tenure integer NOT NULL CHECK (recommended_tenure > 0),
    estimated_emi numeric(10,2) NOT NULL CHECK (estimated_emi > 0),
    recommendation_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, loan_id)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loan_reco ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth_id = auth.uid() OR auth_id IS NULL);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth_id = auth.uid() OR auth_id IS NULL);

CREATE POLICY "Anyone can insert users (for signup)" ON public.users
    FOR INSERT WITH CHECK (true);

-- Loans policies (public read access)
CREATE POLICY "Anyone can view loans" ON public.loans
    FOR SELECT USING (true);

-- User loan recommendations policies
CREATE POLICY "Users can view their own recommendations" ON public.user_loan_reco
    FOR SELECT USING (
        profile_id IN (
            SELECT profile_id FROM public.users 
            WHERE auth_id = auth.uid() OR auth_id IS NULL
        )
    );

CREATE POLICY "Users can insert their own recommendations" ON public.user_loan_reco
    FOR INSERT WITH CHECK (
        profile_id IN (
            SELECT profile_id FROM public.users 
            WHERE auth_id = auth.uid() OR auth_id IS NULL
        )
    );

CREATE POLICY "Users can update their own recommendations" ON public.user_loan_reco
    FOR UPDATE USING (
        profile_id IN (
            SELECT profile_id FROM public.users 
            WHERE auth_id = auth.uid() OR auth_id IS NULL
        )
    );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_id ON public.users(profile_id);
CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON public.loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_bank_name ON public.loans(bank_name);
CREATE INDEX IF NOT EXISTS idx_loans_loan_type ON public.loans(loan_type);
CREATE INDEX IF NOT EXISTS idx_user_loan_reco_profile_id ON public.user_loan_reco(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_loan_reco_loan_id ON public.user_loan_reco(loan_id);
CREATE INDEX IF NOT EXISTS idx_user_loan_reco_eligibility ON public.user_loan_reco(eligibility_score DESC);

-- 7. Insert sample loan data
INSERT INTO public.loans (loan_id, bank_name, loan_type, interest_rate, max_amount, min_amount, max_tenure_months, min_tenure_months, min_income, min_credit_score, max_age, min_age, employment_types, processing_fee, features) VALUES
-- Personal Loans
('PL001', 'HDFC Bank', 'Personal Loan', 10.5, 4000000, 50000, 60, 12, 25000, 650, 65, 21, ARRAY['salaried', 'self_employed'], 2500, ARRAY['No collateral', 'Quick approval', 'Flexible tenure']),
('PL002', 'ICICI Bank', 'Personal Loan', 11.25, 5000000, 50000, 72, 12, 30000, 700, 65, 23, ARRAY['salaried'], 1999, ARRAY['Online application', 'Instant approval', 'No prepayment charges']),
('PL003', 'SBI', 'Personal Loan', 11.75, 2000000, 25000, 84, 12, 20000, 650, 65, 21, ARRAY['salaried', 'self_employed'], 5000, ARRAY['Competitive rates', 'Trusted brand']),
('PL004', 'Axis Bank', 'Personal Loan', 12.0, 3500000, 50000, 60, 12, 25000, 675, 65, 21, ARRAY['salaried'], 3000, ARRAY['Quick processing', 'Digital documentation']),
('PL005', 'Kotak Mahindra', 'Personal Loan', 10.99, 4000000, 100000, 72, 12, 30000, 750, 60, 23, ARRAY['salaried'], 2000, ARRAY['Premium banking', 'Relationship benefits']),

-- Home Loans
('HL001', 'HDFC Bank', 'Home Loan', 8.5, 10000000, 500000, 360, 60, 35000, 700, 65, 23, ARRAY['salaried', 'self_employed'], 5000, ARRAY['Property insurance', 'Flexible repayment', 'Balance transfer']),
('HL002', 'ICICI Bank', 'Home Loan', 8.75, 15000000, 500000, 300, 60, 40000, 725, 65, 25, ARRAY['salaried'], 10000, ARRAY['Online tracking', 'Quick sanctions', 'Women borrower benefits']),
('HL003', 'SBI', 'Home Loan', 8.4, 20000000, 100000, 360, 60, 25000, 650, 70, 18, ARRAY['salaried', 'self_employed'], 2000, ARRAY['Lowest rates', 'Government backing', 'Rural area coverage']),
('HL004', 'LIC Housing', 'Home Loan', 8.25, 10000000, 500000, 360, 60, 30000, 700, 65, 21, ARRAY['salaried', 'self_employed'], 3000, ARRAY['Insurance benefits', 'Flexible tenure']),
('HL005', 'HDFC Limited', 'Home Loan', 8.6, 25000000, 500000, 300, 60, 50000, 750, 65, 25, ARRAY['salaried', 'self_employed', 'business'], 15000, ARRAY['Premium service', 'Quick approvals', 'Doorstep service']),

-- Car Loans
('CL001', 'HDFC Bank', 'Car Loan', 8.9, 2000000, 100000, 84, 12, 25000, 650, 65, 21, ARRAY['salaried', 'self_employed'], 3000, ARRAY['New car financing', 'Insurance tie-ups']),
('CL002', 'ICICI Bank', 'Car Loan', 9.25, 2500000, 100000, 84, 12, 30000, 700, 65, 23, ARRAY['salaried'], 2500, ARRAY['Used car loans', 'Quick approvals']),
('CL003', 'Mahindra Finance', 'Car Loan', 9.5, 1500000, 50000, 72, 12, 20000, 600, 65, 21, ARRAY['salaried', 'self_employed'], 2000, ARRAY['Rural financing', 'Flexible documentation']),
('CL004', 'Bajaj Finserv', 'Car Loan', 9.99, 2000000, 75000, 84, 12, 25000, 650, 65, 21, ARRAY['salaried', 'self_employed'], 0, ARRAY['Zero processing fee', 'Quick disbursal']),
('CL005', 'Tata Motors Finance', 'Car Loan', 8.75, 1800000, 100000, 84, 12, 30000, 700, 65, 23, ARRAY['salaried'], 1500, ARRAY['Tata vehicle financing', 'Competitive rates']),

-- Business Loans
('BL001', 'HDFC Bank', 'Business Loan', 12.5, 5000000, 100000, 60, 12, 50000, 700, 65, 25, ARRAY['self_employed', 'business'], 10000, ARRAY['Working capital', 'Equipment financing']),
('BL002', 'ICICI Bank', 'Business Loan', 13.0, 7500000, 100000, 72, 12, 75000, 725, 65, 25, ARRAY['self_employed', 'business'], 15000, ARRAY['Digital banking', 'Trade finance']),
('BL003', 'SBI', 'Business Loan', 11.5, 10000000, 50000, 84, 12, 40000, 650, 70, 21, ARRAY['self_employed', 'business'], 5000, ARRAY['MSME focus', 'Government schemes']),
('BL004', 'Bajaj Finserv', 'Business Loan', 14.0, 3000000, 100000, 60, 12, 60000, 675, 65, 25, ARRAY['self_employed', 'business'], 8000, ARRAY['Quick approval', 'Minimal documentation']),
('BL005', 'Kotak Mahindra', 'Business Loan', 13.5, 5000000, 200000, 72, 12, 100000, 750, 65, 30, ARRAY['business'], 12000, ARRAY['Corporate banking', 'Relationship benefits']),

-- Education Loans
('EL001', 'SBI', 'Education Loan', 7.5, 2000000, 50000, 180, 12, 15000, 650, 35, 18, ARRAY['salaried', 'self_employed'], 0, ARRAY['No collateral up to 7.5L', 'Moratorium period', 'Tax benefits']),
('EL002', 'HDFC Credila', 'Education Loan', 9.5, 5000000, 100000, 180, 12, 25000, 700, 35, 18, ARRAY['salaried', 'self_employed'], 5000, ARRAY['Study abroad', 'Flexible repayment']),
('EL003', 'Axis Bank', 'Education Loan', 8.75, 3000000, 50000, 180, 12, 20000, 675, 35, 18, ARRAY['salaried'], 2500, ARRAY['Digital processing', 'Quick sanctions']),
('EL004', 'ICICI Bank', 'Education Loan', 9.0, 4000000, 75000, 180, 12, 30000, 725, 35, 18, ARRAY['salaried'], 7500, ARRAY['Comprehensive coverage', 'Online application']),
('EL005', 'Avanse Financial', 'Education Loan', 10.5, 3500000, 100000, 180, 12, 20000, 650, 35, 18, ARRAY['salaried', 'self_employed'], 3000, ARRAY['Education specialist', 'Student-friendly']),

-- Gold Loans
('GL001', 'Muthoot Finance', 'Gold Loan', 12.0, 2000000, 10000, 12, 1, 10000, NULL, 75, 18, ARRAY['salaried', 'self_employed', 'business'], 1000, ARRAY['Quick cash', 'Minimal documentation', 'Flexible tenure']),
('GL002', 'Manappuram Finance', 'Gold Loan', 12.5, 1500000, 5000, 24, 1, 5000, NULL, 75, 18, ARRAY['salaried', 'self_employed', 'business'], 500, ARRAY['Door step service', 'Multiple repayment options']),
('GL003', 'HDFC Bank', 'Gold Loan', 11.5, 2500000, 25000, 24, 3, 15000, 600, 75, 21, ARRAY['salaried', 'self_employed'], 2000, ARRAY['Bank security', 'Online tracking']),
('GL004', 'ICICI Bank', 'Gold Loan', 11.75, 3000000, 25000, 12, 3, 20000, 650, 75, 21, ARRAY['salaried'], 1500, ARRAY['Digital process', 'Quick approval']),
('GL005', 'Federal Bank', 'Gold Loan', 12.25, 2000000, 15000, 36, 3, 12000, NULL, 75, 18, ARRAY['salaried', 'self_employed', 'business'], 750, ARRAY['Competitive rates', 'Flexible options']);

-- Confirm data insertion
SELECT 'Database setup completed successfully!' as status;