import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, ChevronDown, Check, Loader2 } from 'lucide-react';
import { clientApi } from '../services/api';
import { toast } from 'react-toastify';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates'
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Other Territory'
];

const INDUSTRIES = [
  'Software', 'Finance', 'Retail', 'Education', 'Healthcare', 'Manufacturing', 'Real Estate', 'Other'
];

const TAX_TREATMENTS = [
  'Consumer', 'Registered Business', 'Unregistered Business', 'Composition Scheme', 'Export'
];

const PAYMENT_ACCOUNTS = [
  'HDFC Bank - 50100...', 'ICICI Bank - 0023...', 'SBI Bank - 1100...', 'Cash in Hand'
];

const UPI_IDS = [
  'business@okaxis', 'founder@okicici', 'payments@paytm'
];

const ClientRegistrationModal = ({ isOpen, onClose, onSuccess, editingClient }) => {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(false);
  
  const initialFormState = {
    clientType: 'Company',
    logo: null,
    businessName: '',
    industry: '',
    alias: '',
    uniqueKey: '',
    email: '',
    showEmailInInvoice: false,
    phone: '',
    showPhoneInInvoice: false,
    country: 'India',
    state: '',
    city: '',
    postalCode: '',
    streetAddress: '',
    gstin: '',
    pan: '',
    taxTreatment: '',
    defaultDueDate: 15,
    paymentAccount: '',
    upiId: ''
  };

  const [clientForm, setClientForm] = useState(initialFormState);

  // Populate form if editing
  useEffect(() => {
    if (editingClient && isOpen) {
      setClientForm({
        ...initialFormState,
        ...editingClient,
        // Map any field differences if necessary
        businessName: editingClient.businessName || editingClient.name || ''
      });
    } else if (!editingClient && isOpen) {
      setClientForm(initialFormState);
    }
  }, [editingClient, isOpen]);

  const handleChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!clientForm.businessName) {
      return toast.warn('Business Name is required');
    }

    setLoading(true);
    try {
      let response;
      if (editingClient) {
        response = await clientApi.update(editingClient._id || editingClient.id, clientForm);
        toast.success('Client updated successfully');
      } else {
        response = await clientApi.create(clientForm);
        toast.success('Client registered successfully');
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      onClose();
      setClientForm(initialFormState);
    } catch (error) {
      console.error('Error saving client:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save client. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = ['General', 'Contact & Address', 'Tax Info', 'Billing & Settings'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
              <User size={24}/>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Client Registration</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Unified Business Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all">
            <X size={24} className="text-slate-400"/>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-white px-8 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-purple-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'General' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-8 items-start">
                {/* Logo Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Logo Upload</label>
                  <label className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group relative overflow-hidden">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleChange('logo', e.target.files[0])}
                    />
                    {clientForm.logo ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-purple-50">
                        <Check size={32} className="text-purple-600" />
                        <span className="absolute bottom-2 text-[10px] font-bold text-purple-600">File Selected</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="group-hover:text-purple-500 mb-2 transition-colors"/>
                        <span className="text-[11px] font-bold">Upload Logo</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex-1 space-y-6">
                  {/* Client Type */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Client Type</label>
                    <div className="flex gap-8">
                      {['Individual', 'Company'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            className="hidden" 
                            name="clientType"
                            checked={clientForm.clientType === type}
                            onChange={() => handleChange('clientType', type)}
                          />
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${clientForm.clientType === type ? 'border-purple-600 bg-purple-50' : 'border-slate-200 group-hover:border-slate-300'}`}>
                            {clientForm.clientType === type && <div className="w-3 h-3 bg-purple-600 rounded-full shadow-sm"/>}
                          </div>
                          <span className={`text-sm font-bold transition-colors ${clientForm.clientType === type ? 'text-slate-800' : 'text-slate-500'}`}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Business Name*</label>
                    <input 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.businessName} 
                      onChange={e => handleChange('businessName', e.target.value)} 
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Client Industry</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.industry} 
                      onChange={e => handleChange('industry', e.target.value)}
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Business Alias</label>
                  <input 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.alias} 
                    onChange={e => handleChange('alias', e.target.value)} 
                    placeholder="Short Name"
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-[50%]">
                <label className="text-[11px] font-black text-slate-400 uppercase">Unique Key</label>
                <input 
                  className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                  value={clientForm.uniqueKey} 
                  onChange={e => handleChange('uniqueKey', e.target.value)} 
                  placeholder="e.g. C-102" 
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT & ADDRESS */}
          {activeTab === 'Contact & Address' && (
            <div className="space-y-8 animate-fade-in">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Email Address</label>
                    <input 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.email} 
                      onChange={e => handleChange('email', e.target.value)} 
                      placeholder="client@example.com" 
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={clientForm.showEmailInInvoice}
                      onChange={e => handleChange('showEmailInInvoice', e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${clientForm.showEmailInInvoice ? 'bg-purple-600 border-purple-600' : 'bg-slate-50 border-slate-200 group-hover:border-slate-300'}`}>
                      {clientForm.showEmailInInvoice && <X size={12} className="text-white"/>}
                    </div>
                    <span className="text-xs font-bold text-slate-500">Show Email in Invoice</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase">Phone Number</label>
                    <input 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.phone} 
                      onChange={e => handleChange('phone', e.target.value)} 
                      placeholder="+91 00000 00000" 
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={clientForm.showPhoneInInvoice}
                      onChange={e => handleChange('showPhoneInInvoice', e.target.checked)}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${clientForm.showPhoneInInvoice ? 'bg-purple-600 border-purple-600' : 'bg-slate-50 border-slate-200 group-hover:border-slate-300'}`}>
                      {clientForm.showPhoneInInvoice && <X size={12} className="text-white"/>}
                    </div>
                    <span className="text-xs font-bold text-slate-500">Show Phone in Invoice</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Address Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Country</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.country} 
                      onChange={e => handleChange('country', e.target.value)}
                    >
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">State / Province</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.state} 
                      onChange={e => handleChange('state', e.target.value)}
                    >
                      <option value="">Select State</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">City/Town</label>
                  <input 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.city} 
                    onChange={e => handleChange('city', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Postal Code / Zip Code</label>
                  <input 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.postalCode} 
                    onChange={e => handleChange('postalCode', e.target.value)} 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Street Address</label>
                  <textarea 
                    rows={3} 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none resize-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.streetAddress} 
                    onChange={e => handleChange('streetAddress', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAX INFO */}
          {activeTab === 'Tax Info' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Business GSTIN</label>
                  <input 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all uppercase" 
                    value={clientForm.gstin} 
                    onChange={e => handleChange('gstin', e.target.value)} 
                    placeholder="e.g. 22AAAAA0000A1Z5" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Business PAN Number</label>
                  <input 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all uppercase" 
                    value={clientForm.pan} 
                    onChange={e => handleChange('pan', e.target.value)} 
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Tax Treatment</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-purple-600 focus:bg-white transition-all" 
                      value={clientForm.taxTreatment} 
                      onChange={e => handleChange('taxTreatment', e.target.value)}
                    >
                      <option value="">Select Treatment</option>
                      {TAX_TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BILLING & SETTINGS */}
          {activeTab === 'Billing & Settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Default Due Date (Days)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.defaultDueDate} 
                    onChange={e => handleChange('defaultDueDate', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Select Payment Account</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.paymentAccount} 
                    onChange={e => handleChange('paymentAccount', e.target.value)} 
                    placeholder="Enter payment account details"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Select UPI ID</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-3.5 text-sm font-bold outline-none focus:border-purple-600 focus:bg-white transition-all" 
                    value={clientForm.upiId} 
                    onChange={e => handleChange('upiId', e.target.value)} 
                    placeholder="Enter UPI ID"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4 sticky bottom-0">
          <button 
            onClick={onClose} 
            className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className={`bg-purple-600 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:bg-purple-700 hover:shadow-purple-200 transition-all active:scale-95 flex items-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Client'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientRegistrationModal;
