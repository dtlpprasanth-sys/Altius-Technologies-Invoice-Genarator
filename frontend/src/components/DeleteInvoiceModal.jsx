import React, { useState } from 'react';
import { X, ChevronDown, AlertCircle } from 'lucide-react';

const DELETE_REASONS = [
  { group: 'DATA ERROR', options: [
    'Duplicate entry',
    'Wrong price/rate',
    'Wrong quantity',
    'Wrong item/service',
    'Wrong client/vendor details',
    'Incorrect Details'
  ]},
  { group: 'COMPLIANCE', options: [
    'Change in Tax/Regulation',
    'Order Cancelled',
    'Revised Invoice required'
  ]},
  { group: 'OTHERS', options: [
    'Testing/Internal use',
    'Other'
  ]}
];

const DeleteInvoiceModal = ({ isOpen, onClose, onConfirm, invoiceNumber }) => {
  const [reason, setReason] = useState('Duplicate entry');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0C0E10]/40 backdrop-blur-[2px]" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-[500px] rounded-[12px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E4E4E0] flex items-center justify-between">
          <h3 className="text-[18px] font-bold text-[#0C0E10] font-heading">Delete Invoice?</h3>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#0C0E10] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[15px] text-[#4B5563] mb-5 font-medium">
            Are you sure you want to Delete the invoice <span className="font-bold text-[#0C0E10]">{invoiceNumber}</span>?
          </p>

          <div className="relative">
            <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5 block">Reason for deletion</label>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full h-11 border ${isDropdownOpen ? 'border-[#9333EA] ring-2 ring-[#9333EA]/10' : 'border-[#E4E4E0]'} rounded-[8px] px-4 flex items-center justify-between bg-white transition-all text-[14px] text-[#0C0E10] font-medium`}
            >
              <span>{reason}</span>
              <ChevronDown size={18} className={`text-[#6B7280] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-[#E4E4E0] rounded-[8px] shadow-xl z-10 max-h-[300px] overflow-y-auto py-1 custom-scrollbar">
                {DELETE_REASONS.map((group) => (
                  <div key={group.group}>
                    <div className="px-4 py-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest bg-[#FAFAF8]">
                      {group.group}
                    </div>
                    {group.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setReason(opt);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[14px] transition-colors ${
                          reason === opt 
                            ? 'bg-[#F3E8FF] text-[#9333EA] font-bold' 
                            : 'text-[#4B5563] hover:bg-[#FAFAF8]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3 p-4 bg-[#FEF2F2] rounded-[8px] border border-[#FEE2E2]">
            <AlertCircle className="text-[#CC3A3A] shrink-0" size={20} />
            <p className="text-[13px] text-[#991B1B] font-medium leading-relaxed">
              This record will be moved to the audit log for compliance. This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#E4E4E0] flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="h-10 px-5 text-[14px] font-bold text-[#4B5563] hover:text-[#0C0E10] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(reason)}
            className="h-10 px-6 bg-[#CC3A3A] text-white rounded-[8px] text-[14px] font-bold hover:bg-[#B91C1C] transition-all shadow-sm active:transform active:scale-[0.98]"
          >
            Delete Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteInvoiceModal;
