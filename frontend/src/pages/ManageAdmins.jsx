import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, UserPlus, Power, Check, X, 
  Loader2, Mail, User, ShieldAlert 
} from 'lucide-react';

const ManageAdmins = () => {
  const { user: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [creating, setCreating] = useState(false);

  const fetchAdmins = async () => {
    try {
      const { data } = await adminApi.list();
      setAdmins(data);
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleStatus = async (adminId) => {
    try {
      await adminApi.toggleStatus(adminId);
      toast.success('Admin status updated');
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.create(formData);
      toast.success('Admin created successfully');
      setIsModalOpen(false);
      setFormData({ username: '', password: '' });
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8]">
      <Loader2 className="animate-spin text-[#95BF47]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#0C0E10] font-heading flex items-center gap-3">
              <Shield className="text-[#95BF47]" size={32} />
              Admin Management
            </h1>
            <p className="text-[#6B7280] mt-1 font-medium italic">Control center for system administrators</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-navy flex items-center gap-2 h-11 px-6"
          >
            <UserPlus size={20} /> Create New Admin
          </button>
        </div>

        <div className="bg-white rounded-[5px] shadow-sm border border-[#E4E4E0] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#02172E] text-white">
              <tr>
                <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider">Admin Name</th>
                <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-center">Status</th>
                <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E0]">
              {admins.map(admin => (
                <tr key={admin.id} className="hover:bg-[#F3F8E8] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#02172E] text-white flex items-center justify-center font-bold">
                        {(admin.name || admin.email || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-[#0C0E10]">{admin.name || admin.email}</div>
                        {admin.id === currentAdmin?.id && (
                          <span className="text-[10px] bg-[#95BF47] text-[#02172E] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-widest ${
                      admin.isActive ? 'bg-[#F3F8E8] text-[#95BF47] border border-[#95BF47]/20' : 'bg-red-50 text-red-500 border border-red-100'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => handleToggleStatus(admin.id)}
                      disabled={admin.id === currentAdmin?.id}
                      className={`px-4 py-2 rounded-[5px] text-[12px] font-bold uppercase tracking-wider transition-all ${
                        admin.isActive 
                          ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100' 
                          : 'bg-[#F3F8E8] text-[#95BF47] hover:bg-[#95BF47] hover:text-[#02172E] border border-[#95BF47]/20'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {admin.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#02172E]/60 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[5px] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up border border-[#E4E4E0]">
            <div className="px-8 py-6 bg-[#FAFAF8] border-b border-[#E4E4E0] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#0C0E10] font-heading flex items-center gap-2">
                <UserPlus size={20} className="text-[#95BF47]" /> Create Admin
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B7280] hover:text-[#0C0E10]">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest block">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full h-11 bg-[#FAFAF8] border border-[#E4E4E0] rounded-[5px] pl-12 pr-4 text-[14px] outline-none focus:border-[#95BF47]"
                    placeholder="Admin username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>



              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full h-11 bg-[#FAFAF8] border border-[#E4E4E0] rounded-[5px] pl-12 pr-4 text-[14px] outline-none focus:border-[#95BF47]"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 text-[14px] font-bold text-[#6B7280] hover:text-[#0C0E10]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-navy h-11 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      <Check size={18} strokeWidth={3} /> Save Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
