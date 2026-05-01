import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] font-sans">
      <div className="flex flex-1 overflow-hidden w-full">
        {/* LEFT SECTION */}
        <div className="hidden lg:flex w-[42%] bg-[#02172E] flex-col p-8 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-[#95BF47]" size={20} />
            <span className="text-[11px] font-bold text-white tracking-[3px] uppercase">Nxt Invoice</span>
          </div>
          <div className="w-10 h-[2px] bg-[#95BF47] mb-12"></div>
          
          <div className="flex-1 flex flex-col justify-center max-w-[320px]">
            <h1 className="text-[52px] font-bold text-white leading-[1.05] mb-5 font-serif">
              Craft your <em className="text-[#95BF47] italic">vision</em> into reality.
            </h1>
            <p className="text-[15px] text-white/50 leading-relaxed max-w-[280px]">
              The premium workspace for digital architects who refuse to settle for the ordinary.
            </p>
          </div>

          <div className="flex items-end gap-2 pb-8">
            <div className="w-40 h-[72px] bg-[#CC3A3A] rounded-[5px] flex items-center justify-center flex-shrink-0 text-2xl">🧭</div>
            <div className="flex flex-col gap-2">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[5px] flex items-center justify-center text-2xl opacity-30">⊞</div>
              <div className="w-20 h-20 bg-[#95BF47] rounded-[5px] flex items-center justify-center text-2xl text-[#02172E]">💡</div>
            </div>
          </div>
          
          <div className="text-[11px] text-white/25 uppercase tracking-wider">© 2026 AltiusNxt. All rights reserved.</div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex-1 lg:w-[58%] bg-white flex flex-col p-6 lg:p-8">
          <div className="flex justify-end">
            <a className="text-[13px] text-[#6B7280] hover:text-[#0C0E10] cursor-pointer transition-colors">Support</a>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-[400px]">
              <Zap className="text-[#95BF47] mx-auto mb-4" size={28} />
              <h2 className="text-[30px] font-bold text-[#0C0E10] text-center font-serif">Welcome back.</h2>
              <p className="text-[14px] text-[#6B7280] text-center mt-1 mb-10">Sign in to your account</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#6B7280] block mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full h-12 border-b border-[#E4E4E0] text-[14px] text-[#0C0E10] bg-transparent outline-none focus:border-[#95BF47] transition-all placeholder:text-[#6B7280]/50"
                  />
                </div>

                <div className="mb-6 relative">
                  <label className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#6B7280] block mb-1.5">Password</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-12 border-b border-[#E4E4E0] text-[14px] text-[#0C0E10] bg-transparent outline-none focus:border-[#95BF47] transition-all placeholder:text-[#6B7280]/50 pr-8"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-0 bottom-3 text-[#6B7280] hover:text-[#95BF47] transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#95BF47] hover:bg-[#85AF37] text-[#0C0E10] font-bold rounded-[5px] mt-8 flex items-center justify-center gap-2 transition-all active:scale-[0.985] disabled:opacity-70 text-[15px]"
                >
                  {loading ? 'Signing in...' : (<>Sign In <ArrowRight size={17} /></>)}
                </button>
              </form>

              <div className="text-center mt-5 text-[13px] text-[#6B7280]">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#95BF47] font-bold hover:underline">
                  Create one free
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <span className="text-[12px] text-[#6B7280]">Privacy Policy · Terms of Service · Help Center</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
