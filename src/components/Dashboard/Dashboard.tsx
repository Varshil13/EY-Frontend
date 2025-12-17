import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Activity, TrendingUp, BarChart3, Clock, CheckCircle, DollarSign } from 'lucide-react';
import AgentTimeline from './AgentTimeline';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalApplications: 0,
    inProgress: 0,
    approved: 0,
    totalSanctioned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Mock agent activities
  const mockAgentActivities = [
    {
      id: '1',
      agent_type: 'master',
      action: 'Application initiated',
      status: 'pending' as const,
      metadata: {},
      created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '2',
      agent_type: 'sales',
      action: 'Negotiating loan terms',
      status: 'pending' as const,
      metadata: {
        interest_rate: 11.28,
        suggested_amount: 100000,
        suggested_tenure: 12,
      },
      created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    },
    {
      id: '3',
      agent_type: 'verification',
      action: 'KYC verification complete',
      status: 'pending' as const,
      metadata: {
        cibil_check: 'pending',
        pan_verified: false,
        aadhar_verified: false,
      },
      created_at: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
      id: '4',
      agent_type: 'underwriting',
      action: 'Credit evaluation complete',
      status: 'pending' as const,
      metadata: {
        credit_score: 677,
        max_eligible_amount: 3000000,
        debt_to_income_ratio: 0.35,
      },
      created_at: new Date(Date.now() - 60000).toISOString(),
    },
    {
      id: '5',
      agent_type: 'sanction',
      action: 'Loan sanctioned',
      status: 'pending' as const,
      metadata: {
        sanctioned_amount: 2500000,
        final_interest_rate: 11.28,
        tenure_months: 12,
      },
      created_at: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user?.profile_id) return;
    
    setLoading(true);
    setError('');

    try {
      // Fetch loan application statistics from user_applications table
      const { data: appliedLoans, error: appliedError } = await supabase
        .from('user_applications')
        .select('*')
        .eq('profile_id', user.profile_id);

      if (appliedError) throw appliedError;

      // Calculate stats from user applications
      const totalApplications = appliedLoans?.length || 0;
      const inProgress = appliedLoans?.filter(loan => loan.status === 'pending' || loan.status === 'in_progress' || loan.status === 'processing')?.length || 0;
      const approved = appliedLoans?.filter(loan => loan.status === 'approved' || loan.status === 'sanctioned')?.length || 0;
      const totalSanctioned = appliedLoans
        ?.filter(loan => loan.status === 'sanctioned')
        ?.reduce((sum, loan) => sum + (loan.sanctioned_amount || 500000), 0) || 0; // Default amount if not specified

      setStats({
        totalApplications,
        inProgress,
        approved,
        totalSanctioned
      });

    } catch (err: any) {
      console.error('Error fetching loan statistics:', err);
      setError(err.message || 'Failed to load loan statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="text-yellow-600 mb-2">Please log in to view your dashboard</div>
        </div>
      </div>
    );
  }

  const getEligibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Profile ID: {user.profile_id}
        </p>
        <p className="text-gray-500 mt-2">
          Here's an overview of your loan applications
        </p>
      </div>

      {/* Loan Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Applications */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Applications</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplications}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Approved</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Sanctioned */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Sanctioned</h3>
              <p className="text-3xl font-bold text-cyan-600 mt-2">
                ₹{(stats.totalSanctioned / 100000).toFixed(1)}L
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}



      {/* AI Agent Timeline */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          AI Agent Activity Timeline<br />
          <small>(for display only, will be made dynamic later)</small>
        </h2>
        <AgentTimeline activities={mockAgentActivities} />
      </div>

      {/* No Applications State */}
      {!loading && stats.totalApplications === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Loan Applications Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by getting loan recommendations from our AI assistant and apply for loans
          </p>
          <div className="text-sm text-gray-500">
            Tip: Go to Recommended Loans section to see AI-suggested options
          </div>
        </div>
      )}
    </div>
  );
}
