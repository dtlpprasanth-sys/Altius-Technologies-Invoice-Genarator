import React, { useState, useEffect, useRef } from 'react';
import { settingsApi } from '../services/api';
import { toast } from 'react-toastify';
import { 
  Building2, Mail, Phone, Landmark, Hash, 
  Image as ImageIcon, Save, Upload, Edit3,
  Search, Bell, Palette, Briefcase, ChevronRight,
  User, Shield, CreditCard, Globe, Zap, Settings as SettingsIcon, PenTool,
  FileText, Plus, Trash2, X
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
    fiscalYear: '', logoUrl: '', signatureUrl: '', termsAndConditions: [],
    numberFormat: 'en-US', decimals: 2
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
    'Bank Details': useRef(null),
    'Terms & Conditions': useRef(null)
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
    { id: 'Terms & Conditions', icon: <FileText size={18}/>, emoji: '📝' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-[1200px] mx-auto py-8 px-8">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-[32px] font-bold text-[#0C0E10] font-heading">Organization Details</h1>
            <p className="text-[14px] text-[#6B7280] mt-1 font-medium">Manage your business profile and invoice defaults</p>
          </div>
          
          <div className="sticky top-6 z-10">
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
        </div>

        <div className="flex gap-6 items-start">
          {/* Compact Sticky Sidebar Card */}
          <div className="w-[280px] shrink-0 sticky top-12">
            <div className="bg-white border border-[#E4E4E0] rounded-[15px] p-2 shadow-sm">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] transition-all group border-l-4 ${
                      activeTab === item.id 
                      ? 'bg-[#F3F8E8] text-[#95BF47] border-[#95BF47]' 
                      : 'text-[#6B7280] hover:bg-[#FAFAF8] hover:text-[#0C0E10] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg transition-all ${
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
            </div>
          </div>

          {/* Settings Sections Container */}
          <div className="flex-1">
            <div className="space-y-6">
              {/* Business Profile */}
              <div ref={sectionRefs['Business Profile']} className="bg-white rounded-[12px] border border-[#E4E4E0] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[18px]">🏢</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0C0E10] font-heading">Business Profile</h2>
                    <span className="text-[11px] text-[#6B7280] font-medium">Your core business identity</span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                  <DataField label="Business Legal Name" value={settings.businessName} field="businessName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Email Address" value={settings.email} field="email" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Phone Number" value={settings.phone} field="phone" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Telephone No" value={settings.telephone} field="telephone" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Business Website" value={settings.website} field="website" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Registered Office Address" value={settings.registeredOffice} field="registeredOffice" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Street Address Display" value={settings.address} field="address" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="City" value={settings.city} field="city" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Postal Code" value={settings.pincode} field="pincode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="State / UT" value={settings.state} field="state" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Country" value={settings.country} field="country" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="GSTIN" value={settings.gstin} field="gstin" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="PAN Number" value={settings.pan} field="pan" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="IE Code" value={settings.ieCode} field="ieCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="CIN Number" value={settings.cin} field="cin" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Satellite Station" value={settings.satelliteStation} field="satelliteStation" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="LUT Details" value={settings.lutDetails} field="lutDetails" type="textarea" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                </div>
              </div>

              {/* Branding & Identity */}
              <div ref={sectionRefs['Branding & Identity']} className="bg-white rounded-[12px] border border-[#E4E4E0] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[18px]">🎨</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0C0E10] font-heading">Branding & Identity</h2>
                    <span className="text-[11px] text-[#6B7280] font-medium">Logos and signatures for your invoices</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex gap-8">
                    <div className="flex-1 space-y-3">
                      <label className="settings-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Company Logo</label>
                      <div 
                        onClick={() => isEditing && logoInputRef.current.click()}
                        className={`upload-zone w-full h-[180px] rounded-[5px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${isEditing ? 'cursor-pointer border-[#E4E4E0] hover:border-[#95BF47] hover:bg-[#F3F8E8]' : 'cursor-default border-[#F3F4F6]'}`}
                      >
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} className="w-full h-full object-contain p-4" alt="Logo"/>
                        ) : (
                          <div className="text-center">
                            <span className="text-[32px] text-[#D0D0CA] block mb-2">🖼</span>
                            <span className="text-[12px] font-bold text-[#6B7280]">{isEditing ? 'Click to upload logo' : 'No logo uploaded'}</span>
                          </div>
                        )}
                        <input type="file" ref={logoInputRef} className="hidden" onChange={e=>handleFileChange(e, 'logoUrl')}/>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <label className="settings-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280]">Authorized Signature</label>
                      <div 
                        onClick={() => isEditing && signatureInputRef.current.click()}
                        className={`upload-zone w-full h-[180px] rounded-[5px] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${isEditing ? 'cursor-pointer border-[#E4E4E0] hover:border-[#95BF47] hover:bg-[#F3F8E8]' : 'cursor-default border-[#F3F4F6]'}`}
                      >
                        {settings.signatureUrl ? (
                          <img src={settings.signatureUrl} className="w-full h-full object-contain p-4" alt="Signature"/>
                        ) : (
                          <div className="text-center">
                            <span className="text-[32px] text-[#D0D0CA] block mb-2">✒</span>
                            <span className="text-[12px] font-bold text-[#6B7280]">{isEditing ? 'Click to upload signature' : 'No signature uploaded'}</span>
                          </div>
                        )}
                        <input type="file" ref={signatureInputRef} className="hidden" onChange={e=>handleFileChange(e, 'signatureUrl')}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Defaults */}
              <div ref={sectionRefs['Invoice Defaults']} className="bg-white rounded-[12px] border border-[#E4E4E0] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[18px]">#</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0C0E10] font-heading">Invoice Defaults</h2>
                    <span className="text-[11px] text-[#6B7280] font-medium">Standard numbering and prefixes</span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                  <DataField label="Invoice Prefix" value={settings.invoicePrefix} field="invoicePrefix" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Starting Number" value={settings.invoiceCounter} field="invoiceCounter" type="text" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Fiscal Year" value={settings.fiscalYear} field="fiscalYear" placeholder="e.g. 2025-26" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  

                </div>
              </div>

              {/* Bank Details */}
              <div ref={sectionRefs['Bank Details']} className="bg-white rounded-[12px] border border-[#E4E4E0] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[18px]">🏦</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0C0E10] font-heading">Bank Details</h2>
                    <span className="text-[11px] text-[#6B7280] font-medium">Standard numbering and prefixes</span>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-6">
                  <DataField label="Bank Name" value={settings.bankName} field="bankName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Account Holder Name" value={settings.accountName} field="accountName" fullWidth isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="Account Number" value={settings.accountNumber} field="accountNumber" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="IFSC Code" value={settings.ifscCode} field="ifscCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="IBAN Number" value={settings.iban} field="iban" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                  <DataField label="SWIFT Code" value={settings.swiftCode} field="swiftCode" isEditing={isEditing} settings={settings} setSettings={setSettings} />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div ref={sectionRefs['Terms & Conditions']} className="bg-white rounded-[12px] border border-[#E4E4E0] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-[#E4E4E0] flex items-center justify-center text-[18px]">📝</div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[#0C0E10] font-heading">Terms & Conditions</h2>
                    <span className="text-[11px] text-[#6B7280] font-medium">Standard terms displayed on your invoices</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {(settings.termsAndConditions || []).map((term, index) => (
                      <div key={term.id || index} className="flex items-start gap-3 group/term">
                        <div className="flex-1">
                          {isEditing ? (
                            <textarea
                              className="w-full min-w-0 border border-[#E4E4E0] rounded-[5px] px-3 py-2 text-sm font-medium outline-none transition-all focus:border-[#95BF47] focus:ring-4 focus:ring-[#95BF47]/10 bg-white min-h-[80px] resize-none"
                              value={term.text || ''}
                              onChange={(e) => {
                                const newTerms = [...settings.termsAndConditions];
                                newTerms[index].text = e.target.value;
                                setSettings({ ...settings, termsAndConditions: newTerms });
                              }}
                              placeholder={`Term #${index + 1}`}
                            />
                          ) : (
                            <div className="flex items-start gap-2 group/text">
                              <span className="text-[14px] font-bold text-[#95BF47] mt-1">{index + 1}.</span>
                              <p className="text-[14px] font-medium text-[#0C0E10] leading-relaxed">
                                {term.text || <span className="text-[#D0D0CA] font-normal italic">No text</span>}
                              </p>
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const newTerms = settings.termsAndConditions.filter((_, i) => i !== index);
                              setSettings({ ...settings, termsAndConditions: newTerms });
                            }}
                            className="p-2 text-[#D0D0CA] hover:text-red-500 hover:bg-red-50 transition-all rounded-[6px]"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}

                    {isEditing && (
                      <button
                        onClick={() => {
                          const newTerms = [...(settings.termsAndConditions || []), { id: Date.now(), text: '' }];
                          setSettings({ ...settings, termsAndConditions: newTerms });
                        }}
                        className="flex items-center gap-2 text-[#95BF47] text-[14px] font-bold hover:bg-[#F3F8E8] px-4 py-2 rounded-[8px] transition-all border border-dashed border-[#95BF47]/30"
                      >
                        <Plus size={16} />
                        Add New Term
                      </button>
                    )}

                    {!isEditing && (!settings.termsAndConditions || settings.termsAndConditions.length === 0) && (
                      <div className="p-8 text-center bg-[#FAFAF8] rounded-[12px] border border-dashed border-[#E4E4E0]">
                        <p className="text-[13px] font-medium text-[#6B7280]">No terms and conditions added yet.</p>
                      </div>
                    )}
                  </div>
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
