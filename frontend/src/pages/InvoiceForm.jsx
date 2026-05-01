import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceApi, clientApi, settingsApi, productApi, unitApi } from '../services/api';
import { formatCurrency as baseFormat, numberToWords } from '../utils/helpers';
import { toast } from 'react-toastify';
import {
  Plus, Trash2, X, ChevronDown, FileText, 
  Building2, Calendar, Hash, Eye, Check,
  Zap, PlusCircle, ImagePlus, Globe, Mail, Phone, MapPin, 
  Briefcase, Landmark, Info
} from 'lucide-react';
import ClientRegistrationModal from '../components/ClientRegistrationModal';
import ProductRegistrationModal from '../components/ProductRegistrationModal';

const EXPORT_TYPES = [
  'Data Entry and conversion, Software processing, RBI Code: 907',
  'Software Development Services',
  'Consultancy Services',
  'Hardware Maintenance',
  'Other IT Enabled Services'
];

const defaultItem = () => ({ 
  id: Date.now() + Math.random(), 
  name: '', hsn: '', quantity: 1, rate: 0, 
  amount: 0, unit: 'per SKU'
});

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoiceStatus, setInvoiceStatus] = useState('draft');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [activeProductSearchId, setActiveProductSearchId] = useState(null);
  const [isBilledByModalOpen, setIsBilledByModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalTriggerRowId, setModalTriggerRowId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const [billedByDetails, setBilledByDetails] = useState({ 
    businessName: '', country: 'India', city: '', gstin: '', pan: '', 
    state: '', postalCode: '', streetAddress: '', email: '', phone: '', lutDetails: ''
  });

  const [form, setForm] = useState({
    header: {
      title: 'Export Invoice', 
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10), 
      dueDate: '', 
      logo: '',
      poNoAndDate: '',
      subtitle: ''
    },
    items: [defaultItem()],
    totals: { 
      bankCharges: 0,
      terms: [],
      exchangeRate: '0',
      exportType: EXPORT_TYPES[0],
      signature: ''
    },
    settings: {
      currency: 'USD', 
      currencySymbol: '$', 
      numberFormat: 'en-US'
    }
  });

  const calculate = useCallback(() => {
    let subtotal = 0;
    const items = form.items.map(it => {
      const amt = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
      subtotal += amt;
      return { ...it, amount: amt };
    });
    const total = subtotal + Number(form.totals.bankCharges || 0);
    const totalInInr = total * Number(form.totals.exchangeRate || 1);
    return { subtotal, total, totalInInr, items, totalInWords: numberToWords(total, form.settings.currency) };
  }, [form.items, form.totals, form.settings]);

  const live = calculate();
  const isSubmitted = invoiceStatus === 'sent';

  useEffect(() => {
    const init = async () => {
      try {
        const [sRes, cRes, pRes, uRes] = await Promise.all([
          settingsApi.get(), clientApi.getAll(), productApi.getAll(), unitApi.getAll()
        ]);
        setClients(cRes.data);
        setProducts(pRes.data || []);
        setUnits(uRes.data || []);
        const s = sRes.data;
        if (s) {
          setBilledByDetails({
            businessName: s.businessName, country: s.country, city: s.city, 
            gstin: s.gstin, pan: s.pan, state: s.state, postalCode: s.pincode,
            streetAddress: s.address, email: s.email, phone: s.phone, lutDetails: s.lutDetails
          });
          if (!id) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const fy = month >= 4 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
            const invNo = `${s.invoicePrefix || 'INV'}-${String(s.invoiceCounter || 1).padStart(3, '0')}/${fy}`;

            setForm(f => ({
              ...f,
              header: { 
                ...f.header, 
                logo: s.logoUrl, 
                invoiceNumber: invNo,
                subtitle: s.lutDetails || ''
              },
              totals: {
                ...f.totals,
                signature: s.signatureUrl,
                exportType: ''
              },
              settings: { ...f.settings, currency: s.currency || 'USD' }
            }));
          }
        }
        if (id) {
          const { data } = await invoiceApi.getById(id);
          setForm(prev => ({ 
            ...prev,
            header: {
              title: data.invoiceTitle || 'Export Invoice',
              invoiceNumber: data.invoiceNumber || '',
              invoiceDate: data.invoiceDate ? new Date(data.invoiceDate).toISOString().slice(0, 10) : '',
              dueDate: data.dueDate ? new Date(data.dueDate).toISOString().slice(0, 10) : '',
              logo: data.logoUrl || '',
              poNoAndDate: data.poNoAndDate || '',
              subtitle: data.invoiceSubTitle || ''
            },
            items: data.items && data.items.length > 0 ? data.items : [defaultItem()],
            totals: {
              bankCharges: data.bankCharges || 0,
              terms: data.terms || [],
              exchangeRate: data.exchangeRate || '0',
              exportType: data.softwareExportType || EXPORT_TYPES[0],
              signature: data.signatureUrl || ''
            },
            settings: {
              ...prev.settings,
              currency: data.currency || 'USD'
            }
          }));
          if (data.businessDetails) setBilledByDetails(data.businessDetails);
          setInvoiceStatus(data.status || 'draft');
          if (data.clientId || (data.clientDetails && data.clientDetails.id)) {
            const searchId = data.clientId || data.clientDetails.id;
            const found = cRes.data.find(c => (c.id || c._id) === searchId);
            if (found) setSelectedClient(found);
          }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  const handleSave = async (status = 'draft', action = 'save') => {
    try {
      const payload = { 
        ...form, 
        ...live, 
        status, 
        totalInINR: live.totalInInr,
        invoiceNumber: form.header.invoiceNumber,
        invoiceTitle: form.header.title,
        invoiceSubTitle: form.header.subtitle,
        invoiceDate: form.header.invoiceDate || new Date().toISOString(),
        dueDate: form.header.dueDate || null,
        poNoAndDate: form.header.poNoAndDate,
        logoUrl: form.header.logo,
        signatureUrl: form.totals.signature,
        bankCharges: form.totals.bankCharges,
        exchangeRate: form.totals.exchangeRate,
        softwareExportType: form.totals.exportType,
        terms: form.totals.terms,
        currency: form.settings.currency,
        businessDetails: billedByDetails,
        clientDetails: selectedClient ? {
          name: selectedClient.businessName,
          address: selectedClient.streetAddress || selectedClient.address,
          city: selectedClient.city,
          state: selectedClient.state,
          country: selectedClient.country,
          postalCode: selectedClient.postalCode,
          gstin: selectedClient.gstin,
          email: selectedClient.email,
          phone: selectedClient.phone,
          id: selectedClient.id || selectedClient._id
        } : null,
        clientName: selectedClient?.businessName || 'Draft',
        clientId: selectedClient ? (selectedClient.id || selectedClient._id) : null
      };
      let savedInvoice;
      if (id) {
        savedInvoice = await invoiceApi.update(id, payload);
      } else {
        savedInvoice = await invoiceApi.create(payload);
      }
      
      const invoiceId = id || (savedInvoice.data && (savedInvoice.data.id || savedInvoice.data._id));
      
      if (action === 'preview' && invoiceId) {
        toast.success('Invoice saved. Opening preview...');
        navigate(`/invoices/${invoiceId}`);
      } else {
        toast.success(status === 'draft' ? 'Invoice saved as draft' : 'Invoice submitted successfully');
        navigate('/invoices');
      }
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error saving invoice'); 
    }
  };

  const updateItem = (itemId, field, value) => {
    setForm(f => ({ ...f, items: f.items.map(it => it.id === itemId ? { ...it, [field]: value } : it) }));
  };

  const deleteItem = (itemId) => {
    if (form.items.length > 1) {
      setForm(f => ({ ...f, items: f.items.filter(it => it.id !== itemId) }));
    } else {
      toast.info('Invoice must have at least one item');
    }
  };

  const handleFileChange = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') {
          setForm(f => ({ ...f, header: { ...f.header, logo: reader.result } }));
        } else {
          setForm(f => ({ ...f, totals: { ...f.totals, signature: reader.result } }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#FAFAF8]"><div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] font-sans pb-24">
      
      {/* CREATE HEADER */}
      <div className="h-14 bg-white border-b border-[#E4E4E0] flex flex-col items-center justify-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-bold text-[#0C0E10] font-heading">
            {id ? (isSubmitted ? 'Invoice Details' : 'Edit Invoice') : 'Create New Invoice'}
          </h2>
          {isSubmitted && (
            <span className="px-2.5 py-0.5 bg-[#F3F8E8] text-[#95BF47] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#95BF47]/30 flex items-center gap-1">
              <Check size={10} /> Submitted
            </span>
          )}
        </div>
        <p className="text-[12px] text-[#6B7280] font-medium mt-0.5">{isSubmitted ? 'Finalized Record' : '① Add Invoice Details'}</p>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-6 py-6">
        <div className="flex flex-col gap-3">
          
          {/* BLOCK 1: IDENTITY */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px]">
            <div className="p-6">
              <div className="flex justify-between items-start gap-8">
                <div className="flex-1">
                  <div 
                    className={`text-[22px] font-bold text-[#0C0E10] font-heading border-b border-transparent ${isSubmitted ? '' : 'hover:border-[#95BF47] cursor-text'} pb-0.5 transition-all`}
                    contentEditable={!isSubmitted}
                    suppressContentEditableWarning
                    onBlur={e => setForm({...form, header: {...form.header, title: e.target.innerText}})}
                  >
                    {form.header.title}
                  </div>
                  <div className="mt-1">
                    <textarea 
                      className={`text-[13px] font-medium text-[#95BF47] ${isSubmitted ? '' : 'hover:underline'} bg-transparent border-none outline-none resize-none w-full leading-relaxed`}
                      value={form.header.subtitle}
                      disabled={isSubmitted}
                      rows={1}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = el.scrollHeight + 'px';
                        }
                      }}
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onChange={e => setForm({...form, header: {...form.header, subtitle: e.target.value}})}
                      placeholder="+ Add Subtitle / LUT Details"
                    />
                  </div>
                </div>
                <div 
                  onClick={() => !isSubmitted && logoInputRef.current.click()}
                  className={`w-[140px] h-[80px] border border-dashed border-[#E4E4E0] rounded-[5px] flex flex-col items-center justify-center gap-1 transition-all flex-shrink-0 overflow-hidden ${isSubmitted ? 'cursor-default' : 'cursor-pointer hover:bg-[#FAFAF8]'}`}
                >
                  {form.header.logo ? (
                    <img src={form.header.logo} className="w-full h-full object-contain p-2" alt="Logo"/>
                  ) : (
                    <>
                      <span className="text-[20px] text-[#6B7280]">🖼</span>
                      <span className="text-[12px] text-[#6B7280]">Add Logo</span>
                    </>
                  )}
                  <input type="file" ref={logoInputRef} className="hidden" onChange={e => !isSubmitted && handleFileChange(e, 'logo')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px] mb-1">Invoice No *</label>
                  <input 
                    className="h-10 border border-[#E4E4E0] rounded-[5px] px-3 text-[14px] font-bold text-[#0C0E10] outline-none focus:border-[#95BF47] disabled:bg-[#FAFAF8] disabled:cursor-default" 
                    value={form.header.invoiceNumber} 
                    disabled={isSubmitted}
                    onChange={e => setForm({...form, header: {...form.header, invoiceNumber: e.target.value}})}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px] mb-1">Invoice Date *</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full h-10 border border-[#E4E4E0] rounded-[5px] px-3 pr-10 text-[14px] font-bold text-[#0C0E10] outline-none focus:border-[#95BF47] disabled:bg-[#FAFAF8] disabled:cursor-default"
                      value={form.header.invoiceDate}
                      disabled={isSubmitted}
                      onChange={e => setForm({...form, header: {...form.header, invoiceDate: e.target.value}})}
                    />
                    {form.header.invoiceDate && !isSubmitted && (
                      <button 
                        onClick={() => setForm({...form, header: {...form.header, invoiceDate: ''}})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#CC3A3A]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px] mb-1">Due Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full h-10 border border-[#E4E4E0] rounded-[5px] px-3 pr-10 text-[14px] font-bold text-[#0C0E10] outline-none focus:border-[#95BF47]"
                      value={form.header.dueDate}
                      onChange={e => setForm({...form, header: {...form.header, dueDate: e.target.value}})}
                    />
                    {form.header.dueDate && (
                      <button 
                        onClick={() => setForm({...form, header: {...form.header, dueDate: ''}})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#CC3A3A]"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px] mb-1">PO No & Date</label>
                  <input 
                    className="h-10 border border-[#E4E4E0] rounded-[5px] px-3 text-[14px] font-bold text-[#0C0E10] outline-none focus:border-[#95BF47]"
                    placeholder="Purchase order ref"
                    value={form.header.poNoAndDate}
                    onChange={e => setForm({...form, header: {...form.header, poNoAndDate: e.target.value}})}
                  />
                </div>
              </div>

              <div className="flex flex-col mt-2">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px] mb-1">Export Type</label>
                <input 
                  className="h-11 border border-[#E4E4E0] rounded-[5px] px-3.5 text-[13px] font-bold text-[#0C0E10] outline-none focus:border-[#95BF47] bg-[#F3F8E8]/30 disabled:bg-[#FAFAF8] disabled:cursor-default"
                  value={form.totals.exportType}
                  disabled={isSubmitted}
                  placeholder="Enter export type details..."
                  onChange={e => setForm({...form, totals: {...form.totals, exportType: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* BLOCK 2: BILLED BY/TO */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[#E4E4E0]">
              <div className="p-5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Billed By</label>
                <div 
                  className={`mt-2 h-10 border border-[#E4E4E0] rounded-[5px] flex items-center gap-2.5 px-3 transition-all ${isSubmitted ? 'bg-[#FAFAF8] cursor-default' : 'cursor-pointer hover:border-[#D0D0CA] bg-white'}`} 
                  onClick={() => !isSubmitted && setIsBilledByModalOpen(true)}
                >
                  <div className="w-6 h-6 bg-[#02172E] rounded-[3px] flex items-center justify-center text-white text-[12px] font-bold">P</div>
                  <span className="text-[14px] font-bold text-[#0C0E10] flex-1 truncate">{billedByDetails.businessName || 'Praba'}</span>
                  <span className="text-[14px] text-[#6B7280]">⌄</span>
                </div>
                <div className="mt-3 space-y-1">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Business Details</label>
                  <p className="text-[14px] font-bold text-[#0C0E10] mt-1">{billedByDetails.businessName}</p>
                  <div className="text-[13px] text-[#6B7280] space-y-0.5 leading-relaxed">
                    <p>{billedByDetails.streetAddress}</p>
                    <p>{billedByDetails.city}, {billedByDetails.state} - {billedByDetails.postalCode}</p>
                    <p>{billedByDetails.country}</p>
                  </div>
                  <button className="text-[13px] font-medium text-[#95BF47] hover:underline mt-1.5" onClick={() => navigate('/settings')}>✎ Edit Profile</button>
                </div>
              </div>

              <div className="p-5">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Billed To</label>
                
                {!selectedClient ? (
                  <>
                    <div className="relative mt-2">
                      <select 
                        className={`w-full h-10 border border-[#E4E4E0] rounded-[5px] px-3 text-[14px] font-bold text-[#0C0E10] outline-none appearance-none bg-white ${isSubmitted ? 'cursor-default bg-[#FAFAF8]' : 'focus:border-[#95BF47] cursor-pointer'}`}
                        value=""
                        disabled={isSubmitted}
                        onChange={e => {
                          const client = clients.find(c => (c.id || c._id) === e.target.value);
                          setSelectedClient(client);
                        }}
                      >
                        <option value="">Select a Client</option>
                        {clients.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.businessName}</option>)}
                      </select>
                      {!isSubmitted && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">⌄</span>}
                    </div>
                    <p className="text-[13px] text-[#6B7280] mt-2">Select Client/Business from the list</p>
                    
                    <div className="flex items-center gap-2 my-3 text-[12px] text-[#D0D0CA] font-bold uppercase tracking-widest">
                      <div className="flex-1 h-px bg-[#E4E4E0]"></div>
                      <span>OR</span>
                      <div className="flex-1 h-px bg-[#E4E4E0]"></div>
                    </div>

                    <button 
                      onClick={() => setIsClientModalOpen(true)}
                      className="w-full h-10 bg-[#02172E] text-white rounded-[5px] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-[#03203d] transition-all"
                    >
                      + Add New Client
                    </button>
                  </>
                ) : (
                  <div className="mt-2 h-10 border border-[#95BF47] bg-[#F3F8E8] rounded-[5px] flex items-center gap-2.5 px-3">
                    <div className="w-6 h-6 bg-[#95BF47] rounded-[3px] flex items-center justify-center text-[#02172E] text-[12px] font-bold">
                      {selectedClient.businessName.charAt(0)}
                    </div>
                    <span className="text-[14px] font-bold text-[#0C0E10] flex-1 truncate">{selectedClient.businessName}</span>
                    {!isSubmitted && (
                      <button 
                        onClick={() => setSelectedClient(null)}
                        className="text-[#6B7280] hover:text-[#CC3A3A] transition-all"
                        title="Clear selection"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}

                {selectedClient && (
                  <div className="mt-4 pt-4 border-t border-[#E4E4E0] animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Client Details</label>
                      {!isSubmitted && (
                        <button 
                          onClick={() => setIsClientModalOpen(true)}
                          className="text-[12px] font-bold text-[#95BF47] hover:underline"
                        >
                          ✎ Edit Client
                        </button>
                      )}
                    </div>
                    <div className="text-[14px] font-bold text-[#0C0E10]">{selectedClient.businessName}</div>
                    <div className="mt-1 text-[13px] text-[#6B7280] space-y-0.5 leading-relaxed">
                      <p>{selectedClient.streetAddress || selectedClient.address}</p>
                      <p>{selectedClient.city}, {selectedClient.state} - {selectedClient.postalCode}</p>
                      <p>{selectedClient.country}</p>
                      {selectedClient.gstin && <p className="mt-1 font-medium text-[#0C0E10]">GSTIN: {selectedClient.gstin}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BLOCK 3: CURRENCY */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px]">
            <div className="p-4 px-5 flex items-center justify-between">
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Currency *</label>
                <div className="relative mt-1">
                  <select 
                    className={`w-[320px] h-10 border border-[#E4E4E0] rounded-[5px] px-3 text-[13px] font-bold text-[#0C0E10] outline-none appearance-none bg-white ${isSubmitted ? 'cursor-default bg-[#FAFAF8]' : 'focus:border-[#95BF47] cursor-pointer'}`}
                    value={form.settings.currency}
                    disabled={isSubmitted}
                    onChange={e => {
                      const val = e.target.value;
                      const symbols = {
                        'USD': '$', 'EUR': '€', 'INR': '₹', 'GBP': '£', 'JPY': '¥', 
                        'CAD': 'CA$', 'AUD': 'A$', 'SGD': 'S$', 'CHF': 'Fr', 'AED': 'DH',
                        'SAR': 'SR', 'QAR': 'QR', 'OMR': 'RO', 'BHD': 'BD', 'KWD': 'KD'
                      };
                      setForm({...form, settings: {...form.settings, currency: val, currencySymbol: symbols[val] || '$'}});
                    }}
                  >
                    <option value="USD">United States Dollar (USD, $)</option>
                    <option value="EUR">Euro (EUR, €)</option>
                    <option value="INR">Indian Rupee (INR, ₹)</option>
                    <option value="GBP">British Pound (GBP, £)</option>
                    <option value="JPY">Japanese Yen (JPY, ¥)</option>
                    <option value="CAD">Canadian Dollar (CAD, CA$)</option>
                    <option value="AUD">Australian Dollar (AUD, A$)</option>
                    <option value="SGD">Singapore Dollar (SGD, S$)</option>
                    <option value="CHF">Swiss Franc (CHF, Fr)</option>
                    <option value="AED">UAE Dirham (AED, DH)</option>
                    <option value="SAR">Saudi Riyal (SAR, SR)</option>
                    <option value="QAR">Qatari Riyal (QAR, QR)</option>
                    <option value="OMR">Omani Rial (OMR, RO)</option>
                    <option value="BHD">Bahraini Dinar (BHD, BD)</option>
                    <option value="KWD">Kuwaiti Dinar (KWD, KD)</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">⌄</span>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Number Format</label>
                <div className="relative mt-1">
                  <select 
                    className="w-[180px] h-10 border border-[#E4E4E0] rounded-[5px] px-3 text-[13px] font-bold text-[#0C0E10] outline-none appearance-none bg-white cursor-pointer"
                    value={form.settings.decimals || 2}
                    onChange={e => setForm({...form, settings: {...form.settings, decimals: parseInt(e.target.value)}})}
                  >
                    <option value="0">0 (1234)</option>
                    <option value="1">1 (1234.5)</option>
                    <option value="2">2 (1234.56)</option>
                    <option value="3">3 (1234.567)</option>
                    <option value="4">4 (1234.5678)</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none">⌄</span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK 4: LINE ITEMS */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#02172E] text-white">
                <tr>
                  <th className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider w-[40px]">#</th>
                  <th className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider">Item</th>
                  <th className="px-3 h-12 text-[11px] font-bold uppercase tracking-wider w-[100px] text-center">HSN/SAC</th>
                  <th className="px-3 h-12 text-[11px] font-bold uppercase tracking-wider w-[100px] text-center">Qty</th>
                  <th className="px-3 h-12 text-[11px] font-bold uppercase tracking-wider w-[160px] text-right">Rate</th>
                  <th className="px-3 h-12 text-[11px] font-bold uppercase tracking-wider w-[120px] text-right">Amount</th>
                  <th className="px-4 h-12 text-[11px] font-bold uppercase tracking-wider w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E0]">
                {form.items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#F3F8E8] group transition-all align-top">
                    <td className="p-4 px-4 text-[14px] text-[#6B7280] font-medium">
                      {index + 1}.
                    </td>
                    <td className="p-4 px-4 space-y-3">
                      <div className="relative group/item">
                        <div className="flex items-center gap-2">
                          <input 
                            className="w-full text-[14px] text-[#0C0E10] font-medium outline-none bg-transparent placeholder:text-[#D0D0CA]"
                            placeholder="Item Name / SKU Id"
                            value={item.name}
                            onFocus={() => setActiveProductSearchId(item.id)}
                            onChange={e => {
                              const val = e.target.value;
                              updateItem(item.id, 'name', val);
                              setActiveProductSearchId(item.id);
                            }}
                          />
                          {item.name ? (
                            <button
                              type="button"
                              className="text-[#D0D0CA] hover:text-[#EF4444] transition-colors p-1 rounded-full hover:bg-[#FEF2F2]"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateItem(item.id, 'name', '');
                                updateItem(item.id, 'rate', 0);
                                updateItem(item.id, 'hsn', '');
                                setActiveProductSearchId(null);
                              }}
                              title="Clear Item"
                            >
                              <X size={14} />
                            </button>
                          ) : (
                            <ChevronDown size={14} className="text-[#D0D0CA] group-focus-within:text-[#95BF47] transition-colors pointer-events-none" />
                          )}
                        </div>

                        {activeProductSearchId === item.id && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-[#E4E4E0] rounded-[8px] shadow-xl z-50 overflow-hidden max-h-[320px] overflow-y-auto custom-scrollbar">
                            <div className="p-2 border-b border-[#FAFAF8] bg-[#FAFAF8]/50 flex items-center justify-between">
                              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider px-2">Select Product</p>
                              <button 
                                type="button"
                                className="text-[#6B7280] hover:text-[#0C0E10] p-1 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveProductSearchId(null);
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                            {products
                              .filter(p => !item.name || p.name.toLowerCase().includes(item.name.toLowerCase()))
                              .slice(0, 10)
                              .map(p => (
                                <button
                                  key={p.id || p._id}
                                  className="w-full text-left px-4 py-3 hover:bg-[#F3F8E8] transition-all flex items-center justify-between group/opt border-b border-[#FAFAF8] last:border-0"
                                  onClick={() => {
                                    updateItem(item.id, 'name', p.name);
                                    updateItem(item.id, 'rate', p.price || p.rate || 0);
                                    if (p.hsnCode) updateItem(item.id, 'hsn', p.hsnCode);
                                    setActiveProductSearchId(null);
                                  }}
                                >
                                  <div>
                                    <p className="text-[14px] font-bold text-[#0C0E10] group-hover/opt:text-[#95BF47]">{p.name}</p>
                                    {p.hsnCode && <p className="text-[11px] text-[#6B7280]">HSN: {p.hsnCode}</p>}
                                  </div>
                                </button>
                              ))
                            }
                            <div className="p-2 bg-[#FAFAF8] border-t border-[#E4E4E0]">
                              <button 
                                className="w-full py-2 text-[12px] font-bold text-[#95BF47] hover:bg-white rounded-[4px] border border-dashed border-[#95BF47]/30 transition-all flex items-center justify-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setModalTriggerRowId(item.id);
                                  setIsProductModalOpen(true);
                                  setActiveProductSearchId(null);
                                }}
                              >
                                <Plus size={14} /> Add New Product to Master
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Unit</span>
                        {item.isCustomUnit ? (
                          <div className="flex items-center gap-1">
                            <input 
                              autoFocus
                              className="h-8 border border-[#95BF47] rounded-[4px] px-2 text-[12px] font-medium text-[#0C0E10] outline-none w-[100px]"
                              placeholder="Type unit..."
                              value={item.unit || ''}
                              onChange={e => updateItem(item.id, 'unit', e.target.value)}
                              onBlur={async (e) => {
                                if (!e.target.value) {
                                  updateItem(item.id, 'isCustomUnit', false);
                                } else {
                                  // Save new unit if it doesn't exist
                                  const exists = units.some(u => u.name.toLowerCase() === e.target.value.toLowerCase());
                                  if (!exists) {
                                    try {
                                      const res = await unitApi.create({ name: e.target.value });
                                      setUnits(prev => [...prev, res.data]);
                                    } catch (err) { console.error(err); }
                                  }
                                }
                              }}
                            />
                            <button 
                              onClick={() => {
                                updateItem(item.id, 'isCustomUnit', false);
                                updateItem(item.id, 'unit', 'Product');
                              }}
                              className="text-[#6B7280] hover:text-[#0C0E10] p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <select 
                            className="h-8 border border-[#E4E4E0] rounded-[4px] px-2 text-[12px] font-medium text-[#0C0E10] outline-none bg-white cursor-pointer"
                            value={item.unit || 'Product'}
                            onChange={e => {
                              if (e.target.value === 'CUSTOM') {
                                updateItem(item.id, 'isCustomUnit', true);
                                updateItem(item.id, 'unit', '');
                              } else {
                                updateItem(item.id, 'unit', e.target.value);
                              }
                            }}
                          >
                            <option value="Product">Product</option>
                            <option value="Service">Service</option>
                            <option value="Hours">Hours</option>
                            <option value="Days">Days</option>
                            <option value="Box">Box</option>
                            <option value="Nos">Nos</option>
                            {units.filter(u => !['Product', 'Service', 'Hours', 'Days', 'Box', 'Nos'].includes(u.name)).map(u => (
                              <option key={u.id || u._id} value={u.name}>{u.name}</option>
                            ))}
                            <option value="CUSTOM">+ Custom</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4 px-3">
                      <input 
                        className="w-full text-[14px] text-[#6B7280] text-center outline-none bg-transparent"
                        placeholder="#"
                        value={item.hsn}
                        onChange={e => updateItem(item.id, 'hsn', e.target.value)}
                      />
                    </td>
                    <td className="p-4 px-3">
                      <input 
                        className="w-full text-[14px] text-[#0C0E10] font-bold text-center outline-none bg-transparent"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                      />
                    </td>
                    <td className="p-4 px-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[14px] text-[#6B7280]">{form.settings.currencySymbol}</span>
                        <input 
                          className="w-[80px] text-[14px] text-[#0C0E10] font-bold text-right outline-none bg-transparent disabled:cursor-default"
                          placeholder="0.00"
                          value={item.rate}
                          disabled={isSubmitted}
                          onChange={e => updateItem(item.id, 'rate', e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="p-4 px-3 text-right text-[14px] font-bold text-[#0C0E10]">
                      {baseFormat((Number(item.quantity) || 0) * (Number(item.rate) || 0), form.settings.currency)}
                    </td>
                    <td className="p-4 px-4 text-center">
                      {!isSubmitted && (
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="text-[#9CA3AF] hover:text-[#EF4444] transition-all p-1.5 hover:bg-[#FEF2F2] rounded-full"
                          title="Remove Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isSubmitted && (
              <button 
                className="p-4 px-6 text-[13px] font-bold text-[#95BF47] hover:underline flex items-center gap-2"
                onClick={() => setForm(f => ({...f, items: [...f.items, defaultItem()]}))}
              >
                ＋ Add New Line
              </button>
            )}
          </div>

          {/* BLOCK 5: TOTALS */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px]">
            <div className="p-6">
              <div className="max-w-[360px] ml-auto space-y-3">
                <div className="text-[15px] font-bold text-[#0C0E10] font-heading mb-3">Total in PDF</div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[#6B7280]">Amount</span>
                  <span className="text-[#0C0E10] font-medium">{baseFormat(live.subtotal, form.settings.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-[#6B7280]">Bank Charges</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#6B7280]">{form.settings.currencySymbol}</span>
                    <input 
                      className="w-20 h-8 border border-[#E4E4E0] rounded-[5px] px-2 text-[13px] font-bold text-right outline-none focus:border-[#95BF47] disabled:bg-[#FAFAF8] disabled:cursor-default"
                      value={form.totals.bankCharges}
                      disabled={isSubmitted}
                      onChange={e => setForm({...form, totals: {...form.totals, bankCharges: e.target.value}})}
                    />
                  </div>
                </div>
                <div className="h-px bg-[#E4E4E0] my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[20px] font-bold text-[#0C0E10] font-heading">Total ({form.settings.currency})</span>
                  <span className="text-[20px] font-bold text-[#0C0E10] font-heading">{baseFormat(live.total, form.settings.currency)}</span>
                </div>
                
                <div className="flex justify-between items-center text-[13px] mt-2">
                  <span className="text-[#6B7280]">Conversion Rate (to INR)</span>
                  <div className="flex items-center gap-1">
                    <input 
                      className="w-[60px] h-8 border border-[#E4E4E0] rounded-[5px] px-2 text-[13px] font-bold text-center outline-none focus:border-[#95BF47] disabled:bg-[#FAFAF8]"
                      value={form.totals.exchangeRate}
                      disabled={isSubmitted}
                      onChange={e => setForm({...form, totals: {...form.totals, exchangeRate: e.target.value}})}
                    />
                    <span className="bg-[#F3F8E8] border border-[#E4E4E0] rounded-[3px] text-[12px] text-[#6B7280] font-bold px-1.5 py-0.5">INR</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">Total (INR)</span>
                  <span className="text-[14px] font-bold text-[#0C0E10]">₹{live.totalInInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="pt-3">
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-[1.5px]">Total in Words</span>
                  <p className="text-[13px] text-[#6B7280] italic mt-1">{live.totalInWords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOCK 6: SIGNATURE */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px] p-6">
            <div 
              onClick={() => !isSubmitted && signatureInputRef.current.click()}
              className={`h-28 border border-dashed border-[#E4E4E0] rounded-[5px] flex items-center justify-center gap-2 transition-all overflow-hidden ${isSubmitted ? 'cursor-default' : 'cursor-pointer hover:bg-[#F3F8E8] hover:border-[#95BF47]'}`}
            >
              {form.totals.signature ? (
                <img src={form.totals.signature} className="h-full object-contain p-2" alt="Signature"/>
              ) : (
                <>
                  <span className="text-[20px] text-[#6B7280]">✒</span>
                  <span className="text-[13px] font-bold text-[#95BF47]">Add Authorized Signature</span>
                </>
              )}
              <input type="file" ref={signatureInputRef} className="hidden" onChange={e => handleFileChange(e, 'signature')} />
            </div>
          </div>

          {/* BLOCK 7: TERMS */}
          <div className="bg-white border border-[#E4E4E0] rounded-[5px]">
            <div className="p-5 border-b border-[#E4E4E0] flex justify-between items-center">
              <span className="text-[16px] font-bold text-[#0C0E10] font-heading">Terms and Conditions</span>
              <button className="text-[#6B7280] hover:text-[#0C0E10]">×</button>
            </div>
            <div className="divide-y divide-[#E4E4E0]">
              {form.totals.terms.map((term, i) => (
                <div key={term.id} className="p-4 px-5 flex items-start gap-3 group">
                  <span className="text-[13px] font-bold text-[#6B7280] mt-1">{String(i + 1).padStart(2, '0')}.</span>
                  <textarea 
                    className="text-[13px] text-[#0C0E10] flex-1 outline-none bg-transparent resize-none min-h-[20px] overflow-hidden leading-relaxed disabled:cursor-default"
                    value={term.text}
                    disabled={isSubmitted}
                    rows={1}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                      }
                    }}
                    onInput={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onChange={e => {
                      const newTerms = [...form.totals.terms];
                      newTerms[i].text = e.target.value;
                      setForm({...form, totals: {...form.totals, terms: newTerms}});
                    }}
                    placeholder="Enter term..."
                  />
                  {!isSubmitted && (
                    <div className="flex items-center gap-1.5 self-center">
                      <button 
                        className="w-7 h-7 flex items-center justify-center text-[#6B7280] hover:text-[#CC3A3A] hover:bg-[#FAFAF8] rounded transition-all"
                        title="Remove"
                        onClick={() => {
                          const newTerms = form.totals.terms.filter(t => t.id !== term.id);
                          setForm({...form, totals: {...form.totals, terms: newTerms}});
                        }}
                      >
                        <X size={14} />
                      </button>
                      <button 
                        className={`w-7 h-7 flex items-center justify-center transition-all rounded ${i === form.totals.terms.length - 1 ? 'text-[#D0D0CA] cursor-not-allowed' : 'text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8]'}`}
                        disabled={i === form.totals.terms.length - 1}
                        onClick={(e) => {
                          e.preventDefault();
                          if (i === form.totals.terms.length - 1) return;
                          const newTerms = [...form.totals.terms];
                          [newTerms[i], newTerms[i+1]] = [newTerms[i+1], newTerms[i]];
                          setForm({...form, totals: {...form.totals, terms: newTerms}});
                        }}
                      >
                        <span className="text-[18px]">↓</span>
                      </button>
                      <button 
                        className={`w-7 h-7 flex items-center justify-center transition-all rounded ${i === 0 ? 'text-[#D0D0CA] cursor-not-allowed' : 'text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8]'}`}
                        disabled={i === 0}
                        onClick={(e) => {
                          e.preventDefault();
                          if (i === 0) return;
                          const newTerms = [...form.totals.terms];
                          [newTerms[i], newTerms[i-1]] = [newTerms[i-1], newTerms[i]];
                          setForm({...form, totals: {...form.totals, terms: newTerms}});
                        }}
                      >
                        <span className="text-[18px]">↑</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isSubmitted && (
              <button 
                className="p-4 px-5 text-[13px] font-bold text-[#95BF47] hover:underline" 
                onClick={() => setForm(f => ({...f, totals: {...f.totals, terms: [...f.totals.terms, {id: Date.now(), text: ''}]}}))}
              >
                ＋ Add New Term
              </button>
            )}
          </div>

        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="max-w-[1200px] mx-auto w-full px-6 pb-12 flex items-center gap-3">
        {!isSubmitted && (
          <>
            <button 
              onClick={() => handleSave('draft')}
              className="h-10 px-5 border border-[#0C0E10] bg-white text-[#0C0E10] rounded-[5px] text-[13px] font-bold hover:bg-[#FAFAF8] transition-all"
            >
              Save as Draft
            </button>
            <button 
              onClick={() => handleSave('sent')}
              className="h-10 px-5 bg-[#0C0E10] text-white rounded-[5px] text-[13px] font-bold hover:bg-[#02172E] transition-all"
            >
              Submit Invoice
            </button>
          </>
        )}
        <button 
          onClick={() => handleSave('draft', 'preview')}
          className="h-10 px-5 border border-[#02172E] bg-white text-[#02172E] rounded-[5px] text-[13px] font-bold hover:bg-[#FAFAF8] transition-all"
        >
          Preview PDF
        </button>
      </div>

      {/* MODALS */}
      <ClientRegistrationModal 
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        editingClient={selectedClient}
        onSuccess={(newClient) => {
          clientApi.getAll().then(res => setClients(res.data));
          setSelectedClient(newClient);
          setIsClientModalOpen(false);
          toast.success(selectedClient ? 'Client updated successfully' : 'Client added and selected');
        }}
      />

      <ProductRegistrationModal 
        isOpen={isProductModalOpen} 
        onClose={() => {
          setIsProductModalOpen(false);
          setModalTriggerRowId(null);
        }}
        onSuccess={(newProduct) => {
          setProducts(prev => [...prev, newProduct]);
          if (modalTriggerRowId) {
            updateItem(modalTriggerRowId, 'name', newProduct.name);
            updateItem(modalTriggerRowId, 'rate', newProduct.price || 0);
            if (newProduct.hsnCode) updateItem(modalTriggerRowId, 'hsn', newProduct.hsnCode);
            if (newProduct.unit) updateItem(modalTriggerRowId, 'unit', newProduct.unit);
          }
          setModalTriggerRowId(null);
        }}
      />
    </div>
  );
};

export default InvoiceForm;
