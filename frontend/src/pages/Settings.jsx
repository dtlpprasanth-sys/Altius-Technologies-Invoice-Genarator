import React, { useState, useEffect, useRef } from 'react';
import { settingsApi } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Building2, Mail, Phone, MapPin, Landmark, 
  Hash, Image as ImageIcon, PenTool, Save,
  Upload, ChevronRight, Globe, CreditCard, Edit3
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    businessName: '', email: '', phone: '', telephone: '', address: '', 
    city: '', state: '', pincode: '', country: 'India', registeredOffice: '',
    gstin: '', pan: '', ieCode: '', cin: '', website: '', lutDetails: '',
    satelliteStation: '', bankName: '', accountName: '', accountNumber: '', 
    ifscCode: '', iban: '', swiftCode: '', invoicePrefix: 'INV', invoiceCounter: 1,
    logoUrl: '', signatureUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsApi.get();
        if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
      } catch {
        toast.error('Error loading settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await settingsApi.update(settings);
      toast.success('Settings saved successfully');
      setIsEditing(false);
    } catch {
      toast.error('Error saving settings');
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [type]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="flex-1 p-10 bg-[#F8F9FD] min-h-screen overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
        
        {/* HEADER */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Organization Details</h1>
            <p className="text-sm text-slate-500 font-medium">Manage your business profile and invoice defaults</p>
          </div>
          {isEditing ? (
            <button 
              onClick={handleSave}
              className="bg-[#8B5CF6] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-100 hover:bg-[#7C3AED] transition-all flex items-center gap-2 active:scale-95"
            >
              <Save size={18}/> Save
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all flex items-center gap-2 active:scale-95"
            >
              <Edit3 size={18}/> Edit
            </button>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 items-start ${!isEditing ? 'pointer-events-none opacity-80' : ''}`}>
          
          {/* COLUMN 1: BUSINESS PROFILE + BANK DETAILS */}
          <div className="space-y-8">
            {/* BUSINESS PROFILE */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Building2 size={20}/></div>
                <h2 className="text-lg font-black text-slate-800">Business Profile</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Legal Name</label>
                  <input className="settings-input" value={settings.businessName} onChange={e=>setSettings({...settings, businessName: e.target.value})} placeholder="e.g. Acme Corp"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                    <input className="settings-input" value={settings.email} onChange={e=>setSettings({...settings, email: e.target.value})} placeholder="billing@acme.com"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input className="settings-input" value={settings.phone} onChange={e=>setSettings({...settings, phone: e.target.value})} placeholder="+91 98765 43210"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Telephone No</label>
                    <input className="settings-input" value={settings.telephone || ''} onChange={e=>setSettings({...settings, telephone: e.target.value})} placeholder="0422 244 5566"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Business Website</label>
                    <input className="settings-input" value={settings.website} onChange={e=>setSettings({...settings, website: e.target.value})} placeholder="https://www.acme.com"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Street Address (Display)</label>
                  <textarea className="settings-input h-20 py-3 resize-none text-sm" value={settings.address} onChange={e=>setSettings({...settings, address: e.target.value})} placeholder="123, Business Park..."/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Registered Office Address</label>
                  <textarea className="settings-input h-20 py-3 resize-none text-sm" value={settings.registeredOffice} onChange={e=>setSettings({...settings, registeredOffice: e.target.value})} placeholder="Official registered address..."/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">City</label>
                    <input className="settings-input" value={settings.city} onChange={e=>setSettings({...settings, city: e.target.value})} placeholder="Mumbai"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Postal Code</label>
                    <input className="settings-input" value={settings.pincode} onChange={e=>setSettings({...settings, pincode: e.target.value})} placeholder="400001"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">State / UT</label>
                    <input className="settings-input" value={settings.state} onChange={e=>setSettings({...settings, state: e.target.value})} placeholder="Maharashtra"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Country</label>
                    <input className="settings-input" value={settings.country} onChange={e=>setSettings({...settings, country: e.target.value})} placeholder="India"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GSTIN</label>
                    <input className="settings-input" value={settings.gstin} onChange={e=>setSettings({...settings, gstin: e.target.value})} placeholder="27AAAAA0000A1Z5"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PAN Number</label>
                    <input className="settings-input" value={settings.pan} onChange={e=>setSettings({...settings, pan: e.target.value})} placeholder="ABCDE1234F"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">IE Code</label>
                    <input className="settings-input" value={settings.ieCode} onChange={e=>setSettings({...settings, ieCode: e.target.value})} placeholder="AAVCA7812Q"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CIN Number</label>
                    <input className="settings-input" value={settings.cin} onChange={e=>setSettings({...settings, cin: e.target.value})} placeholder="U72900TZ2021..."/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Satellite Station</label>
                  <input className="settings-input" value={settings.satelliteStation} onChange={e=>setSettings({...settings, satelliteStation: e.target.value})} placeholder="e.g. Jio"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">LUT Details (Export Invoices)</label>
                  <textarea className="settings-input h-20 py-3 resize-none text-sm" value={settings.lutDetails} onChange={e=>setSettings({...settings, lutDetails: e.target.value})} placeholder="SUPPLY MEANT FOR EXPORT UNDER BOND..."/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Default Export Type</label>
                  <textarea className="settings-input h-20 py-3 resize-none text-sm" value={settings.softwareExportType} onChange={e=>setSettings({...settings, softwareExportType: e.target.value})} placeholder="Data Entry and conversion, Software processing, RBI Code: 907"/>
                </div>
              </div>
            </div>

            {/* BANK DETAILS */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Landmark size={20}/></div>
                <h2 className="text-lg font-black text-slate-800">Bank Details</h2>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Account Holder Name</label>
                  <input className="settings-input" value={settings.accountName} onChange={e=>setSettings({...settings, accountName: e.target.value})} placeholder="Acme Technologies Pvt Ltd"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                  <input className="settings-input" value={settings.bankName} onChange={e=>setSettings({...settings, bankName: e.target.value})} placeholder="HDFC Bank"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
                  <input className="settings-input" value={settings.accountNumber} onChange={e=>setSettings({...settings, accountNumber: e.target.value})} placeholder="5010023..."/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</label>
                    <input className="settings-input" value={settings.ifscCode} onChange={e=>setSettings({...settings, ifscCode: e.target.value})} placeholder="HDFC0001234"/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SWIFT Code</label>
                    <input className="settings-input" value={settings.swiftCode} onChange={e=>setSettings({...settings, swiftCode: e.target.value})} placeholder="CHASUS33XXX"/>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">IBAN Number</label>
                  <input className="settings-input" value={settings.iban} onChange={e=>setSettings({...settings, iban: e.target.value})} placeholder="FED ABA 0210-0002-1"/>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: BRANDING + INVOICE DEFAULTS */}
          <div className="space-y-8">
            {/* BRANDING */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><PenTool size={20}/></div>
                <h2 className="text-lg font-black text-slate-800">Branding & Identity</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Company Logo</label>
                  <div 
                    onClick={() => logoInputRef.current.click()}
                    className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-purple-300 transition-all overflow-hidden group"
                  >
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} className="w-full h-full object-contain p-4" alt="Logo"/>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-2 group-hover:text-purple-400 transition-colors" size={32}/>
                        <span className="text-xs font-bold text-slate-400">Click to upload logo</span>
                      </>
                    )}
                    <input type="file" ref={logoInputRef} className="hidden" onChange={e=>handleFileChange(e, 'logoUrl')}/>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Authorized Signature</label>
                  <div 
                    onClick={() => signatureInputRef.current.click()}
                    className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-purple-300 transition-all overflow-hidden group"
                  >
                    {settings.signatureUrl ? (
                      <img src={settings.signatureUrl} className="w-full h-full object-contain p-4" alt="Signature"/>
                    ) : (
                      <>
                        <PenTool className="text-slate-300 mb-2 group-hover:text-purple-400 transition-colors" size={32}/>
                        <span className="text-xs font-bold text-slate-400">Click to upload signature</span>
                      </>
                    )}
                    <input type="file" ref={signatureInputRef} className="hidden" onChange={e=>handleFileChange(e, 'signatureUrl')}/>
                  </div>
                </div>
              </div>
            </div>

            {/* INVOICE DEFAULTS */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><Hash size={20}/></div>
                <h2 className="text-lg font-black text-slate-800">Invoice Defaults</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Invoice Prefix</label>
                  <input className="settings-input text-sm" value={settings.invoicePrefix} onChange={e=>setSettings({...settings, invoicePrefix: e.target.value})} placeholder="INV"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Next Counter</label>
                  <input className="settings-input text-sm" type="number" value={settings.invoiceCounter} onChange={e=>setSettings({...settings, invoiceCounter: parseInt(e.target.value)})} placeholder="1"/>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
  );
};

export default Settings;
