import React, { useState } from 'react';
import { X, Package, Check, Loader2 } from 'lucide-react';
import { productApi } from '../services/api';
import { toast } from 'react-toastify';

const ProductRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hsnCode: '998313',
    price: 0,
    unit: '',
    description: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.warn('Item Name is required');
    
    setLoading(true);
    try {
      const res = await productApi.create(formData);
      toast.success('Item registered successfully');
      if (onSuccess) onSuccess(res.data);
      onClose();
      setFormData({ name: '', hsnCode: '998313', price: 0, unit: 'per SKU', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#02172E]/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-[500px] rounded-[5px] shadow-2xl border border-[#E4E4E0] overflow-hidden flex flex-col animate-scale-up">
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#E4E4E0] flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#02172E] rounded-[5px] flex items-center justify-center text-[#F3F8E8] shadow-lg shadow-navy/10">
              <Package size={20} fill="currentColor" className="opacity-80" />
            </div>
            <h2 className="text-[24px] font-bold text-[#0C0E10] font-heading leading-tight">New Item Entry</h2>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#0C0E10] transition-colors p-1">
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Item Name *</label>
            <input 
              autoFocus
              className="w-full h-[52px] border border-[#95BF47] rounded-[5px] px-4 text-[15px] font-medium text-[#0C0E10] outline-none shadow-sm shadow-[#95BF47]/5" 
              placeholder="e.g. Software Development"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">HSN / SAC CODE</label>
            <input 
              className="w-full h-[52px] border border-[#E4E4E0] rounded-[5px] px-4 text-[15px] font-medium text-[#0C0E10] outline-none focus:border-[#95BF47] transition-all" 
              placeholder="e.g. 998313"
              value={formData.hsnCode}
              onChange={e => setFormData({...formData, hsnCode: e.target.value})}
            />
            <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-widest pt-1">Leave blank if not applicable</p>
          </div>

          <div className="h-px bg-[#E4E4E0] w-full" />

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-8">
            <button 
              type="button"
              onClick={onClose} 
              className="text-[15px] font-bold text-[#6B7280] hover:text-[#0C0E10] transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="h-[52px] px-8 rounded-[5px] bg-[#02172E] hover:bg-[#0C0E10] text-white flex items-center gap-4 shadow-xl shadow-[#02172E]/10 transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Check size={20} strokeWidth={3} />
                  <span className="text-[15px] font-bold">Create Item Entry</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductRegistrationModal;
