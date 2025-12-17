import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, Calendar, FileText, Building2, MessageCircle, RefreshCw } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../../config/api';

interface AIRecommendedLoan {
  loan_id: number;
  loan_name: string;
  bank: string;
  interest: number;
  min_amount: number;
  max_amount: number;
  tenure: number;
  min_income?: number;
  min_credit_score?: number;
  recommended_at?: string;
}

export default function LoanRecommendations() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendedLoan[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.profile_id) {
      loadAIRecommendations();
    }
  }, [user?.profile_id]);

  // Listen for AI recommendation updates
  useEffect(() => {
    const handleAIRecommendation = () => {
      console.log('🔄 AI recommendation received, refreshing...');
      setTimeout(() => loadAIRecommendations(), 1000); // Small delay to ensure DB is updated
    };

    window.addEventListener('aiRecommendationReceived', handleAIRecommendation);
    return () => window.removeEventListener('aiRecommendationReceived', handleAIRecommendation);
  }, []);

  const loadAIRecommendations = async () => {
    if (!user?.profile_id) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.RECOMMENDATIONS, user.profile_id));
      if (!res.ok) throw new Error('Failed to fetch AI recommendations');
      
      const data = await res.json();
      console.log('📊 Loaded recommendations:', data.recommendations?.length || 0);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const clearRecommendations = async () => {
    if (!user?.profile_id) return;
    
    try {
      const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CLEAR_RECOMMENDATIONS, user.profile_id), {
        method: 'DELETE'
      });
      if (res.ok) {
        setRecommendations([]);
        console.log('🗑️ Cleared recommendations for fresh start');
      }
    } catch (err) {
      console.error('Error clearing recommendations:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-600">
          Please log in to view AI loan recommendations
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Recommended Loans</h2>
            <p className="text-gray-600">
              Loans specifically recommended for you by our AI assistant
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadAIRecommendations}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {recommendations.length > 0 && (
              <button
                onClick={clearRecommendations}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Recommended Loans ({recommendations.length})
            </h3>
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Recommended by AI Assistant
            </span>
          </div>
          
          <div className="space-y-4">
            {recommendations.map((loan, index) => (
              <div key={loan.loan_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{loan.loan_name}</h4>
                      <p className="text-gray-600">{loan.bank}</p>
                      {loan.recommended_at && (
                        <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded-full inline-block">
                          Recommended on {new Date(loan.recommended_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{loan.interest}%</div>
                    <div className="text-sm text-gray-600">Interest Rate</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Amount Range</div>
                    <div className="font-semibold">₹{(loan.min_amount/100000).toFixed(1)}L - ₹{(loan.max_amount/100000).toFixed(1)}L</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Tenure</div>
                    <div className="font-semibold">Up to {loan.tenure} months</div>
                  </div>
                  {loan.min_income && (
                    <div>
                      <div className="text-gray-600 mb-1">Min Income</div>
                      <div className="font-semibold">₹{loan.min_income.toLocaleString()}</div>
                    </div>
                  )}
                  {loan.min_credit_score && (
                    <div>
                      <div className="text-gray-600 mb-1">Min CIBIL</div>
                      <div className="font-semibold">{loan.min_credit_score}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Recommended by AI Assistant</span>
                  </div>
                  
                  <button className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No AI Recommendations Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Chat with our AI assistant to get personalized loan recommendations tailored to your needs
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 text-sm max-w-md mx-auto mb-4">
            <strong>How to get recommendations:</strong>
            <br />Ask the AI assistant questions like "I need a personal loan" or "Show me home loan options"
          </div>
          <button
            onClick={loadAIRecommendations}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Check for New Recommendations
          </button>
        </div>
      )}
    </div>
  );
}