-- Sample Loan Data for Testing the Recommendation System
-- Run this after creating the schema to populate the loans table

-- Personal Loans
INSERT INTO loans (loan_name, loan_type, bank_name, interest_rate, min_income, min_credit_score, min_amount, max_amount, min_tenure, max_tenure) VALUES
('HDFC Personal Loan', 'personal', 'HDFC Bank', 10.5, 25000, 650, 50000, 4000000, 1, 7),
('SBI Personal Loan', 'personal', 'State Bank of India', 11.2, 20000, 600, 30000, 2500000, 1, 6),
('ICICI Instant Personal Loan', 'personal', 'ICICI Bank', 10.9, 30000, 700, 100000, 5000000, 1, 5),
('Axis Bank Personal Loan', 'personal', 'Axis Bank', 12.0, 25000, 650, 50000, 3500000, 1, 6),
('Kotak Mahindra Personal Loan', 'personal', 'Kotak Mahindra Bank', 11.5, 35000, 720, 100000, 4500000, 2, 7),
('Bajaj Finserv Personal Loan', 'personal', 'Bajaj Finserv', 13.0, 20000, 650, 25000, 2500000, 1, 5),
('Tata Capital Personal Loan', 'personal', 'Tata Capital', 12.5, 25000, 680, 50000, 3000000, 1, 6),
('IndusInd Bank Personal Loan', 'personal', 'IndusInd Bank', 11.8, 40000, 750, 100000, 5000000, 2, 7),

-- Home Loans
('HDFC Home Loan', 'home', 'HDFC Bank', 8.5, 35000, 700, 500000, 50000000, 5, 30),
('SBI Home Loan', 'home', 'State Bank of India', 8.3, 30000, 650, 300000, 40000000, 5, 30),
('ICICI Home Loan', 'home', 'ICICI Bank', 8.7, 40000, 720, 500000, 60000000, 5, 25),
('Axis Bank Home Loan', 'home', 'Axis Bank', 8.9, 35000, 700, 400000, 45000000, 5, 30),
('LIC Housing Finance', 'home', 'LIC Housing Finance', 8.4, 30000, 680, 300000, 50000000, 5, 30),
('PNB Housing Finance', 'home', 'PNB Housing Finance', 8.6, 35000, 650, 400000, 35000000, 5, 25),

-- Auto Loans
('HDFC Car Loan', 'auto', 'HDFC Bank', 9.5, 25000, 650, 200000, 2000000, 1, 7),
('SBI Car Loan', 'auto', 'State Bank of India', 9.2, 20000, 600, 150000, 1500000, 1, 7),
('ICICI Car Loan', 'auto', 'ICICI Bank', 9.8, 30000, 700, 200000, 2500000, 1, 6),
('Axis Bank Car Loan', 'auto', 'Axis Bank', 10.0, 25000, 650, 200000, 2000000, 1, 7),
('Mahindra Finance Car Loan', 'auto', 'Mahindra Finance', 10.5, 20000, 620, 150000, 1800000, 1, 7),
('Bajaj Auto Finance', 'auto', 'Bajaj Auto Finance', 11.0, 18000, 600, 100000, 1500000, 1, 5),

-- Premium/High-End Loans
('HDFC Preferred Personal Loan', 'personal', 'HDFC Bank', 9.5, 100000, 750, 500000, 10000000, 1, 7),
('Citibank Personal Loan', 'personal', 'Citibank', 9.8, 150000, 780, 1000000, 15000000, 1, 5),
('Standard Chartered Personal Loan', 'personal', 'Standard Chartered', 10.0, 200000, 800, 1500000, 20000000, 2, 5),

-- Budget-Friendly Loans
('IDFC First Bank Personal Loan', 'personal', 'IDFC First Bank', 13.5, 15000, 580, 25000, 1000000, 1, 4),
('Yes Bank Personal Loan', 'personal', 'Yes Bank', 14.0, 18000, 600, 30000, 1200000, 1, 5),

-- Two-Wheeler Loans
('TVS Credit Two Wheeler Loan', 'auto', 'TVS Credit', 12.0, 15000, 550, 50000, 300000, 1, 5),
('Bajaj Two Wheeler Loan', 'auto', 'Bajaj Auto Finance', 11.5, 12000, 580, 30000, 250000, 1, 4);