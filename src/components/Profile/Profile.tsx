import { useState, useEffect } from 'react';
import { User, BadgeCheck, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    age: '',
    monthly_income: '',
    employment_type: 'salaried',
    years_employed: '',
    credit_score: '',
    existing_emi: '',
    pan_number: '',
    aadhar_number: '',
  });

  // Update form data whenever user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: (user as any)?.name || '',
        email: (user as any)?.email || '',
        phone: (user as any)?.phone || '',
        city: (user as any)?.city || '',
        age: (user as any)?.age || '',
        monthly_income: (user as any)?.monthly_income || '',
        employment_type: (user as any)?.employment_type || 'salaried',
        years_employed: (user as any)?.years_employed || '',
        credit_score: (user as any)?.credit_score || '',
        existing_emi: (user as any)?.existing_emi || '',
        pan_number: (user as any)?.pan_number || '',
        aadhar_number: (user as any)?.aadhar_number || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const profileId = (user as any)?.profile_id;
      
      if (!profileId) {
        alert('Error: Profile ID not found');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          ...formData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        // Reload page to see updated data
        window.location.reload();
      } else {
        throw new Error(data.error || 'Update failed');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      alert('Error updating profile: ' + err.message);
    }
  };



  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
              <User className="w-10 h-10" />
            </div>
            <div>
              <p className="text-sm font-semibold opacity-90">CUSTOMER PROFILE</p>
              <h1 className="text-3xl font-bold">{formData.full_name || 'Your Name'}</h1>
              <p className="text-sm opacity-80 mt-1">{formData.employment_type || 'Employment type'} • {formData.city || 'City'}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isEditing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
            }`}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Profile Status</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Credit Score</p>
          <p className="text-2xl font-bold text-slate-900">{formData.credit_score || '—'}</p>
          {Number(formData.credit_score) >= 700 && <p className="text-xs text-green-600">Excellent</p>}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Monthly Income</p>
          <p className="text-2xl font-bold text-slate-900">₹{(formData.monthly_income || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Existing EMI</p>
          <p className="text-2xl font-bold text-slate-900">₹{(formData.existing_emi || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Profile Form / Details */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        {!isEditing ? (
          // Display View
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Full Name</p>
                <p className="text-lg font-semibold text-slate-900">{formData.full_name}</p>
              </div>

              {/* Email */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Email Address</p>
                <p className="text-lg font-semibold text-slate-900">{formData.email}</p>
              </div>

              {/* Phone */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Phone Number</p>
                <p className="text-lg font-semibold text-slate-900">{formData.phone || 'Not provided'}</p>
              </div>

              {/* City */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">City</p>
                <p className="text-lg font-semibold text-slate-900">{formData.city || 'Not provided'}</p>
              </div>

              {/* Age */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Age</p>
                <p className="text-lg font-semibold text-slate-900">{formData.age || 'Not provided'}</p>
              </div>

              {/* Employment Type */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Employment Type</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">{formData.employment_type}</p>
              </div>

              {/* Years Employed */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Years of Experience</p>
                <p className="text-lg font-semibold text-slate-900">{formData.years_employed || 'Not provided'}</p>
              </div>

              {/* PAN */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">PAN Number</p>
                <p className="text-lg font-semibold text-slate-900">{formData.pan_number || 'Not verified'}</p>
              </div>

              {/* Aadhar */}
              <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Aadhar Number</p>
                <p className="text-lg font-semibold text-slate-900">{formData.aadhar_number ? '●●●●●●●●' + formData.aadhar_number.slice(-4) : 'Not verified'}</p>
              </div>
            </div>
          </div>
        ) : (
          // Edit View
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter phone number"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter city"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="80"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Monthly Income */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Income (₹)</label>
                <input
                  type="number"
                  name="monthly_income"
                  value={formData.monthly_income}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employment Type</label>
                <select
                  name="employment_type"
                  value={formData.employment_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="business">Business</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {/* Years Employed */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                <input
                  type="number"
                  name="years_employed"
                  value={formData.years_employed}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Credit Score */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Credit Score (CIBIL)</label>
                <input
                  type="number"
                  name="credit_score"
                  value={formData.credit_score}
                  onChange={handleInputChange}
                  min="300"
                  max="900"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Existing EMI */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Existing EMI (₹)</label>
                <input
                  type="number"
                  name="existing_emi"
                  value={formData.existing_emi}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* PAN */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PAN Number</label>
                <input
                  type="text"
                  name="pan_number"
                  value={formData.pan_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="XXXXXXXXXX"
                />
              </div>

              {/* Aadhar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aadhar Number</label>
                <input
                  type="text"
                  name="aadhar_number"
                  value={formData.aadhar_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="XXXXXXXXXXXX"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BadgeCheck className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-slate-900">Profile Verified</p>
            <p className="text-sm text-slate-500">Your profile is eligible for AI loan recommendations</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Last updated</p>
          <p className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
