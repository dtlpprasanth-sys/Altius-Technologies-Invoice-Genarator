import React, { useState, useEffect } from 'react';
import { X, User, Image as ImageIcon, ChevronDown, Check, Loader2, Landmark, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react';
import { clientApi } from '../services/api';
import { toast } from 'react-toastify';

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 
  'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 
  'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 
  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 
  'Zambia', 'Zimbabwe'
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

// Move FormField outside to prevent re-mounting and focus loss on every keystroke
const FormField = ({ label, field, type = 'text', placeholder, options, colSpan = "col-span-1", value, onChange }) => (
  <div className={`field-group ${colSpan}`}>
    <label className="field-label text-[11px] font-bold uppercase tracking-[0.15em] text-[#6B7280] mb-1.5 block">{label}</label>
    {options ? (
      <div className="relative">
        <select 
          className="field-input w-full appearance-none pr-10" 
          value={value || ''} 
          onChange={e => onChange(field, e.target.value)}
        >
          <option value="">Select {label}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
      </div>
    ) : type === 'textarea' ? (
      <textarea 
        rows={3} 
        className="field-input w-full resize-none py-3" 
        value={value || ''} 
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
      />
    ) : (
      <input 
        type={type}
        className="field-input w-full" 
        value={value || ''} 
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

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

  useEffect(() => {
    if (editingClient && isOpen) {
      setClientForm({
        ...initialFormState,
        ...editingClient,
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
        response = await clientApi.update(editingClient.id || editingClient._id, clientForm);
        toast.success('Client updated successfully');
      } else {
        response = await clientApi.create(clientForm);
        toast.success('Client registered successfully');
      }
      
      if (onSuccess) onSuccess(response.data);
      onClose();
      setClientForm(initialFormState);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save client.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = ['General', 'Contact & Address', 'Tax Info', 'Billing & Settings'];

  return (
    <div className="fixed inset-0 bg-[#02172E]/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-[5px] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh] border border-[#E4E4E0]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#E4E4E0] flex justify-between items-center bg-[#FAFAF8]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#02172E] rounded-[3px] flex items-center justify-center text-white shadow-lg shadow-navy/10">
              <Building2 size={20}/>
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-[#0C0E10] font-heading leading-tight">{editingClient ? 'Edit Client Profile' : 'New Client Registration'}</h2>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mt-0.5">Unified Business Management</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#0C0E10] transition-colors p-1">
            <X size={28}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E4E4E0] bg-white px-8 overflow-x-auto no-scrollbar gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-[13px] font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-[#0C0E10]' : 'text-[#6B7280] hover:text-[#0C0E10]'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#95BF47] rounded-t-[3px]" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          
          {activeTab === 'General' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-10 items-start">
                {/* Logo */}
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Client Logo</label>
                  <label className="w-32 h-32 bg-[#FAFAF8] border-2 border-dashed border-[#E4E4E0] rounded-[5px] flex flex-col items-center justify-center text-[#6B7280] cursor-pointer hover:border-[#95BF47] hover:bg-[#F3F8E8] transition-all group relative overflow-hidden">
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => handleChange('logo', e.target.files[0])}
                    />
                    {clientForm.logo ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white p-2">
                        <img 
                          src={typeof clientForm.logo === 'string' ? clientForm.logo : URL.createObjectURL(clientForm.logo)} 
                          alt="Logo Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="group-hover:text-[#95BF47] mb-2 transition-colors"/>
                        <span className="text-[11px] font-bold">Upload</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex-1 space-y-6">
                  {/* Type */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Entity Type</label>
                    <div className="flex gap-10">
                      {['Individual', 'Company'].map(type => (
                        <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                          <input 
                            type="radio" 
                            className="hidden" 
                            name="clientType"
                            checked={clientForm.clientType === type}
                            onChange={() => handleChange('clientType', type)}
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            clientForm.clientType === type ? 'border-[#95BF47] bg-[#F3F8E8]' : 'border-[#E4E4E0] group-hover:border-[#95BF47]/50'
                          }`}>
                            {clientForm.clientType === type && <div className="w-2.5 h-2.5 bg-[#95BF47] rounded-full shadow-sm"/>}
                          </div>
                          <span className={`text-[13px] font-bold transition-colors ${
                            clientForm.clientType === type ? 'text-[#0C0E10]' : 'text-[#6B7280]'
                          }`}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <FormField 
                    label="Business Name *" 
                    field="businessName" 
                    placeholder="e.g. Acme Corp" 
                    value={clientForm.businessName} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField 
                  label="Industry" 
                  field="industry" 
                  options={INDUSTRIES} 
                  value={clientForm.industry} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="Short Alias" 
                  field="alias" 
                  placeholder="Short Name" 
                  value={clientForm.alias} 
                  onChange={handleChange} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField 
                  label="Unique Client Key" 
                  field="uniqueKey" 
                  placeholder="e.g. C-102" 
                  value={clientForm.uniqueKey} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          )}

          {activeTab === 'Contact & Address' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FormField 
                    label="Email Address" 
                    field="email" 
                    placeholder="client@example.com" 
                    value={clientForm.email} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="space-y-4">
                  <FormField 
                    label="Phone Number" 
                    field="phone" 
                    placeholder="+91 00000 00000" 
                    value={clientForm.phone} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="h-px bg-[#E4E4E0] w-full" />

              <div className="grid grid-cols-2 gap-6">
                <FormField 
                  label="Country" 
                  field="country" 
                  options={COUNTRIES} 
                  value={clientForm.country} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="State / Province" 
                  field="state" 
                  options={STATES} 
                  value={clientForm.state} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="City/Town" 
                  field="city" 
                  value={clientForm.city} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="Postal Code" 
                  field="postalCode" 
                  value={clientForm.postalCode} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="Street Address" 
                  field="streetAddress" 
                  type="textarea" 
                  colSpan="col-span-2" 
                  value={clientForm.streetAddress} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          )}

          {activeTab === 'Tax Info' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <FormField 
                  label="GSTIN Number" 
                  field="gstin" 
                  placeholder="e.g. 22AAAAA0000A1Z5" 
                  value={clientForm.gstin} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="PAN Number" 
                  field="pan" 
                  placeholder="ABCDE1234F" 
                  value={clientForm.pan} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="Tax Treatment" 
                  field="taxTreatment" 
                  options={TAX_TREATMENTS} 
                  value={clientForm.taxTreatment} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          )}

          {activeTab === 'Billing & Settings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-6">
                <FormField 
                  label="Default Due Days" 
                  field="defaultDueDate" 
                  type="number" 
                  value={clientForm.defaultDueDate} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="Payment Account" 
                  field="paymentAccount" 
                  placeholder="Bank account details" 
                  value={clientForm.paymentAccount} 
                  onChange={handleChange} 
                />
                <FormField 
                  label="UPI ID" 
                  field="upiId" 
                  placeholder="e.g. business@okaxis" 
                  value={clientForm.upiId} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#E4E4E0] bg-[#FAFAF8] flex justify-end gap-3 sticky bottom-0">
          <button 
            onClick={onClose} 
            className="px-6 h-10 text-[13px] font-bold text-[#6B7280] hover:text-[#0C0E10] transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="btn-navy h-10 px-10 flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
            {editingClient ? 'Update Profile' : 'Save Client Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientRegistrationModal;
