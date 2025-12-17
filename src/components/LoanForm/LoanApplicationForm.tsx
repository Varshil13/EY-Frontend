import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoanRecommendationService } from '../../lib/loanRecommendationService';
import { Loan, LoanEligibilityResult } from '../../types';
import { DollarSign, Calendar, FileText, Loader2, Target, Building2, Star, Filter, CheckCircle } from 'lucide-react';

export default function LoanApplicationForm() {
  const [loanType, setLoanType] = useState('personal');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [requestedTenure, setRequestedTenure] = useState('3');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<LoanEligibilityResult | null>(null);
  const [filteredLoans, setFilteredLoans] = useState<Loan[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Calculate maximum eligible amount based on income
  const maxEligibleAmount = user ? Math.min(user.monthly_income * 60, 5000000) : 0;

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  useEffect(() => {
    filterLoans();
  }, [eligibilityResult, loanType, requestedAmount]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await LoanRecommendationService.findEligibleLoans(user);
      setEligibilityResult(result);

      // Save recommendations
      if (result.eligible && result.recommended_loans.length > 0) {
        const loanIds = result.recommended_loans.map(loan => loan.loan_id);
        await LoanRecommendationService.saveRecommendations(user.profile_id, loanIds);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    if (!eligibilityResult) return;

    let loans = eligibilityResult.recommended_loans.filter(loan => loan.loan_type === loanType);

    // Filter by requested amount if specified
    if (requestedAmount) {
      const amount = parseInt(requestedAmount);
      loans = loans.filter(loan => 
        amount >= loan.min_amount && amount <= loan.max_amount
      );
    }

    // Sort by interest rate (ascending)
    loans.sort((a, b) => a.interest_rate - b.interest_rate);

    setFilteredLoans(loans);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !requestedAmount) return;

    setLoading(true);
    setError('');
    
    try {
      // Simulate loan application submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        setRequestedAmount('');
        setRequestedTenure('3');
      }, 3000);
    } catch (err: any) {
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for Personal Loan</h2>
        <p className="text-gray-600">
          Fill out the form below and our AI agents will process your application instantly
        </p>
        {user?.monthly_income && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Based on your income, you're eligible for loans up to{' '}
              <span className="font-bold">₹{maxEligibleAmount.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fadeIn">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Application Submitted Successfully!</p>
            <p className="text-sm text-green-700">Our AI agents are processing your request.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount (₹)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="amount"
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              required
              min="50000"
              max={maxEligibleAmount}
              step="1000"
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter amount (min ₹50,000)"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Minimum: ₹50,000 | Maximum: ₹{maxEligibleAmount.toLocaleString()}</p>
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Purpose
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">Select purpose</option>
              <option value="Home Renovation">Home Renovation</option>
              <option value="Wedding">Wedding</option>
              <option value="Education">Education</option>
              <option value="Medical Emergency">Medical Emergency</option>
              <option value="Debt Consolidation">Debt Consolidation</option>
              <option value="Business Expansion">Business Expansion</option>
              <option value="Travel">Travel</option>
              <option value="Vehicle Purchase">Vehicle Purchase</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tenure" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Tenure
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="tenure"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900">Estimated EMI</h3>
          {amount && (
            <p className="text-2xl font-bold text-blue-600">
              ₹{Math.round((parseFloat(amount) * (1 + 0.105 * parseInt(tenure) / 12)) / parseInt(tenure)).toLocaleString()}
              <span className="text-sm text-gray-600 font-normal">/month</span>
            </p>
          )}
          <p className="text-xs text-gray-500">
            * Estimated at 10.5% interest rate. Actual rate may vary based on credit profile.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Application...
            </>
          ) : (
            'Submit Application'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By submitting, you agree to our terms and conditions. Your data is secure and encrypted.
        </p>
      </form>
    </div>
  );
}
