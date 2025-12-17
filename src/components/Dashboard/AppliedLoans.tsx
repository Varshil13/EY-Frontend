import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface AppliedLoan {
  loan_id: number;
  loan_name: string;
  bank: string;
  interest: number;
  min_amount: number;
  max_amount: number;
  tenure: number;
}

export function AppliedLoans() {
  const { user } = useAuth();
  const [appliedLoans, setAppliedLoans] = useState<AppliedLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.profile_id) return;

    fetchAppliedLoans();

    // Listen for apply button clicks
    const handleUpdate = () => fetchAppliedLoans();
    window.addEventListener('appliedLoansUpdated', handleUpdate);

    return () => window.removeEventListener('appliedLoansUpdated', handleUpdate);
  }, [user?.profile_id]);

  const fetchAppliedLoans = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:8000/applied-loans/${user?.profile_id}`);
      if (!res.ok) throw new Error('Failed to fetch applied loans');
      const data = await res.json();
      setAppliedLoans(data.applied_loans || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching applied loans:', err);
      setError(err.message || 'Failed to load applied loans');
      setAppliedLoans([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
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

  if (appliedLoans.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600">
          No applications yet. Apply for loans from the Recommended section!
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid gap-4">
        {appliedLoans.map((loan) => (
          <div key={loan.loan_id} className="bg-green-50 border border-green-300 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{loan.loan_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{loan.bank}</p>
              </div>
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                ✓ Applied
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-600">Interest Rate</p>
                <p className="text-sm font-semibold text-gray-900">{loan.interest}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Loan Amount</p>
                <p className="text-sm font-semibold text-gray-900">₹{loan.min_amount?.toLocaleString()} - ₹{loan.max_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Tenure</p>
                <p className="text-sm font-semibold text-gray-900">{loan.tenure} months</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <p className="text-sm font-semibold text-green-600">Under Review</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
