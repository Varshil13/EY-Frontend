import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Loan {
  loan_id: number;
  loan_name: string;
  loan_type: string;
  bank_name: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  min_tenure_months: number;
  max_tenure_months: number;
  min_income: number;
  min_credit_score: number;
  created_at: string;
  eligibility_score?: number;
  recommended_amount?: number;
  recommended_tenure?: number;
  estimated_emi?: number;
  recommendation_reason?: string;
}

export function RecommendedLoans() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appliedLoans, setAppliedLoans] = useState<Set<number>>(new Set());

  console.log('🎯 RecommendedLoans component rendered/re-rendered');
  console.log('👤 Current user:', user?.profile_id);

  useEffect(() => {
    console.log('🔄 useEffect triggered in RecommendedLoans');
    console.log('👤 User profile_id:', user?.profile_id);
    
    if (!user?.profile_id) {
      console.log('❌ No user profile_id, skipping fetch');
      return;
    }

    console.log('✅ User profile_id exists, calling fetch functions');
    fetchRecommendations();
    fetchAppliedLoans();
  }, [user?.profile_id]);

  const fetchAppliedLoans = async () => {
    try {
      console.log('📡 fetchAppliedLoans: Starting API call');
      console.log('🌐 API URL:', `${import.meta.env.VITE_API_BASE_URL}/applied-loans/${user?.profile_id}`);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applied-loans/${user?.profile_id}`);
      console.log('📡 fetchAppliedLoans: Response status:', res.status, res.ok);
      
      if (!res.ok) {
        console.log('❌ fetchAppliedLoans: Response not ok, returning');
        return;
      }
      
      const data = await res.json();
      console.log('📡 fetchAppliedLoans: Response data:', data);
      
      const appliedIds = new Set<number>(data.applied_loans?.map((l: any) => Number(l.loan_id)).filter((id: number) => !isNaN(id)) || []);
      console.log('📡 fetchAppliedLoans: Applied loan IDs:', Array.from(appliedIds));
      setAppliedLoans(appliedIds);
    } catch (err) {
      console.error('❌ fetchAppliedLoans: Error occurred:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      console.log('📊 fetchRecommendations: Starting Supabase query');
      console.log('👤 fetchRecommendations: User profile_id:', user?.profile_id);
      setLoading(true);
      
      // Fetch recommended loans for this user from user_loan_reco table
      console.log('🔍 fetchRecommendations: Executing Supabase query...');
      const { data, error } = await supabase
        .from('user_loan_reco')
        .select(`
          created_at,
          eligibility_score,
          recommended_amount,
          recommended_tenure,
          estimated_emi,
          recommendation_reason,
          loans (
            loan_id,
            loan_type,
            bank_name,
            interest_rate,
            min_amount,
            max_amount,
            min_tenure_months,
            max_tenure_months,
            min_income,
            min_credit_score
          )
        `)
        .eq('profile_id', user?.profile_id)
        .order('created_at', { ascending: false });

      console.log('📊 fetchRecommendations: Supabase query completed');
      console.log('📊 fetchRecommendations: Error:', error);
      console.log('📊 fetchRecommendations: Raw data:', data);

      if (error) {
        throw error;
      }

      // Transform the data to match our interface
      console.log('🔄 fetchRecommendations: Transforming data...');
      const transformedData = data?.map(item => {
        const loan = item.loans as any; // Type assertion since Supabase returns it as an object
        return {
          loan_id: loan?.loan_id,
          loan_name: `${loan?.loan_type} - ${loan?.bank_name}`, // Construct name from type and bank
          loan_type: loan?.loan_type,
          bank_name: loan?.bank_name,
          interest_rate: loan?.interest_rate,
          min_amount: loan?.min_amount,
          max_amount: loan?.max_amount,
          min_tenure_months: loan?.min_tenure_months,
          max_tenure_months: loan?.max_tenure_months,
          min_income: loan?.min_income,
          min_credit_score: loan?.min_credit_score,
          created_at: item.created_at,
          eligibility_score: item.eligibility_score,
          recommended_amount: item.recommended_amount,
          recommended_tenure: item.recommended_tenure,
          estimated_emi: item.estimated_emi,
          recommendation_reason: item.recommendation_reason
        };
      }).filter(loan => loan.loan_id) || []; // Filter out any null loans

      console.log('📊 fetchRecommendations: Transformed data:', transformedData);
      console.log('📊 fetchRecommendations: Number of recommendations:', transformedData.length);

      setRecommendations(transformedData);
      setError('');
    } catch (err: any) {
      console.error('❌ fetchRecommendations: Error occurred:', err);
      setError(err.message || 'Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
      console.log('📊 fetchRecommendations: Function completed');
    }
  };

  const handleApply = async (loanId: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: user?.profile_id,
          loan_id: loanId,
        }),
      });

      if (!res.ok) throw new Error('Failed to apply for loan');

      // Add loan to applied set immediately
      setAppliedLoans(prev => new Set([...prev, loanId]));

      // Refetch applied loans to sync
      setTimeout(() => {
        fetchAppliedLoans();
        window.dispatchEvent(new Event('appliedLoansUpdated'));
      }, 500);
    } catch (err: any) {
      console.error('Error applying for loan:', err);
      alert('Error applying for loan: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
          <h3 className="font-semibold mb-2">No Recommendations Found</h3>
          <p className="text-sm">You don't have any loan recommendations yet. Chat with our AI assistant to get personalized loan recommendations based on your profile!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-4">
        {recommendations.map((loan) => (
          <div key={loan.loan_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{loan.loan_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{loan.bank_name}</p>
                <p className="text-xs text-purple-600 mt-1 bg-purple-50 px-2 py-1 rounded-full inline-block capitalize">
                  {loan.loan_type} Loan
                </p>
                {loan.eligibility_score && (
                  <p className="text-xs text-green-600 mt-1 bg-green-50 px-2 py-1 rounded-full inline-block">
                    Eligibility: {loan.eligibility_score}%
                  </p>
                )}
                {loan.created_at && (
                  <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded-full inline-block">
                    Recommended on {new Date(loan.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{loan.interest_rate}%</p>
                <p className="text-xs text-gray-500">Interest Rate</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Loan Amount</p>
                <p className="text-sm font-semibold text-gray-900">₹{loan.min_amount?.toLocaleString()} - ₹{loan.max_amount?.toLocaleString()}</p>
                {loan.recommended_amount && (
                  <p className="text-xs text-blue-600">AI Suggested: ₹{loan.recommended_amount?.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-600">Tenure</p>
                <p className="text-sm font-semibold text-gray-900">{loan.min_tenure_months} - {loan.max_tenure_months} months</p>
                {loan.recommended_tenure && (
                  <p className="text-xs text-blue-600">AI Suggested: {loan.recommended_tenure} months</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-600">Min Income</p>
                <p className="text-sm font-semibold text-gray-900">₹{loan.min_income?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Min Credit Score</p>
                <p className="text-sm font-semibold text-gray-900">{loan.min_credit_score}</p>
              </div>
              {loan.estimated_emi && (
                <>
                  <div>
                    <p className="text-xs text-gray-600">Estimated EMI</p>
                    <p className="text-sm font-semibold text-green-600">₹{loan.estimated_emi?.toLocaleString()}</p>
                  </div>
                </>
              )}
            </div>

            {loan.recommendation_reason && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">AI Recommendation Reason:</p>
                <p className="text-sm text-yellow-700 mt-1">{loan.recommendation_reason}</p>
              </div>
            )}

            <button
              onClick={() => handleApply(loan.loan_id)}
              disabled={appliedLoans.has(loan.loan_id)}
              className={`w-full font-semibold py-2 rounded-lg transition ${
                appliedLoans.has(loan.loan_id)
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {appliedLoans.has(loan.loan_id) ? '✓ Applied' : 'Apply Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}