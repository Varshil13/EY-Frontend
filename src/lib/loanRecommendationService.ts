import { supabase } from './supabase';
import { User, Loan, UserLoanRecommendation, LoanEligibilityResult } from '../types';

export class LoanRecommendationService {
  /**
   * Find loans that match user's eligibility criteria
   */
  static async findEligibleLoans(user: User): Promise<LoanEligibilityResult> {
    try {
      // Fetch all available loans
      const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .order('interest_rate', { ascending: true });

      if (error) throw error;

      // Filter loans based on user eligibility
      const eligibleLoans = loans.filter(loan => 
        user.monthly_income >= loan.min_income && 
        user.credit_score >= loan.min_credit_score
      );

      // Calculate maximum eligible amount (60x monthly income or loan max, whichever is lower)
      const maxEligibleAmount = Math.min(
        user.monthly_income * 60, // Standard 60x income rule
        Math.max(...eligibleLoans.map(loan => loan.max_amount))
      );

      // Calculate eligibility score (0-100)
      const eligibilityScore = this.calculateEligibilityScore(user);

      // Prioritize loans (sort by interest rate, then by bank preference)
      const sortedLoans = eligibleLoans.sort((a, b) => {
        // First by interest rate (lower is better)
        if (a.interest_rate !== b.interest_rate) {
          return a.interest_rate - b.interest_rate;
        }
        // Then by max amount (higher is better for flexibility)
        return b.max_amount - a.max_amount;
      });

      // Generate eligibility reasons
      const reasons = this.generateEligibilityReasons(user, eligibleLoans.length > 0);

      return {
        eligible: eligibleLoans.length > 0,
        max_amount: maxEligibleAmount,
        recommended_loans: sortedLoans.slice(0, 5), // Top 5 recommendations
        eligibility_score: eligibilityScore,
        reasons
      };

    } catch (error) {
      console.error('Error finding eligible loans:', error);
      throw new Error('Failed to fetch loan recommendations');
    }
  }

  /**
   * Save loan recommendations for a user
   */
  static async saveRecommendations(profileId: string, loanIds: string[]): Promise<void> {
    try {
      // Fetch loan details to calculate recommendations
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .in('loan_id', loanIds);

      if (loansError) throw loansError;

      // Prepare recommendations data with all required fields
      const recommendations = loans.map(loan => {
        // Calculate recommended amount (60% of max eligible)
        const recommendedAmount = Math.min(loan.max_amount * 0.6, loan.max_amount);
        
        // Calculate recommended tenure (middle ground)
        const recommendedTenure = Math.floor((loan.min_tenure_months + loan.max_tenure_months) / 2);
        
        // Calculate estimated EMI
        const monthlyRate = loan.interest_rate / 100 / 12;
        const emi = (recommendedAmount * monthlyRate * Math.pow(1 + monthlyRate, recommendedTenure)) / 
                    (Math.pow(1 + monthlyRate, recommendedTenure) - 1);

        return {
          reco_id: `R${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
          profile_id: profileId,
          loan_id: loan.loan_id,
          eligibility_score: 85, // Default good score
          recommended_amount: Math.round(recommendedAmount),
          recommended_tenure: recommendedTenure,
          estimated_emi: Math.round(emi),
          recommendation_reason: `Best rate of ${loan.interest_rate}% from ${loan.bank_name}`
        };
      });

      // Insert recommendations (on conflict do nothing due to unique constraint)
      const { error } = await supabase
        .from('user_loan_reco')
        .upsert(recommendations, { 
          onConflict: 'profile_id,loan_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw new Error('Failed to save loan recommendations');
    }
  }

  /**
   * Get user's recommendation history
   */
  static async getUserRecommendations(profileId: string): Promise<UserLoanRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('user_loan_reco')
        .select(`
          *,
          loans (*)
        `)
        .eq('profile_id', profileId)
        .order('recommended_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch recommendation history');
    }
  }

  /**
   * Calculate user's loan eligibility score (0-100)
   */
  private static calculateEligibilityScore(user: User): number {
    let score = 0;

    // Credit score component (40% weightage)
    if (user.credit_score >= 750) score += 40;
    else if (user.credit_score >= 700) score += 35;
    else if (user.credit_score >= 650) score += 25;
    else if (user.credit_score >= 600) score += 15;
    else score += 5;

    // Income component (30% weightage)
    if (user.monthly_income >= 100000) score += 30;
    else if (user.monthly_income >= 75000) score += 25;
    else if (user.monthly_income >= 50000) score += 20;
    else if (user.monthly_income >= 30000) score += 15;
    else score += 10;

    // Employment stability (20% weightage)
    if (user.years_employed >= 5) score += 20;
    else if (user.years_employed >= 3) score += 15;
    else if (user.years_employed >= 2) score += 10;
    else score += 5;

    // Existing EMI burden (10% weightage)
    const emiRatio = user.existing_emi / user.monthly_income;
    if (emiRatio <= 0.3) score += 10;
    else if (emiRatio <= 0.4) score += 7;
    else if (emiRatio <= 0.5) score += 5;
    else score += 2;

    return Math.min(100, score);
  }

  /**
   * Generate human-readable eligibility reasons
   */
  private static generateEligibilityReasons(user: User, isEligible: boolean): string[] {
    const reasons: string[] = [];

    if (isEligible) {
      if (user.credit_score >= 750) {
        reasons.push(`Excellent credit score of ${user.credit_score}`);
      } else if (user.credit_score >= 700) {
        reasons.push(`Good credit score of ${user.credit_score}`);
      }

      if (user.monthly_income >= 75000) {
        reasons.push(`Strong monthly income of ₹${user.monthly_income.toLocaleString()}`);
      }

      if (user.years_employed >= 3) {
        reasons.push(`${user.years_employed} years of employment stability`);
      }

      const emiRatio = user.existing_emi / user.monthly_income;
      if (emiRatio <= 0.3) {
        reasons.push('Low existing EMI burden');
      }

      if (user.employment_type === 'Salaried') {
        reasons.push('Salaried employment provides stability');
      }

    } else {
      if (user.credit_score < 600) {
        reasons.push(`Credit score of ${user.credit_score} is below minimum requirement`);
      }

      if (user.monthly_income < 25000) {
        reasons.push('Monthly income is below minimum threshold');
      }

      const emiRatio = user.existing_emi / user.monthly_income;
      if (emiRatio > 0.5) {
        reasons.push('High existing EMI burden reduces eligibility');
      }
    }

    return reasons;
  }

  /**
   * Get loans by type (personal, home, auto)
   */
  static async getLoansByType(loanType: string): Promise<Loan[]> {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('loan_type', loanType)
        .order('interest_rate', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching loans by type:', error);
      return [];
    }
  }
}