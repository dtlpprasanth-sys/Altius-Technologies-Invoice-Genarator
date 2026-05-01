import React, { useState, useEffect, useRef } from 'react';
import { settingsApi } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Building2, Mail, Phone, Landmark, Hash, 
  Image as ImageIcon, Save, Upload, Edit3,
  Search, Bell, Palette, Briefcase, ChevronRight,
  User, Shield, CreditCard, Globe, Zap, Settings as SettingsIcon, PenTool
} from 'lucide-react';

const DataField = ({ label, value, field, type = 'text', fullWidth = false, isEditing, settings, setSettings }) => (
  <div className={`settings-field ${fullWidth ? 'settings-field-full col-span-2' : ''} space-y-1.5`}>
    <label className="settings-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280] block mb-1">{label}</label>
    {isEditing ? (
      type === 'textarea' ? (
        <textarea 
          className="field-input w-full min-h-[80px] py-2 resize-none"
          value={settings[field] || ''}
          onChange={e => setSettings({...settings, [field]: e.target.value})}
        />
      ) : (
        <input 
          type={type}
          className="field-input w-full"
          value={settings[field] || ''}
          onChange={e => setSettings({...settings, [field]: e.target.value})}
        />
      )
    ) : (
      <div className="flex items-center group">
        <p className="text-[14px] font-bold text-[#0C0E10] py-1 border-b-2 border-transparent group-hover:border-[#95BF47]/30 transition-all">
          {value || <span className="text-[#D0D0CA] font-normal italic">Not specified</span>}
        </p>
      </div>
    )}
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    businessName: '', email: '', phone: '', telephone: '', address: '', 
    city: '', state: '', pincode: '', country: 'India', registeredOffice: '',
    gstin: '', pan: '', ieCode: '', cin: '', website: '', lutDetails: '',
    satelliteStation: '', bankName: '', accountName: '', accountNumber: '', 
    ifscCode: '', iban: '', swiftCode: '', invoicePrefix: 'INV', invoiceCounter: 1,
    fiscalYear: '', logoUrl: '', signatureUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('Business Profile');
  
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  // Refs for scrolling
  const sectionRefs = {
    'Business Profile': useRef(null),
    'Branding & Identity': useRef(null),
    'Invoice Defaults': useRef(null),
    'Bank Details': useRef(null)
  };

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
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch {
      toast.error('Error saving profile');
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

  const scrollToSection = (id) => {
    setActiveTab(id);
    sectionRefs[id].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const menuItems = [
    { id: 'Business Profile', icon: <Briefcase size={18}/>, emoji: '🏢' },
    { id: 'Branding & Identity', icon: <Palette size={18}/>, emoji: '🎨' },
    { id: 'Invoice Defaults', icon: <Hash size={18}/>, emoji: '#' },
    { id: 'Bank Details', icon: <Landmark size={18}/>, emoji: '🏦' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-[300px] border-r border-[#E4E4E0] bg-white flex flex-col p-6">
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-[#0C0E10] font-heading">Organization Details</h1>
          <p className="text-[13px] text-[#6B7280] mt-1 font-medium">Manage your business profile and invoice defaults</p>
        </div>

        <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[8px] transition-all group ${
                activeTab === item.id 
                ? 'bg-[#F3F8E8] text-[#95BF47] border border-[#95BF47]/20 shadow-sm' 
                : 'text-[#6B7280] hover:bg-[#FAFAF8] hover:text-[#0C0E10] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-lg transition-all ${
                  activeTab === item.id ? 'bg-white shadow-sm text-[#95BF47]' : 'text-[#D0D0CA] group-hover:text-[#6B7280]'
                }`}>
                  {item.icon}
                </span>
                <span className="text-[14px] font-bold tracking-tight">{item.id}</span>
              </div>
              <ChevronRight size={16} className={`transition-transform duration-300 ${activeTab === item.id ? 'rotate-90 text-[#95BF47]' : 'text-[#D0D0CA]'}`} />
            </button>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-[#E4E4E0]">
          <div className="bg-[#02172E] rounded-[10px] p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#95BF47] rounded-full flex items-center justify-center text-[14px] font-bold">P</div>
              <div className="flex-1">
                <p className="text-[12px] font-bold opacity-70">Professional Account</p>
                <p className="text-[13px] font-bold">Active Status</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="w-[85%] h-full bg-[#95BF47]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FAFAF8]">
        <div className="max-w-[900px] mx-auto py-12 px-8">
          <div className="flex justify-end mb-8 sticky top-0 z-10 py-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#E4E4E0] text-[#0C0E10] rounded-[8px] text-[14px] font-bold shadow-sm hover:bg-[#FAFAF8] transition-all"
              >
                <Edit3 size={16} />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white p-1.5 rounded-[10px] border border-[#E4E4E0] shadow-md">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 text-[#6B7280] hover:bg-[#FAFAF8] rounded-[6px] text-[14px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-2 bg-[#95BF47] text-white rounded-[6px] text-[14px] font-bold shadow-lg shadow-[#95BF47]/20 hover:bg-[#84ac3d] transition-all"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="space-y-10">
            {/* Business Profile */}
            <div ref={sectionRefs['Business Profile']} className="bg-white rounded-[15px] border border-[#E4E4E0] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[20px]">🏢</div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0C0E10] font-heading">Business Profile</h2>
                  <span className="text-[12px] text-[#6B7280] font-medium">Your core business identity</span>
                </div>
              </div>
              <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                <DataField label="Business Legal Name" value={settings.businessName} field="businessName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Email Address" value={settings.email} field="email" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Phone Number" value={settings.phone} field="phone" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Telephone No" value={settings.telephone} field="telephone" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Business Website" value={settings.website} field="website" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Street Address Display" value={settings.address} field="address" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="City" value={settings.city} field="city" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Postal Code" value={settings.pincode} field="pincode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="State / UT" value={settings.state} field="state" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Country" value={settings.country} field="country" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="GSTIN" value={settings.gstin} field="gstin" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="PAN Number" value={settings.pan} field="pan" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="IE Code" value={settings.ieCode} field="ieCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="CIN Number" value={settings.cin} field="cin" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="LUT Details" value={settings.lutDetails} field="lutDetails" type="textarea" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
              </div>
            </div>

            {/* Branding & Identity */}
            <div ref={sectionRefs['Branding & Identity']} className="bg-white rounded-[15px] border border-[#E4E4E0] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[20px]">🎨</div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0C0E10] font-heading">Branding & Identity</h2>
                  <span className="text-[12px] text-[#6B7280] font-medium">Logos and signatures for your invoices</span>
                </div>
              </div>
              <div className="p-8">
              <div className="flex gap-10">
                <div className="flex-1 space-y-3">
                  <label className="settings-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Company Logo</label>
                  <div 
                    onClick={() => logoInputRef.current.click()}
                    className="upload-zone w-full h-[180px] rounded-[5px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer border-[#E4E4E0] hover:border-[#95BF47] hover:bg-[#F3F8E8]"
                  >
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} className="w-full h-full object-contain p-4" alt="Logo"/>
                    ) : (
                      <div className="text-center">
                        <span className="text-[32px] text-[#D0D0CA] block mb-2">🖼</span>
                        <span className="text-[12px] font-bold text-[#6B7280]">Click to upload logo</span>
                      </div>
                    )}
                    <input type="file" ref={logoInputRef} className="hidden" onChange={e=>handleFileChange(e, 'logoUrl')}/>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <label className="settings-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Authorized Signature</label>
                  <div 
                    onClick={() => signatureInputRef.current.click()}
                    className="upload-zone w-full h-[180px] rounded-[5px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer border-[#E4E4E0] hover:border-[#95BF47] hover:bg-[#F3F8E8]"
                  >
                    {settings.signatureUrl ? (
                      <img src={settings.signatureUrl} className="w-full h-full object-contain p-4" alt="Signature"/>
                    ) : (
                      <div className="text-center">
                        <span className="text-[32px] text-[#D0D0CA] block mb-2">✒</span>
                        <span className="text-[12px] font-bold text-[#6B7280]">Click to upload signature</span>
                      </div>
                    )}
                    <input type="file" ref={signatureInputRef} className="hidden" onChange={e=>handleFileChange(e, 'signatureUrl')}/>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Invoice Defaults */}
            <div ref={sectionRefs['Invoice Defaults']} className="bg-white rounded-[15px] border border-[#E4E4E0] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[20px]">#</div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0C0E10] font-heading">Invoice Defaults</h2>
                  <span className="text-[12px] text-[#6B7280] font-medium">Standard numbering and prefixes</span>
                </div>
              </div>
              <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                <DataField label="Invoice Prefix" value={settings.invoicePrefix} field="invoicePrefix" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Starting Number" value={settings.invoiceCounter} field="invoiceCounter" type="text" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Fiscal Year" value={settings.fiscalYear} field="fiscalYear" placeholder="e.g. 2025-26" isEditing={isEditing} settings={settings} setSettings={setSettings} />
              </div>
            </div>

            {/* Bank Details */}
            <div ref={sectionRefs['Bank Details']} className="bg-white rounded-[15px] border border-[#E4E4E0] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[20px]">🏦</div>
                <div>
                  <h2 className="text-[18px] font-bold text-[#0C0E10] font-heading">Bank Details</h2>
                  <span className="text-[12px] text-[#6B7280] font-medium">Standard numbering and prefixes</span>
                </div>
              </div>
              <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                <DataField label="Bank Name" value={settings.bankName} field="bankName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Account Holder Name" value={settings.accountName} field="accountName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="Account Number" value={settings.accountNumber} field="accountNumber" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="IFSC Code" value={settings.ifscCode} field="ifscCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="IBAN Number" value={settings.iban} field="iban" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                <DataField label="SWIFT Code" value={settings.swiftCode} field="swiftCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
