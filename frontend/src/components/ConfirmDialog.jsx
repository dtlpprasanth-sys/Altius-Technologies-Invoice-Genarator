import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-[400px] overflow-hidden animate-scale-up border border-[#E4E4E0]">
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
              <AlertCircle size={22} />
            </div>
            <button onClick={onClose} className="text-[#6B7280] hover:text-[#0C0E10] transition-colors p-1">
              <X size={20} />
            </button>
          </div>
          
          <h3 className="text-[18px] font-bold text-[#0C0E10] mb-2">{title}</h3>
          <p className="text-[14px] text-[#6B7280] leading-relaxed">{message}</p>
        </div>
        
        <div className="bg-[#FAFAF8] p-4 px-5 flex items-center justify-end gap-3 border-t border-[#E4E4E0]">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-bold text-[#6B7280] hover:text-[#0C0E10] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2 rounded-[6px] text-[13px] font-bold text-white transition-all shadow-sm ${type === 'danger' ? 'bg-[#CC3A3A] hover:bg-[#B32E2E] active:scale-[0.98]' : 'bg-[#95BF47] hover:bg-[#84AB3E]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
