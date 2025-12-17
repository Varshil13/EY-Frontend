// Database schema interfaces matching the new 3-table structure

export interface User {
  profile_id: string;          // Unique user ID (U001, U002...)
  auth_id?: string;            // Link to Supabase auth.users.id
  name: string;                // User ka naam
  age: number;                 // User ki age
  city: string;                // City
  monthly_income: number;      // Monthly income
  employment_type: string;     // Salaried / Self-Employed
  years_employed: number;      // Job/business experience
  credit_score: number;        // CIBIL / credit score
  existing_emi: number;        // Already chal rahi EMI
  created_at: string;          // Profile creation time
}

export interface Loan {
  loan_id: string;             // Unique loan ID (PL001, HL001, etc.)
  bank_name: string;           // Bank / company name
  loan_type: string;           // personal / home / car / business / education / gold
  interest_rate: number;       // Interest rate (%)
  max_amount: number;          // Maximum loan amount
  min_amount: number;          // Minimum loan amount
  max_tenure_months: number;   // Maximum tenure in months
  min_tenure_months: number;   // Minimum tenure in months
  min_income: number;          // Minimum income required
  min_credit_score: number;    // Minimum credit score
  max_age: number;             // Maximum age
  min_age: number;             // Minimum age
  employment_types: string[];  // Allowed employment types
  processing_fee: number;      // Processing fee
  features: string[];          // Array of features
  created_at: string;          // Creation timestamp
}

export interface UserLoanRecommendation {
  reco_id: string;             // Unique recommendation ID
  profile_id: string;          // FK to users.profile_id
  loan_id: string;             // FK to loans.loan_id
  eligibility_score: number;   // Eligibility score (0-100)
  recommended_amount: number;  // Recommended loan amount
  recommended_tenure: number;  // Recommended tenure in months
  estimated_emi: number;       // Estimated EMI
  recommendation_reason: string; // Why this loan was recommended
  created_at: string;          // Creation timestamp
}

// UI and utility interfaces

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface LoanEligibilityResult {
  eligible: boolean;
  max_amount: number;
  recommended_loans: Loan[];
  eligibility_score: number;
  reasons: string[];
}

export interface LoanApplication {
  user: User;
  requested_amount: number;
  requested_tenure: number;
  purpose: string;
  eligibility_result?: LoanEligibilityResult;
}

export interface DashboardStats {
  total_recommendations: number;
  eligible_loans: number;
  max_eligible_amount: number;
  average_interest_rate: number;
}
