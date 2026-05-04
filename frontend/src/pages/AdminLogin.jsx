import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { Shield, Lock, User, Loader2, ArrowRight } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminApi.login(formData);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data));
      toast.success('Admin Login Successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02172E] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-scale-up">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#95BF47] rounded-[5px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#95BF47]/20">
            <Shield size={32} className="text-[#02172E]" />
          </div>
          <h1 className="text-3xl font-bold text-white font-heading">Admin Console</h1>
          <p className="text-[#6B7280] mt-2 font-medium">Secure access for system administrators</p>
        </div>

        <div className="bg-white rounded-[5px] shadow-2xl overflow-hidden border border-white/10">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest block">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full h-12 bg-[#FAFAF8] border border-[#E4E4E0] rounded-[5px] pl-12 pr-4 text-[14px] font-medium outline-none focus:border-[#95BF47] transition-all"
                    placeholder="Enter admin username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full h-12 bg-[#FAFAF8] border border-[#E4E4E0] rounded-[5px] pl-12 pr-4 text-[14px] font-medium outline-none focus:border-[#95BF47] transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#02172E] text-white font-bold rounded-[5px] flex items-center justify-center gap-2 hover:bg-[#032545] transition-all shadow-lg shadow-navy/20"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="bg-[#FAFAF8] px-8 py-4 border-t border-[#E4E4E0] flex items-center justify-center">
            <span className="text-[12px] text-[#6B7280] font-medium italic">Authorized Personnel Only</span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[#6B7280] text-[13px]">
          Back to <a href="/login" className="text-[#95BF47] font-bold hover:underline">User Login</a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
