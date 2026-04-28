import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { invoiceApi, clientApi, settingsApi, productApi, unitApi } from '../services/api';
import { formatCurrency as baseFormat, getFinancialYear, numberToWords } from '../utils/helpers';
import { toast } from 'react-toastify';
import {
  Plus, Trash2, Save, Send, Upload, X, User, Landmark, 
  Search, Edit3, Truck, Building2, Calendar, Hash, 
  PlusCircle, CheckCircle, Check, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, LayoutGrid, FileText, Info, Percent,
  Image as ImageIcon, PenTool, Globe, Clock, Tag, ChevronRight,
  PlusSquare, ImagePlus, Settings2, DollarSign, Languages, ListFilter,
  Copy, Scale, Zap, Gem, CheckSquare, Square, Eye, Monitor, ShieldCheck,
  EyeOff, GripVertical, Pen, Paperclip, Phone, MapPin, Download,
  Printer, Share2, MoreHorizontal, Mail, ExternalLink, Contact, RefreshCcw, ArrowUp, ArrowDown
} from 'lucide-react';

import ClientRegistrationModal from '../components/ClientRegistrationModal';
import InvoicePreview from '../components/InvoicePreview';

const COUNTRIES = [
  { name: 'India', currency: 'INR', symbol: '₹', format: 'en-IN', system: 'Lakhs' },
  { name: 'United States', currency: 'USD', symbol: '$', format: 'en-US', system: 'Millions' },
  { name: 'European Union', currency: 'EUR', symbol: '€', format: 'de-DE', system: 'Millions' },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£', format: 'en-GB', system: 'Millions' },
  { name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', format: 'ar-AE', system: 'Millions' },
  { name: 'Singapore', currency: 'SGD', symbol: 'S$', format: 'en-SG', system: 'Millions' },
  { name: 'Canada', currency: 'CAD', symbol: 'C$', format: 'en-CA', system: 'Millions' },
  { name: 'Australia', currency: 'AUD', symbol: 'A$', format: 'en-AU', system: 'Millions' },
  { name: 'Japan', currency: 'JPY', symbol: '¥', format: 'ja-JP', system: 'Millions' },
  { name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', format: 'ar-SA', system: 'Millions' },
  { name: 'Switzerland', currency: 'CHF', symbol: 'CHF', format: 'de-CH', system: 'Millions' },
  { name: 'Hong Kong', currency: 'HKD', symbol: 'HK$', format: 'zh-HK', system: 'Millions' },
  { name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', format: 'en-NZ', system: 'Millions' },
  { name: 'Brazil', currency: 'BRL', symbol: 'R$', format: 'pt-BR', system: 'Millions' },
  { name: 'Russia', currency: 'RUB', symbol: '₽', format: 'ru-RU', system: 'Millions' },
  { name: 'South Africa', currency: 'ZAR', symbol: 'R', format: 'en-ZA', system: 'Millions' },
  { name: 'Turkey', currency: 'TRY', symbol: '₺', format: 'tr-TR', system: 'Millions' },
  { name: 'Kuwait', currency: 'KWD', symbol: 'KD', format: 'en-KW', system: 'Millions' },
];

const TAX_TYPES = ["GST (India)", "NONE", "VAT", "PPN", "SST", "HST", "TAX"];

const STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry", "Other Territory"];

const DEFAULT_COLUMNS = [
  { id: 'hsn', label: 'HSN/SAC', visible: true },
  { id: 'gstRate', label: 'Tax Rate', visible: true },
  { id: 'quantity', label: 'Quantity', visible: true },
  { id: 'rate', label: 'Rate', visible: true },
  { id: 'amount', label: 'Amount', visible: true },
];

const emptyClient = {
  clientType: 'Business', name: '', displayName: '', clientCode: '', logoUrl: '',
  primaryContactName: '', email: '', phone: '', website: '',
  billingAddress: { address1: '', city: '', state: '', country: 'India', pincode: '' },
  gstin: '', panNumber: '', taxType: 'GST',
  preferredCurrency: 'INR', paymentTerms: 'Net 30'
};

const defaultItem = () => ({ 
  id: Date.now() + Math.random(), 
  name: '', hsn: '', gstRate: '', quantity: 1, rate: 0, 
  amount: 0, cgst: 0, sgst: 0, igst: 0, total: 0, 
  description: '', image: '', unit: 'Product', salesLedger: 'Sales',
  showDesc: false, showUnit: false, showLedger: false
});

const emptyShipping = { name: '', country: 'India', address: '', city: '', pincode: '', state: '' };

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const logoInputRef = useRef(null);
  const signInputRef = useRef(null);
  const itemImageRefs = useRef({});
  const dueDateRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(15);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [tempCustomField, setTempCustomField] = useState({ label: '', value: '', setAsDefault: false });
  const [invoiceTitle, setInvoiceTitle] = useState('Export Invoice');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showSubtitleInput, setShowSubtitleInput] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [isBilledByModalOpen, setIsBilledByModalOpen] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [shippingData, setShippingData] = useState({
    shippedFrom: { name: '', address: '', city: '', country: 'India', pincode: '', state: '' },
    shippedTo: { recipientName: '', streetAddress: '', city: '', state: '', postalCode: '', country: 'India' }
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isSameAsBusiness, setIsSameAsBusiness] = useState(false);
  const [isSameAsClient, setIsSameAsClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [extraShippingFields, setExtraShippingFields] = useState({ from: [], to: [] });
  const [showExtraFieldModal, setShowExtraFieldModal] = useState(false);
  const [extraFieldTarget, setExtraFieldTarget] = useState('from');
  const [tempExtraField, setTempExtraField] = useState({ label: '', value: '' });
  const [openSections, setOpenSections] = useState(['terms']);
  const [units, setUnits] = useState([]);

  const toggleSection = (id) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const [billedByDetails, setBilledByDetails] = useState({ 
    businessName: 'Software Developer', country: 'India', city: '', gstin: '', pan: '', 
    addressCountry: 'India', state: 'Other Territory', addressCity: '', postalCode: '', 
    streetAddress: 'India', displayName: '', email: '', phone: '', telephone: '', showEmail: false, 
    showPhone: false, updateFuture: true, softwareExportType: ''
  });
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', hsnCode: '' });
  const [productSearch, setProductSearch] = useState({});
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState({});
  const [clientToEdit, setClientToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('General');
  const [clientData, setClientData] = useState({ 
    logo: null, businessName: '', industry: '', clientType: 'Company', alias: '', 
    uniqueKey: '', email: '', showEmail: false, phone: '', showPhone: false, 
    country: 'India', state: '', city: '', postalCode: '', streetAddress: '', 
    gstin: '', pan: '', taxTreatment: '', defaultDueDate: '15', 
    paymentAccount: '', upiId: '' 
  });

  const [newClient, setNewClient] = useState(emptyClient);

  const getFullFY = () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}-${String(year + 1).slice(2)}`;
  };

  const [form, setForm] = useState({
    header: {
      title: 'Export Invoice', subtitle: '', invoiceNumber: `EXP-001/${getFullFY()}`,
      invoiceDate: new Date().toISOString().slice(0, 10), dueDate: '', logo: '', showSubtitle: false,
      poNoAndDate: '', softwareExportType: ''
    },
    status: 'draft',
    business: { name: 'Software Developer', gstin: '', address: 'India', state: 'Other Territory' },
    client: { id: '', name: '', email: '', gstin: '', address: '', state: '' },
    shipping: { enabled: false, from: { ...emptyShipping }, to: { ...emptyShipping } },
    items: [defaultItem()],
    columns: DEFAULT_COLUMNS,
    totals: { 
      discount: 0, discountType: 'percentage', additionalCharges: 0, 
      roundOffEnabled: true, terms: [
        { id: 1, text: 'Payment Terms: Immediate through wire transfer to our bank account on acceptance of data.' },
        { id: 2, text: 'For despatch details refer to the Project Delivery Log. The relevant logs have been loaded to your FTP.' }
      ],
      showTotalInPdf: true, summariseQty: false, showWords: true,
      exchangeRate: 106.8562, businessCurrency: 'INR'
    },
    settings: {
      gstEnabled: true, currency: 'EUR', currencySymbol: '€', numberFormat: 'de-DE',
      decimalDigits: 2, taxType: 'CGST & SGST', placeOfSupply: 'Other Territory',
      selectedTaxLabel: 'GST (India)',
      isRecurring: false, roundQty: false, roundRate: false,
      advanced: {
        unitDisplay: 'Merge with quantity', taxSummary: 'Do not show',
        hidePlace: false, addOriginalImages: false, showThumbnails: false,
        showDescFull: true, hideSubtotalGroup: false, showSku: false,
        showSerial: false, displayBatch: false
      }
    },
    signature: { image: '', label: 'Authorized Signatory' }
  });

  // Sync Shipping From with Business
  useEffect(() => {
    if (isSameAsBusiness) {
      setShippingData(prev => ({
        ...prev,
        shippedFrom: {
          name: billedByDetails.businessName,
          country: billedByDetails.addressCountry,
          address: billedByDetails.streetAddress,
          city: billedByDetails.addressCity,
          pincode: billedByDetails.postalCode,
          state: billedByDetails.state
        }
      }));
    }
  }, [isSameAsBusiness, billedByDetails]);

  // Sync Shipping To with Client
  const syncShippingWithClient = useCallback(() => {
    if (isSameAsClient && selectedClient) {
      setShippingData(prevState => ({
        ...prevState,
        shippedTo: {
          ...prevState.shippedTo,
          recipientName: selectedClient.businessName || selectedClient.name || '',
          streetAddress: selectedClient.streetAddress || '',
          city: selectedClient.city || '',
          state: selectedClient.state || '',
          postalCode: selectedClient.postalCode || '',
          country: selectedClient.country || 'India'
        }
      }));
    }
  }, [isSameAsClient, selectedClient]);

  useEffect(() => {
    syncShippingWithClient();
  }, [syncShippingWithClient]);

  // Ensure selectedClient is always in sync with form.client.id
  useEffect(() => {
    if (form.client?.id && clients.length > 0) {
      const c = clients.find(x => (x._id || x.id) === form.client.id);
      if (c) {
        setSelectedClient(c);
      }
    } else if (!form.client?.id) {
      setSelectedClient(null);
    }
  }, [form.client?.id, clients]);

  const format = (amt) => Number(amt || 0).toLocaleString(form.settings.numberFormat, { 
    style: 'currency', currency: form.settings.currency, minimumFractionDigits: form.settings.decimalDigits
  });

  const fetchClients = async () => {
    try {
      const res = await clientApi.getAll();
      setClients(res.data);
    } catch { toast.error('Error fetching clients'); }
  };

  const fetchUnits = async () => {
    try {
      const res = await unitApi.getAll();
      setUnits(res.data);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchUnits();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productApi.getAll();
      setProducts(res.data);
    } catch { console.error('Error fetching products'); }
  };



  useEffect(() => {
    const init = async () => {
      try {
        const [sRes] = await Promise.all([settingsApi.get()]);
        await fetchClients();
        await fetchProducts();
        const s = sRes.data;
        
        if (s) {
          setBilledByDetails(prev => ({
            ...prev,
            businessName: s.businessName || prev.businessName,
            email: s.email || prev.email,
            phone: s.phone || prev.phone,
            telephone: s.telephone || prev.telephone,
            streetAddress: s.address || prev.streetAddress,
            addressCity: s.city || prev.addressCity,
            postalCode: s.pincode || prev.postalCode,
            state: s.state || prev.state,
            addressCountry: s.country || prev.addressCountry,
            gstin: s.gstin || prev.gstin,
            pan: s.pan || prev.pan,
            registeredOffice: s.registeredOffice || prev.registeredOffice,
            bankName: s.bankName || prev.bankName,
            accountName: s.accountName || prev.accountName,
            accountNumber: s.accountNumber || prev.accountNumber,
            ifscCode: s.ifscCode || prev.ifscCode,
            iban: s.iban || prev.iban,
            swiftCode: s.swiftCode || prev.swiftCode,
            ieCode: s.ieCode || prev.ieCode,
            cin: s.cin || prev.cin,
            website: s.website || prev.website,
            lutDetails: s.lutDetails || prev.lutDetails
          }));
        }

        if (!id) {
          if (s) {
            setForm(f => ({
              ...f,
              business: { 
                name: s.businessName || 'Software Developer', 
                gstin: s.gstin || 'UNREGISTERED', 
                address: `${s.address}, ${s.city}, ${s.state}` || 'India', 
                state: s.state || 'Other Territory' 
              },
              header: { 
                ...f.header, 
                logo: s.logoUrl || '',
                invoiceNumber: `${s.invoicePrefix || 'EXP'}-${String(s.invoiceCounter || 1).padStart(3, '0')}/${getFullFY()}` 
              },
              signature: { ...f.signature, image: s.signatureUrl || '' }
            }));
            if (s.softwareExportType) {
              setForm(f => ({
                ...f,
                header: {
                  ...f.header,
                  softwareExportType: s.softwareExportType
                }
              }));
            }
            if (s.lutDetails) {
              setSubtitleText(s.lutDetails);
              setShowSubtitleInput(true);
            }
          }
        } else {
          const { data } = await invoiceApi.getById(id);
          if(!data) throw new Error('No data');
          
          // Populate independent states from loaded data
          if (data.invoiceTitle) setInvoiceTitle(data.invoiceTitle);
          if (data.invoiceSubTitle) {
            setSubtitleText(data.invoiceSubTitle);
            setShowSubtitleInput(true);
          }
          if (data.business) {
            setBilledByDetails(prev => ({ 
              ...prev, 
              ...data.business,
              // Force settings values to ensure live profile data is used
              telephone: prev.telephone,
              phone: prev.phone,
              bankName: data.business.bankName || prev.bankName,
              accountName: data.business.accountName || prev.accountName,
              accountNumber: data.business.accountNumber || prev.accountNumber,
              ifscCode: data.business.ifscCode || prev.ifscCode,
              iban: data.business.iban || prev.iban,
              swiftCode: data.business.swiftCode || prev.swiftCode,
              pan: data.business.pan || prev.pan,
              ieCode: data.business.ieCode || prev.ieCode,
              cin: data.business.cin || prev.cin,
              website: data.business.website || prev.website,
              registeredOffice: data.business.registeredOffice || prev.registeredOffice,
              lutDetails: data.business.lutDetails || prev.lutDetails,
              softwareExportType: data.business.softwareExportType || prev.softwareExportType
            }));
          }
          if (data.client) {
            setClientData(prev => ({ ...prev, ...data.client }));
          }
          if (data.shipping) {
            setShippingData(prev => ({ ...prev, ...data.shipping }));
            if (data.shipping.extraFields) setExtraShippingFields(data.shipping.extraFields);
          }
          if (data.customFields) setCustomFields(data.customFields);

          const migratedSignature = typeof data.signature === 'string' 
            ? { image: data.signature, label: 'Authorized Signatory' } 
            : (data.signature || { image: '', label: 'Authorized Signatory' });
          
          if (!migratedSignature.image && s?.signatureUrl) {
            migratedSignature.image = s.signatureUrl;
          }
            
          const migratedTerms = Array.isArray(data.totals?.terms) 
            ? data.totals.terms 
            : (typeof data.totals?.terms === 'string' ? [{ id: Date.now(), text: data.totals.terms }] : form.totals.terms);

          setForm(prev => {
            const updatedHeader = { 
              ...prev.header, 
              ...(data.header || {}),
              invoiceNumber: data.invoiceNumber || data.header?.invoiceNumber || prev.header.invoiceNumber 
            };
            if (!updatedHeader.logo && s?.logoUrl) {
              updatedHeader.logo = s.logoUrl;
            }

            const finalClient = data.client || {
              id: data.clientId || '',
              name: data.clientName || '',
              address: data.clientAddress || '',
              email: data.clientEmail || '',
              gstin: data.clientGstin || ''
            };

            // Set selected client object if id exists
            if (finalClient.id && Array.isArray(clients)) {
              const matched = clients.find(c => (c._id === finalClient.id || c.id === finalClient.id));
              if (matched) setSelectedClient(matched);
            }

            return {
              ...prev,
              ...data,
              columns: data.columns || prev.columns,
              shipping: data.shipping || prev.shipping,
              totals: { ...prev.totals, ...(data.totals || {}), terms: migratedTerms },
              settings: { ...prev.settings, ...(data.settings || {}) },
              header: updatedHeader,
              client: finalClient,
              poNoAndDate: data.poNoAndDate || prev.poNoAndDate,
              softwareExportType: data.softwareExportType || prev.softwareExportType,
              business: data.business || prev.business,
              signature: migratedSignature
            };
          });
        }
      } catch (err) { console.error(err); toast.error('Error init builder'); }
      finally { setLoading(false); }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (form.client?.id && Array.isArray(clients) && clients.length > 0) {
      const matched = clients.find(c => (c._id === form.client.id || c.id === form.client.id));
      if (matched) setSelectedClient(matched);
    }
  }, [form.client?.id, clients]);

  const handleAddClient = async () => {
    if(!newClient.name) return toast.error('Name is required');
    try {
      await clientApi.create(newClient);
      toast.success('Client added successfully');
      setShowAddClientModal(false);
      setNewClient(emptyClient);
      fetchClients();
    } catch { toast.error('Error adding client'); }
  };

  const handleFileChange = (e, target, itemId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') setForm(f => ({...f, header: {...f.header, logo: reader.result}}));
        if (target === 'sign') setForm(f => ({...f, signature: {...f.signature, image: reader.result}}));
        if (target === 'itemImage') setForm(f => ({...f, items: f.items.map(it => it.id === itemId ? {...it, image: reader.result} : it)}));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculate = useCallback(() => {
    let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalQty = 0;
    const items = (form.items || []).filter(it => it && it.id).map(it => {
      const rawQty = it.quantity !== undefined ? it.quantity : '';
      const rawRate = it.rate !== undefined ? it.rate : '';
      const qty = form.settings?.roundQty ? Math.round(Number(rawQty || 0)) : Number(rawQty || 0);
      const rate = form.settings?.roundRate ? Math.round(Number(rawRate || 0)) : Number(rawRate || 0);
      const amount = qty * rate;
      const taxTotal = form.settings?.gstEnabled ? (amount * Number(it.gstRate || 0)) / 100 : 0;
      let cgst = 0, sgst = 0, igst = 0;
      if (form.settings?.taxType === 'CGST & SGST') { cgst = taxTotal / 2; sgst = taxTotal / 2; }
      else { igst = taxTotal; }
      subtotal += amount; totalCgst += cgst; totalSgst += sgst; totalIgst += igst; totalQty += qty;
      return { ...it, quantity: rawQty, rate: rawRate, amount, cgst, sgst, igst, total: amount + taxTotal };
    });
    const disc = form.totals?.discountType === 'percentage' ? (subtotal * Number(form.totals?.discount || 0)) / 100 : Number(form.totals?.discount || 0);
    const preRound = subtotal + totalCgst + totalSgst + totalIgst - disc + Number(form.totals?.additionalCharges || 0);
    const total = preRound;
    const totalInINR = form.settings?.currency === 'INR' ? total : total * Number(form.totals?.exchangeRate || 1);
    return { 
      subtotal, 
      taxTotal: totalCgst + totalSgst + totalIgst, 
      cgst: totalCgst, 
      sgst: totalSgst, 
      igst: totalIgst, 
      total, 
      totalInINR, 
      items, 
      totalQty, 
      additionalCharges: Number(form.totals?.additionalCharges || 0),
      totalInWords: numberToWords(form.settings?.currency === 'INR' ? total : totalInINR, form.settings?.currency) 
    };
  }, [form.items, form.totals, form.settings]);

  const live = calculate();

  const handleSameAsBusiness = (e) => {
    const checked = e.target.checked;
    setIsSameAsBusiness(checked);
    if (!checked) {
      setShippingData(prev => ({ ...prev, shippedFrom: { name: '', address: '', city: '', country: 'India', pincode: '', state: '' } }));
    }
  };

  const handleSameAsClient = (e) => {
    const isChecked = e.target.checked;
    setIsSameAsClient(isChecked);
    
    // Debugging logs to verify state in console
    console.log("Checkbox clicked. isChecked:", isChecked);
    console.log("Selected Client State:", selectedClient);

    if (isChecked) {
      // Find current client again just to be absolutely sure
      const c = clients.find(x => (x._id || x.id) === form.client.id) || selectedClient;
      if (c) {
        console.log("Syncing with client:", c);
        setShippingData(prevState => ({
          ...prevState,
          shippedTo: {
            ...prevState.shippedTo,
            recipientName: c.businessName || c.name || '',
            streetAddress: c.streetAddress || '',
            city: c.city || '',
            state: c.state || '',
            postalCode: c.postalCode || '',
            country: c.country || 'India'
          }
        }));
      } else {
        console.warn("No client found for syncing");
      }
    } else {
      setShippingData(prevState => ({
        ...prevState,
        shippedTo: { recipientName: '', streetAddress: '', city: '', state: '', postalCode: '', country: 'India' }
      }));
    }
  };

  const handleRemoveExtraField = (target, index) => {
    setExtraShippingFields(prev => ({
      ...prev,
      [target]: prev[target].filter((_, i) => i !== index)
    }));
  };

  const updateShippingValue = (target, field, value) => {
    setShippingData(prev => ({
      ...prev,
      [target]: { ...prev[target], [field]: value }
    }));
  };

  const handleAddExtraField = (target) => {
    setExtraFieldTarget(target);
    setTempExtraField({ label: '', value: '' });
    setShowExtraFieldModal(true);
  };

  const saveExtraField = () => {
    if (!tempExtraField.label) return toast.error('Label is required');
    setExtraShippingFields(prev => ({
      ...prev,
      [extraFieldTarget]: [...prev[extraFieldTarget], tempExtraField]
    }));
    setShowExtraFieldModal(false);
  };

  const getCalculatedDueDate = () => {
    const baseDate = form.header.invoiceDate ? new Date(form.header.invoiceDate) : new Date();
    const result = new Date(baseDate);
    result.setDate(result.getDate() + (parseInt(daysToAdd) || 0));
    return result;
  };

  const formattedCalculatedDate = getCalculatedDueDate().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const updateItem = (id, field, value) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.id === id ? { ...it, [field]: value } : it)
    }));
  };

  const deleteItem = (id) => {
    if (form.items.length === 1) return toast.info('At least one item is required');
    setForm(f => ({ ...f, items: f.items.filter(it => it.id !== id) }));
  };

  const handleProductSelect = (id, product) => {
    setForm(f => ({
      ...f,
      items: f.items.map(it => it.id === id ? { 
        ...it, 
        name: product.name, 
        hsn: product.hsnCode, 
        gstRate: '' // Leave empty as requested for manual entry
      } : it)
    }));
    setProductSearch({ ...productSearch, [id]: '' });
  };

  const updateShipping = (section, field, value) => {
    setForm(f => ({ ...f, shipping: { ...f.shipping, [section]: { ...(f.shipping?.[section] || {}), [field]: value } } }));
  };

  const addTerm = () => {
    setForm(f => ({
      ...f,
      totals: {
        ...f.totals,
        terms: [...(f.totals.terms || []), { id: Date.now(), text: '' }]
      }
    }));
  };

  const removeTerm = (id) => {
    setForm(f => ({
      ...f,
      totals: {
        ...f.totals,
        terms: f.totals.terms.filter(t => t.id !== id)
      }
    }));
  };

  const updateTerm = (id, text) => {
    setForm(f => ({
      ...f,
      totals: {
        ...f.totals,
        terms: f.totals.terms.map(t => t.id === id ? { ...t, text } : t)
      }
    }));
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return toast.error('Product name is required');
    try {
      const res = await productApi.create(newProduct);
      setProducts([...products, res.data]);
      setShowProductModal(false);
      setNewProduct({ name: '', hsnCode: '' });
      toast.success('Product saved successfully');
    } catch { toast.error('Error saving product'); }
  };

  const handleAddCustomUnit = async (itemId) => {
    const custom = prompt('Enter Custom Unit (e.g. Dozen, Reams):');
    if (!custom) return;

    try {
      const res = await unitApi.create({ name: custom });
      const newUnit = res.data;
      setUnits(prev => [...prev, newUnit]);
      updateItem(itemId, 'unit', newUnit.name);
      updateItem(itemId, 'showUnit', false);
      toast.success('Unit saved!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save custom unit');
    }
  };

  const moveTerm = (index, direction) => {
    const newTerms = [...form.totals.terms];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newTerms.length) return;
    [newTerms[index], newTerms[targetIndex]] = [newTerms[targetIndex], newTerms[index]];
    setForm(f => ({ ...f, totals: { ...f.totals, terms: newTerms } }));
  };

  const handleSave = async (submitStatus = 'draft') => {
    try {
      const payload = { 
        ...form, 
        ...live,
        status: submitStatus,
        invoiceTitle,
        invoiceSubTitle: subtitleText,
        business: billedByDetails,
        client: form.client,
        // Top-level fields for compatibility with list and detail views
        clientName: form.client?.name || '',
        clientAddress: form.client?.address || '',
        businessName: billedByDetails.businessName,
        businessAddress: `${billedByDetails.streetAddress || ''}, ${billedByDetails.addressCity || ''}, ${billedByDetails.postalCode || ''}, ${billedByDetails.state || ''}, ${billedByDetails.addressCountry || ''}`.replace(/,,/g, ',').replace(/^, /, ''),
        businessGstin: billedByDetails.gstin,
        businessPan: billedByDetails.pan,
        ieCode: billedByDetails.ieCode,
        cin: billedByDetails.cin,
        website: billedByDetails.website,
        lutDetails: billedByDetails.lutDetails,
        logoUrl: form.header?.logo || '',
        signatureUrl: form.signature?.image || '',
        terms: form.totals?.terms || [],
        
        subtotal: live.subtotal,
        total: live.total,
        taxTotal: live.taxTotal,
        totalInINR: live.totalInINR,
        additionalCharges: live.additionalCharges,
        poNoAndDate: form.header.poNoAndDate,
        softwareExportType: form.header.softwareExportType,
        discountValue: Number(form.totals?.discount || 0),
        discountType: form.totals?.discountType || 'percentage',
        exchangeRate: Number(form.totals?.exchangeRate || 1),

        shipping: {
          ...shippingData,
          extraFields: extraShippingFields
        },
        customFields: customFields,
        header: {
          ...form.header,
          title: invoiceTitle,
          subtitle: subtitleText
        }
      };

      if (id) await invoiceApi.update(id, payload);
      else await invoiceApi.create(payload);
      toast.success('Invoice saved successfully');
      navigate('/invoices');
    } catch (err) { 
      console.error(err);
      toast.error('Error saving invoice'); 
    }
  };

  const handleSaveCustomField = () => {
    if (!tempCustomField.label) return toast.warn('Label is required');
    setCustomFields([...customFields, { ...tempCustomField, id: Date.now() }]);
    setTempCustomField({ label: '', value: '', setAsDefault: false });
    setShowCustomFieldModal(false);
    toast.success('Custom field added');
  };

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleBilledByChange = (field, value) => {
    setBilledByDetails(prev => ({ ...prev, [field]: value }));
  };


  const handleClientSaveSuccess = (data) => {
    setForm(f => ({
      ...f,
      client: {
        ...(f.client || {}),
        id: data._id || data.id,
        name: data.businessName,
        email: data.email,
        address: data.city || 'No Address',
        gstin: data.gstin || 'UNREGISTERED',
        state: data.state
      }
    }));
    fetchClients();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <>
      <div className="flex min-h-screen bg-[#F8F9FD]">
      <div className="flex-1 p-10 overflow-y-auto max-h-screen custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-32">
          {form.status !== 'draft' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl font-bold flex items-center justify-center">
              This invoice has been submitted and can no longer be edited.
            </div>
          )}
          <div className={form.status !== 'draft' ? 'pointer-events-none opacity-80' : ''}>
          
          {/* TOP STEPPER */}
          <div className="text-center mb-6 mt-4">
            <h1 className="text-[22px] font-bold text-slate-900 mb-4 tracking-tight">Create New Invoice</h1>
            <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs shadow-sm">1</span>
                <span>Add Invoice Details</span>
              </div>

            </div>
          </div>

          {/* HEADER SECTION */}
          <div className="bg-white rounded-xl p-10 shadow-sm border border-slate-200">
            <div className="text-center mb-12">
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center justify-center gap-2 group">
                  {isEditingTitle ? (
                    <input 
                      autoFocus
                      className="text-[32px] font-bold text-slate-800 bg-transparent border-none text-center focus:ring-0 p-0 border-b border-dashed border-slate-300 focus:border-purple-600 outline-none" 
                      style={{width: `${Math.max(invoiceTitle.length, 5)}ch`}} 
                      value={invoiceTitle} 
                      onChange={e => setInvoiceTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                    />
                  ) : (
                    <>
                      <h2 className="text-[32px] font-bold text-slate-800 tracking-tight">{invoiceTitle}</h2>
                      <PenTool size={16} className="text-slate-400 cursor-pointer hover:text-purple-600 transition-colors" onClick={() => setIsEditingTitle(true)}/>
                    </>
                  )}
                </div>

                {showSubtitleInput ? (
                  <textarea 
                    autoFocus
                    className="text-[14px] font-medium text-slate-500 bg-transparent border-none text-center focus:ring-0 p-0 border-b border-slate-200 mt-2 outline-none w-full max-w-4xl resize-none overflow-hidden block" 
                    placeholder="Enter subtitle..."
                    value={subtitleText}
                    rows={1}
                    onFocus={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onChange={e => {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                      setSubtitleText(e.target.value);
                    }}
                  />
                ) : (
                  <button onClick={() => setShowSubtitleInput(true)} className="text-[13px] font-medium text-purple-600 mt-3 flex items-center justify-center gap-1.5 mx-auto hover:text-purple-700">
                    <Plus size={14} /> Add Subtitle
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-start">
              <div className="space-y-5 w-full max-w-[420px]">
                <div className="flex items-center"><label className="text-[13px] font-semibold text-slate-600 w-36">Invoice No<span className="text-red-500">*</span></label><input className="flex-1 text-[13px] font-medium text-slate-800 border-b border-slate-200 outline-none pb-1.5 focus:border-purple-600 transition-colors" value={form.header.invoiceNumber} onChange={e=>setForm({...form, header:{...form.header, invoiceNumber:e.target.value}})}/></div>
                <div className="flex items-center"><label className="text-[13px] font-semibold text-slate-600 w-36">Invoice Date<span className="text-red-500">*</span></label><div className="flex-1 flex items-center border-b border-slate-200 pb-1.5">
                  <DatePicker
                    selected={form.header.invoiceDate ? new Date(form.header.invoiceDate) : null}
                    onChange={(date) => setForm({...form, header:{...form.header, invoiceDate: date?.toISOString().split('T')[0]}})}
                    dateFormat="MMM d, yyyy"
                    className="text-[13px] font-medium text-slate-800 bg-transparent border-none p-0 outline-none w-full"
                    placeholderText="Select Date"
                  />
                  <Calendar size={14} className="text-slate-300"/>
                </div></div>
                <div className="flex items-center"><label className="text-[13px] font-semibold text-slate-600 w-36">Due Date</label><div className="flex-1 flex items-center border-b border-slate-200 pb-1.5 gap-2">
                  <DatePicker
                    ref={dueDateRef}
                    selected={form.header.dueDate ? new Date(form.header.dueDate) : null}
                    onChange={(date) => setForm({...form, header:{...form.header, dueDate: date?.toISOString().split('T')[0]}})}
                    dateFormat="MMM d, yyyy"
                    className="text-[13px] font-medium text-slate-800 bg-transparent border-none p-0 outline-none w-full"
                    placeholderText="Select Date"
                  />
                  <Calendar size={14} className="text-slate-300 cursor-pointer" onClick={() => dueDateRef.current?.setOpen(true)}/><Settings2 size={14} className="text-slate-400 cursor-pointer" onClick={() => setShowDueDateModal(true)}/><X size={14} className="text-slate-400 cursor-pointer" onClick={() => setForm({...form, header:{...form.header, dueDate: ''}})}/>
                </div></div>

                <div className="flex items-center"><label className="text-[13px] font-semibold text-slate-600 w-36">PO No & Date</label><input className="flex-1 text-[13px] font-medium text-slate-800 border-b border-slate-200 outline-none pb-1.5 focus:border-purple-600 transition-colors" value={form.header.poNoAndDate} onChange={e=>setForm({...form, header:{...form.header, poNoAndDate:e.target.value}})} placeholder="e.g. Proposal Dt 15th Dec 2025"/></div>
                
                <div className="flex items-start"><label className="text-[13px] font-semibold text-slate-600 w-36 pt-1">Export Type</label><textarea rows={2} className="flex-1 text-[13px] font-medium text-slate-800 border-b border-slate-200 outline-none pb-1.5 focus:border-purple-600 transition-colors resize-none" value={form.header.softwareExportType} onChange={e=>setForm({...form, header:{...form.header, softwareExportType:e.target.value}})}/></div>

                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center group">
                    <label className="text-[13px] font-semibold text-slate-600 w-36">{field.label}</label>
                    <div className="flex-1 flex items-center border-b border-slate-200 pb-1.5 gap-2">
                      <input 
                        className="flex-1 text-[13px] font-medium text-slate-800 bg-transparent outline-none" 
                        value={field.value} 
                        onChange={(e) => {
                          const newFields = [...customFields];
                          newFields[index].value = e.target.value;
                          setCustomFields(newFields);
                        }}
                      />
                      <X size={14} className="text-purple-600 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveCustomField(index)}/>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col items-center">
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e=>handleFileChange(e, 'logo')}/>
                <input type="file" ref={signInputRef} className="hidden" accept="image/*" onChange={e=>handleFileChange(e, 'sign')}/>
                <div onClick={()=>logoInputRef.current?.click()} className="w-64 h-32 bg-[#FDFDFD] border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 relative group cursor-pointer overflow-hidden hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                  {form.header.logo ? <img src={form.header.logo} alt="Logo" className="w-full h-full object-contain p-2"/> : <><ImageIcon size={24} className="text-purple-500 mb-2"/><span className="text-[13px] font-medium text-slate-600 mb-1">Add Business Logo</span><span className="text-[11px] text-slate-400 text-center px-4 leading-relaxed">Resolution up to 1080x1080px.<br/>PNG or JPEG file.</span></>}
                </div>
              </div>
            </div>
          </div>

          {/* IDENTITY SUITE */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 shadow-sm border border-slate-100/50">
              <div className="flex items-baseline gap-2 mb-4"><h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Billed By</h3><span className="text-[13px] font-medium text-slate-400">Your Details</span></div>
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm min-h-[160px] flex flex-col">
                <div className="relative mb-5">
                  <select className="w-full bg-white border border-slate-200 rounded-md pl-10 pr-4 py-2 text-[13px] font-medium text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors">
                    <option>{billedByDetails.businessName}</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-slate-800 text-white rounded text-[10px] font-bold flex items-center justify-center">
                    {billedByDetails.businessName ? billedByDetails.businessName.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-bold text-slate-800">Business details</h4>
                  <button onClick={() => setIsBilledByModalOpen(true)} className="flex items-center gap-1 text-[12px] font-medium text-purple-600 hover:text-purple-700"><Edit3 size={12}/> Edit</button>
                </div>
                <div className="space-y-2">
                  <div className="flex"><span className="w-32 text-[13px] text-slate-500">Business Name</span><span className="text-[13px] font-medium text-slate-800">{billedByDetails.businessName}</span></div>
                  <div className="flex"><span className="w-32 text-[13px] text-slate-500">Address</span><span className="text-[13px] font-medium text-slate-800">{billedByDetails.streetAddress}, {billedByDetails.state}</span></div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-6 shadow-sm border border-slate-100/50">
              <div className="flex items-baseline gap-2 mb-4"><h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Billed To</h3><span className="text-[13px] font-medium text-slate-400">Client's Details</span></div>
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-sm min-h-[160px] flex flex-col">
                <div className="w-full relative mb-4">
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-md px-4 py-2 text-[13px] font-medium text-slate-500 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors" 
                    value={form.client?.id || ''} 
                    onChange={e=>{
                      const c = clients.find(x=>x._id===e.target.value); 
                      if(c) {
                        setSelectedClient(c);
                        setForm(f=>({...f, client:{
                          id:c._id, 
                          name:c.businessName || c.name, 
                          email:c.email,
                          gstin:c.gstin || 'UNREGISTERED', 
                          address:c.streetAddress || c.city || 'No Address', 
                          state:c.state
                        }}));
                      } else {
                        setSelectedClient(null);
                        setForm(f=>({...f, client:{id:'', name:'', email:'', gstin:'', address:'', state:''}}));
                      }
                    }}
                  >
                    <option value="">Select a Client</option>
                    {clients.map(c=><option key={c._id} value={c._id}>{c.businessName || c.name}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                </div>
                
                {(form.client?.id || form.client?.name) ? (
                   <div className="p-4 bg-slate-50 rounded-lg animate-fade-in flex-1 relative group">
                    <button 
                      onClick={() => {
                        const fullClient = clients.find(c => c._id === form.client.id || c.id === form.client.id);
                        if (fullClient) {
                          setClientToEdit(fullClient);
                          setIsClientModalOpen(true);
                        }
                      }}
                      className="absolute top-4 right-4 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      Edit
                    </button>
                    <h4 className="text-[14px] font-bold text-slate-800 mb-1">{form.client?.name}</h4>
                    {form.client?.email && <p className="text-[12px] text-slate-500 mb-1 font-medium">{form.client?.email}</p>}
                    <p className="text-[13px] text-slate-600 mb-2">{form.client?.address}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase">GSTIN: {form.client?.gstin}</p>
                  </div>
                ) : (
                  <div className="flex-1 border border-slate-100 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-[13px] text-slate-500 mb-3 leading-relaxed">Select Client/Business from the list<br/>OR</p>
                    <button onClick={() => { setClientToEdit(null); setIsClientModalOpen(true); }} className="bg-[#8B5CF6] text-white font-semibold text-[13px] px-6 py-2.5 rounded-md shadow-sm hover:bg-[#7C3AED] transition-all flex items-center gap-1.5"><PlusCircle size={14}/> Add New Client</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COMMAND BAR */}
          <div className="flex items-end gap-3 animate-slide-up mt-2">
            <div className="flex flex-col gap-1.5 flex-1 max-w-[240px]">
              <label className="text-[12px] font-semibold text-slate-600">Currency<span className="text-red-500">*</span></label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 rounded-md pl-3 pr-8 py-2 text-[13px] font-medium text-slate-700 outline-none appearance-none cursor-pointer hover:border-slate-300 transition-colors h-[42px]" value={form.settings.currency} onChange={e=>{const c=COUNTRIES.find(x=>x.currency===e.target.value); if(c) setForm({...form, settings:{...form.settings, currency:c.currency, currencySymbol:c.symbol, numberFormat:c.format}})}}>{COUNTRIES.map(c=><option key={c.currency} value={c.currency}>{c.name}({c.currency}, {c.symbol})</option>)}</select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              </div>
            </div>
            
            <button onClick={()=>setShowFormatModal(true)} className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors h-[42px]"><span className="text-purple-600 font-bold">123</span> Number and Currency Format</button>
          </div>

          {/* DYNAMIC ITEMS TABLE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#8B5CF6] text-white text-[13px] font-medium">
                  <th className="py-3 px-4 w-[28%]">Item</th>
                  {form.columns?.find(c=>c.id==='hsn')?.visible && <th className="py-3 px-2 text-center">HSN/SAC</th>}
                  {form.columns?.find(c=>c.id==='quantity')?.visible && <th className="py-3 px-2 text-center">Quantity</th>}
                  {form.columns?.find(c=>c.id==='rate')?.visible && <th className="py-3 px-2 text-center">Rate</th>}
                  {form.columns?.find(c=>c.id==='amount')?.visible && <th className="py-3 px-2 text-center">Amount</th>}
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              {(live.items || []).map((it, idx) => (
                <tbody key={it.id} className={`group border-b border-slate-100 relative transition-all ${it.showUnit ? 'z-[150]' : 'z-0'}`}>
                  <tr className="align-bottom">
                    <td className="p-4 relative">
                      <div className="flex flex-col gap-4">
                        <span className="font-bold text-slate-800 text-base leading-none">{idx+1}.</span>
                        <div className="w-full border-b border-slate-200 pb-1.5 flex items-center relative">
                          <input 
                            className="w-full bg-transparent border-none text-[13px] text-slate-700 outline-none p-0" 
                            value={productSearch[it.id] !== undefined ? productSearch[it.id] : (it.name || '')} 
                            onFocus={() => {
                              setProductSearch(prev => ({ ...prev, [it.id]: it.name || '' }));
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setProductSearch(prev => {
                                  const np = {...prev};
                                  delete np[it.id];
                                  return np;
                                });
                              }, 200);
                            }}
                            onChange={e=>{
                              setProductSearch(prev => ({ ...prev, [it.id]: e.target.value }));
                              updateItem(it.id, 'name', e.target.value);
                            }} 
                            placeholder="Item Name / SKU Id"
                          />
                          {productSearch[it.id] !== undefined && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-md z-50 mt-1 max-h-48 overflow-y-auto overflow-x-hidden custom-scrollbar">
                              <button onClick={() => setShowProductModal(true)} className="w-full text-left px-4 py-2 text-[12px] font-bold text-purple-600 hover:bg-purple-50 border-b border-slate-100 flex items-center gap-2">
                                <PlusCircle size={14}/> + Add New Item
                              </button>
                              {products.filter(p => p.name.toLowerCase().includes((productSearch[it.id] || '').toLowerCase())).map(p => (
                                <button key={p.id} onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleProductSelect(it.id, p);
                                  setProductSearch(prev => {
                                    const np = {...prev};
                                    delete np[it.id];
                                    return np;
                                  });
                                }} className="w-full text-left px-4 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                                  {p.name} <span className="text-[10px] text-slate-400 ml-2">HSN: {p.hsnCode}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {form.columns?.find(c=>c.id==='hsn')?.visible && <td className="p-4 px-2"><div className="w-full border-b border-slate-200 pb-1.5 flex items-center gap-1"><span className="text-slate-300 text-xs">#</span><input className="w-full bg-transparent text-[13px] text-center outline-none" value={it.hsn || ''} onChange={e=>updateItem(it.id, 'hsn', e.target.value)}/></div></td>}
                    {form.columns?.find(c=>c.id==='quantity')?.visible && <td className="p-4 px-2"><div className="w-full border-b border-slate-200 pb-1.5 flex items-center"><input className="w-full bg-transparent text-[13px] text-center outline-none" value={it.quantity || ''} onChange={e=>updateItem(it.id, 'quantity', e.target.value)}/></div></td>}
                    {form.columns?.find(c=>c.id==='rate')?.visible && <td className="p-4 px-2"><div className="w-full border-b border-slate-200 pb-1.5 flex items-center gap-1"><span className="text-slate-300 text-xs">{form.settings.currencySymbol}</span><input className="w-full bg-transparent text-[13px] text-center outline-none" value={it.rate || ''} onChange={e=>updateItem(it.id, 'rate', e.target.value)}/></div></td>}
                    {form.columns?.find(c=>c.id==='amount')?.visible && <td className="p-4 px-2"><div className="w-full border-b border-slate-100 pb-1.5 text-center text-[13px] text-slate-500">{form.settings?.currencySymbol}{Number(it.amount || 0).toFixed(form.settings?.decimalDigits || 0)}</div></td>}
                    <td className="p-4 relative">
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-slate-400 hover:text-slate-700"><Copy size={16}/></button>
                        <button onClick={()=>deleteItem(it.id)} className="text-slate-400 hover:text-red-500"><X size={16}/></button>
                      </div>
                      <div className="w-full flex flex-col justify-end h-full">
                        <div className="w-full border-b border-slate-200 pb-1.5 text-right font-bold text-[13px] text-slate-800">
                          {form.settings?.currencySymbol}{Number(it.total || 0).toFixed(form.settings?.decimalDigits || 0)}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={10} className="px-4 pb-4">
                      <div className="relative group/unit w-max">
                        <button 
                          onClick={()=>updateItem(it.id, 'showUnit', !it.showUnit)} 
                          className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          <Scale size={14} className="text-purple-600"/> 
                          <span className="text-slate-400 uppercase tracking-widest text-[10px] font-black mr-1">Unit:</span>
                          <span className="text-slate-800 font-bold border-b border-slate-200 pb-0.5 min-w-[60px] text-left">
                            {it.unit || 'Select'}
                          </span> 
                          <ChevronDown size={14} className={`text-slate-400 transition-transform ${it.showUnit ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {it.showUnit && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white shadow-2xl border border-slate-100 rounded-xl z-[200] overflow-hidden animate-scale-up py-2">
                            {units.map(u => (
                              <button 
                                key={u.id} 
                                onClick={() => { updateItem(it.id, 'unit', u.name); updateItem(it.id, 'showUnit', false); }} 
                                className="w-full text-left px-5 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                              >
                                {u.name}
                              </button>
                            ))}
                            <div className="h-px bg-slate-50 my-1"/>
                            <button 
                              onClick={() => handleAddCustomUnit(it.id)} 
                              className="w-full text-left px-5 py-2.5 text-[12px] font-black text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              + Add Custom Unit
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              ))}
            </table>
            <div className="flex p-4 gap-4 bg-white border-t border-slate-100">
              <button onClick={()=>setForm({...form, items: [...form.items, defaultItem()]})} className="flex-1 py-2.5 text-[13px] font-medium text-purple-600 bg-white border border-slate-200 border-dashed rounded-md hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"><PlusSquare size={16}/> Add New Line</button>
            </div>
          </div>

          {/* TOTALS & FOOTER SECTION */}
          {/* TOTALS & FOOTER SECTION */}
          <div className="mt-12 bg-white -mx-10 px-10 py-16 border-t border-slate-100 space-y-12">
            
            {/* TOP SECTION: Summary & Signature (Moved to Top) */}
            <div className="flex flex-col lg:flex-row gap-12 justify-end">
              <div className="w-full lg:w-[450px] space-y-6">
                {/* Payment Summary Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[14px] font-bold text-slate-800">Total in PDF</h3>
                  </div>
                  
                  
                    <div className="space-y-4">
                      <div className="flex justify-between text-[14px]"><span className="text-slate-500">Amount</span><span className="font-bold text-slate-800">{form.settings?.currencySymbol}{Number(live.subtotal).toFixed(form.settings?.decimalDigits || 0)}</span></div>

                      <div className="flex justify-between text-[14px] items-center pt-2">
                        <span className="text-slate-500">Bank Charges</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 font-bold">{form.settings?.currencySymbol}</span>
                          <input 
                            type="number" 
                            className="w-20 text-right bg-transparent border-b border-slate-200 outline-none focus:border-purple-600 font-bold text-slate-800" 
                            value={form.totals?.additionalCharges || ''} 
                            onChange={e => setForm({...form, totals: {...form.totals, additionalCharges: Number(e.target.value)}})} 
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <div className="border-b border-dotted border-slate-400">
                        <span className="text-[18px] font-bold text-slate-800">Total ({form.settings?.currency || 'INR'})</span>
                      </div>
                      <span className="text-[24px] font-bold text-slate-800">{form.settings?.currencySymbol}{Number(live.grandTotal).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    {form.settings?.currency !== 'INR' && (
                      <div className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-slate-500 font-medium">Conversion Rate (to INR)</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              className="w-24 text-right bg-transparent border-b border-slate-200 outline-none focus:border-purple-600 font-bold text-slate-800" 
                              value={form.totals?.exchangeRate || ''} 
                              onChange={e => setForm({...form, totals: {...form.totals, exchangeRate: Number(e.target.value)}})} 
                              step="0.0001"
                            />
                            <span className="text-[11px] font-bold text-slate-400">INR</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="border-b border-dotted border-slate-400">
                            <span className="text-[15px] font-bold text-slate-500">Total (INR)</span>
                          </div>
                          <span className="text-[16px] font-bold text-slate-500">₹{Number(live.totalInINR).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total In Words Card */}
                <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[14px] font-bold text-slate-800">Total In Words</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[14px] font-medium text-slate-500 leading-relaxed break-words">
                      {live.totalInWords}
                    </p>
                  </div>
                </div>

                {/* Signature Area */}
                <div 
                  onClick={() => signInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-lg py-4 px-6 flex flex-col items-center justify-center gap-2 text-purple-600 cursor-pointer hover:bg-slate-50 transition-all min-h-[120px] relative group"
                >
                  {form.signature.image ? (
                    <>
                      <img src={form.signature.image} alt="Signature" className="max-h-24 object-contain" />
                      <div 
                        onClick={(e) => { e.stopPropagation(); setForm(f => ({...f, signature: {...f.signature, image: ''}})); }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                      >
                        <X size={14} />
                      </div>
                      <input 
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 text-center bg-transparent border-b border-dashed border-slate-200 focus:border-purple-600 outline-none w-full"
                        value={form.signature.label}
                        onChange={(e) => setForm(f => ({...f, signature: {...f.signature, label: e.target.value}}))}
                        placeholder="Signatory Label"
                      />
                    </>
                  ) : (
                    <>
                      <PenTool size={18} className="-rotate-90"/>
                      <span className="text-[14px] font-medium">Add Signature</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: Terms & Conditions (Full Width) */}
            <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm space-y-6 w-full">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                <div className="inline-block border-b-2 border-dotted border-slate-300">
                  <h3 className="text-[16px] font-bold text-slate-800">Terms and Conditions</h3>
                </div>
                <button className="text-purple-500 hover:text-purple-700 transition-colors">
                  <X size={20}/>
                </button>
              </div>
              
              <div className="space-y-0">
                {(form.totals.terms || []).map((term, idx) => (
                  <div key={term.id} className="group flex items-center justify-between py-4 border-b border-slate-50 last:border-0 transition-all">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-[14px] font-bold text-slate-800 min-w-[24px]">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <textarea
                        className="flex-1 bg-transparent border-none text-[14px] text-slate-600 outline-none p-0 resize-none min-h-[20px] focus:ring-0 leading-relaxed"
                        value={term.text}
                        onChange={(e) => updateTerm(term.id, e.target.value)}
                        placeholder="Enter condition..."
                        rows={1}
                        onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      />
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <button onClick={() => removeTerm(term.id)} className="p-1 text-purple-400 hover:text-purple-600 transition-colors"><X size={16}/></button>
                      <button onClick={() => moveTerm(idx, 1)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" disabled={idx === form.totals.terms.length - 1}><ArrowDown size={16}/></button>
                      <button onClick={() => moveTerm(idx, -1)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors" disabled={idx === 0}><ArrowUp size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <button onClick={addTerm} className="flex items-center gap-1.5 text-[14px] font-medium text-purple-600 hover:text-purple-800 transition-colors">
                  <div className="w-5 h-5 rounded-md border border-purple-200 flex items-center justify-center"><Plus size={12}/></div>
                  Add New Term
                </button>
              </div>
            </div>

          </div>
          </div>
          {/* ACTION BUTTONS */}
          <div className="mt-10 mb-20 flex flex-wrap items-center gap-6">
             {form.status === 'draft' && (
               <>
                 <button className="px-10 py-3.5 rounded-lg bg-slate-800 text-white font-bold text-[15px] shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all flex items-center gap-2" onClick={() => handleSave('draft')}>
                   <Save size={18} /> Save as Draft
                 </button>
                 <button className="px-10 py-3.5 rounded-lg bg-[#D81159] text-white font-bold text-[15px] shadow-lg shadow-rose-100 hover:bg-[#C11050] transition-all flex items-center gap-2" onClick={() => handleSave('sent')}>
                   <Send size={18} /> Submit Invoice
                 </button>
               </>
             )}
             <button className="px-10 py-3.5 rounded-lg border-2 border-slate-200 text-slate-600 font-bold text-[15px] hover:bg-slate-50 transition-all flex items-center gap-2" onClick={() => setShowPreview(true)}>
               <FileText size={18} /> Preview PDF
             </button>
          </div>
        </div>
      </div>
    </div>

      {/* MODALS */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100"><Percent size={24}/></div><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Configure Tax</h2><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Compliance Settings</p></div></div>
              <button onClick={()=>setShowTaxModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={24} className="text-slate-400"/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3"><label className="text-xs font-black text-slate-800 uppercase tracking-widest">Select Tax Type*</label><div className="relative"><select className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none cursor-pointer focus:border-purple-600 transition-colors" value={form.settings?.selectedTaxLabel} onChange={e=>{if(e.target.value==='create') return toast.info('Custom tax logic coming soon'); setForm({...form, settings:{...(form.settings || {}), selectedTaxLabel: e.target.value, gstEnabled: e.target.value !== 'NONE'}})}}>{TAX_TYPES.map(t=><option key={t} value={t}>{t}</option>)}<option value="create" className="text-purple-600 font-black">+Create New Tax</option></select><ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/></div></div>
              <div className="space-y-3"><label className="text-xs font-black text-slate-800 uppercase tracking-widest">Place of Supply</label><div className="relative"><select className="w-full bg-[#F8F9FD] border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none cursor-pointer" value={form.settings?.placeOfSupply} onChange={e=>setForm({...form, settings:{...(form.settings || {}), placeOfSupply: e.target.value}})}>{STATES.map(s=><option key={s} value={s}>{s}</option>)}</select><ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/></div></div>
              <div className="space-y-3"><label className="text-xs font-black text-slate-800 uppercase tracking-widest">GST Type</label><div className="grid grid-cols-2 gap-4 p-1.5 bg-[#F8F9FD] rounded-2xl"><button onClick={()=>setForm({...form, settings:{...(form.settings || {}), taxType:'CGST & SGST'}})} className={`py-3 rounded-xl text-xs font-black uppercase transition-all ${form.settings?.taxType === 'CGST & SGST' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>CGST & SGST</button><button onClick={()=>setForm({...form, settings:{...(form.settings || {}), taxType:'IGST'}})} className={`py-3 rounded-xl text-xs font-black uppercase transition-all ${form.settings?.taxType === 'IGST' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}>IGST</button></div></div>
            </div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end"><button onClick={()=>setShowTaxModal(false)} className="bg-[#8B5CF6] text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all">Save Changes</button></div>
          </div>
        </div>
      )}

      {showFormatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Number and Currency Format</h2>
              <button onClick={()=>setShowFormatModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Decimal Digits</p>
                <div className="grid grid-cols-3 gap-6">
                  {[0, 1, 2, 3, 4].map(d => (
                    <label key={d} onClick={()=>setForm({...form, settings:{...form.settings, decimalDigits: d}})} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.settings.decimalDigits === d ? 'border-purple-600' : 'border-slate-200'}`}><div className={`w-2.5 h-2.5 rounded-full ${form.settings.decimalDigits === d ? 'bg-purple-600' : ''}`}/></div>
                      <span className="text-sm font-bold text-slate-600">{d === 0 ? '99' : d === 1 ? '99.0' : `99.${'0'.repeat(d)}`}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <label onClick={()=>setForm({...form, settings:{...form.settings, roundQty: !form.settings.roundQty}})} className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.settings.roundQty ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-200'}`}>{form.settings.roundQty && <X size={12} className="text-white"/>}</div>
                  <span className="text-sm font-bold text-slate-500">Apply Round-off to Quantity</span>
                </label>
                <label onClick={()=>setForm({...form, settings:{...form.settings, roundRate: !form.settings.roundRate}})} className="flex items-center gap-4 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.settings.roundRate ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-200'}`}>{form.settings.roundRate && <X size={12} className="text-white"/>}</div>
                  <span className="text-sm font-bold text-slate-500">Apply Round-off to Rate</span>
                </label>
              </div>
            </div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end"><button onClick={()=>setShowFormatModal(false)} className="bg-[#8B5CF6] text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all">Save Changes</button></div>
          </div>
        </div>
      )}

      {showColumnsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100"><LayoutGrid size={24}/></div><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Edit Columns</h2><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Table Visibility</p></div></div>
              <button onClick={()=>setShowColumnsModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={24} className="text-slate-400"/></button>
            </div>
            <div className="p-10 space-y-6">{form.columns?.map(col => (<label key={col.id} className="flex items-center justify-between p-5 bg-[#F8F9FD] border border-slate-50 rounded-2xl cursor-pointer group hover:bg-white hover:border-purple-100 transition-all"><span className="text-sm font-black text-slate-700">{col.label}</span><div onClick={()=>setForm({...form, columns: form.columns.map(c=>c.id===col.id?{...c, visible: !c.visible}:c)})} className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${col.visible ? 'bg-purple-600' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${col.visible ? 'translate-x-5' : 'translate-x-0'}`}/></div></label>))}</div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end"><button onClick={()=>setShowColumnsModal(false)} className="bg-[#8B5CF6] text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all">Save Changes</button></div>
          </div>
        </div>
      )}

      <ClientRegistrationModal 
        isOpen={isClientModalOpen} 
        onClose={() => { setIsClientModalOpen(false); setClientToEdit(null); }} 
        onSuccess={handleClientSaveSuccess}
        editingClient={clientToEdit}
      />

      {showDueDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Configure Due Date</h2>
              <button onClick={() => setShowDueDateModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <label className="text-sm font-semibold text-slate-600">Set Due Date to</label>
                   <input 
                    type="number" 
                    className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-center outline-none focus:border-purple-600 transition-colors" 
                    value={daysToAdd} 
                    onChange={e => setDaysToAdd(e.target.value)}
                   />
                   <span className="text-sm font-medium text-slate-500">days after Invoice date</span>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer group pt-2">
                  <div className="w-4 h-4 rounded border border-slate-200 bg-slate-50 flex items-center justify-center transition-all group-hover:border-purple-300"/>
                  <span className="text-[13px] text-slate-500">Save for future documents</span>
                </label>

                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 mt-4">
                  <p className="text-[13px] text-purple-700 font-medium text-center">Your Due date will be <span className="font-bold">{formattedCalculatedDate}</span></p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
              <button onClick={() => setShowDueDateModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm">Cancel</button>
              <button 
                onClick={() => {
                  const date = getCalculatedDueDate();
                  const calculatedDate = date.toISOString().split('T')[0];
                  setForm({...form, header:{...form.header, dueDate: calculatedDate}});
                  setShowDueDateModal(false);
                }} 
                className="bg-[#8B5CF6] text-white font-bold px-8 py-2.5 rounded-xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showCustomFieldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
              <h2 className="text-lg font-bold text-slate-800">Add Custom Field</h2>
              <button onClick={() => {setShowCustomFieldModal(false); setTempCustomField({label:'', value:'', setAsDefault:false});}} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400"/></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-600">Label*</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-purple-600 transition-colors" 
                  placeholder="Enter field label"
                  value={tempCustomField.label}
                  onChange={e => setTempCustomField({...tempCustomField, label: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-600">Value</label>
                <input 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-purple-600 transition-colors" 
                  placeholder="Enter field value"
                  value={tempCustomField.value}
                  onChange={e => setTempCustomField({...tempCustomField, value: e.target.value})}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer group mt-2">
                <div 
                  onClick={() => setTempCustomField({...tempCustomField, setAsDefault: !tempCustomField.setAsDefault})} 
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${tempCustomField.setAsDefault ? 'bg-purple-600 border-purple-600' : 'bg-white border-slate-200'}`}
                >
                  {tempCustomField.setAsDefault && <X size={10} className="text-white"/>}
                </div>
                <span className="text-[13px] text-slate-500">Set as default value</span>
              </label>
            </div>
            <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
              <button onClick={() => {setShowCustomFieldModal(false); setTempCustomField({label:'', value:'', setAsDefault:false});}} className="px-6 py-2 rounded-xl font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-all text-sm">Cancel</button>
              <button onClick={handleSaveCustomField} className="bg-[#8B5CF6] text-white font-bold px-8 py-2 rounded-xl shadow-lg shadow-purple-100 hover:bg-[#7C3AED] transition-all text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {isBilledByModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-bold text-slate-800">Business Details</h2>
              <button onClick={() => setIsBilledByModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={20} className="text-slate-400" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[13px] font-semibold text-slate-600">Vendor's Business Name*</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none focus:border-purple-600" value={billedByDetails.businessName} onChange={e => handleBilledByChange('businessName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Select Country*</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none cursor-pointer" value={billedByDetails.country} onChange={e => handleBilledByChange('country', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">City/Town</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.city} onChange={e => handleBilledByChange('city', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Business GSTIN</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.gstin} onChange={e => handleBilledByChange('gstin', e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Business PAN Number</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.pan} onChange={e => handleBilledByChange('pan', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Select Country</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none" value={billedByDetails.addressCountry} onChange={e => handleBilledByChange('addressCountry', e.target.value)}>
                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">State / Province</label>
                    <div className="relative">
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none appearance-none" value={billedByDetails.state} onChange={e => handleBilledByChange('state', e.target.value)}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">City/Town</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.addressCity} onChange={e => handleBilledByChange('addressCity', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Postal Code / Zip Code</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.postalCode} onChange={e => handleBilledByChange('postalCode', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[13px] font-semibold text-slate-600">Street Address</label>
                    <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none resize-none" value={billedByDetails.streetAddress} onChange={e => handleBilledByChange('streetAddress', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5 col-span-2">
                    <label className="text-[13px] font-semibold text-slate-600">Display Name</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.displayName} onChange={e => handleBilledByChange('displayName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Email</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.email} onChange={e => handleBilledByChange('email', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-slate-600">Phone No.</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-[13px] outline-none" value={billedByDetails.phone} onChange={e => handleBilledByChange('phone', e.target.value)} />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => handleBilledByChange('showEmail', !billedByDetails.showEmail)} className={`w-4 h-4 rounded border flex items-center justify-center ${billedByDetails.showEmail ? 'bg-purple-600 border-purple-600' : 'bg-slate-50 border-slate-200'}`}>{billedByDetails.showEmail && <X size={10} className="text-white"/>}</div>
                    <span className="text-[13px] text-slate-500">Show Email in Invoice</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => handleBilledByChange('showPhone', !billedByDetails.showPhone)} className={`w-4 h-4 rounded border flex items-center justify-center ${billedByDetails.showPhone ? 'bg-purple-600 border-purple-600' : 'bg-slate-50 border-slate-200'}`}>{billedByDetails.showPhone && <X size={10} className="text-white"/>}</div>
                    <span className="text-[13px] text-slate-500">Show Phone in Invoice</span>
                  </label>
                </div>
              </div>

              {/* Update Options */}
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => handleBilledByChange('updateFuture', true)} className={`w-4 h-4 rounded-full border flex items-center justify-center ${billedByDetails.updateFuture ? 'border-purple-600' : 'border-slate-200'}`}>{billedByDetails.updateFuture && <div className="w-2 h-2 bg-purple-600 rounded-full"/>}</div>
                  <span className="text-[13px] text-slate-600">Update changes for Previous and Future documents</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => handleBilledByChange('updateFuture', false)} className={`w-4 h-4 rounded-full border flex items-center justify-center ${!billedByDetails.updateFuture ? 'border-purple-600' : 'border-slate-200'}`}>{!billedByDetails.updateFuture && <div className="w-2 h-2 bg-purple-600 rounded-full"/>}</div>
                  <span className="text-[13px] text-slate-600">Only update for Future documents</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-end">
              <button onClick={() => setIsBilledByModalOpen(false)} className="bg-[#8B5CF6] text-white font-bold px-12 py-3 rounded-xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all">Save</button>
            </div>
          </div>
        </div>
      )}
      {showExtraFieldModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Add Shipping Field</h2>
              <button onClick={() => setShowExtraFieldModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Field Label</label>
                <input 
                  className="shipping-input" 
                  placeholder="e.g. Phone, Delivery Note" 
                  value={tempExtraField.label}
                  onChange={e => setTempExtraField({...tempExtraField, label: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Value</label>
                <input 
                  className="shipping-input" 
                  placeholder="e.g. +1 234 567" 
                  value={tempExtraField.value}
                  onChange={e => setTempExtraField({...tempExtraField, value: e.target.value})}
                />
              </div>
              <button 
                onClick={saveExtraField}
                className="w-full bg-[#8B5CF6] text-white font-black py-4 rounded-xl shadow-lg shadow-purple-100 hover:bg-[#7C3AED] transition-all mt-4"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
      {showPreview && (
        <InvoicePreview 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          data={{ ...form, ...live, items: live.items, billedBy: billedByDetails, billedTo: { ...form.client, ...selectedClient } }}
          settings={billedByDetails}
        />
      )}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-100"><PlusCircle size={24}/></div><div><h2 className="text-2xl font-black text-slate-800 tracking-tight">Add New Item</h2><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Create reusable product</p></div></div>
              <button onClick={()=>setShowProductModal(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-all"><X size={24} className="text-slate-400"/></button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Item Name*</label>
                <input className="settings-input" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Graphic Design Services"/>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">HSN/SAC Code</label>
                <input className="settings-input" value={newProduct.hsnCode} onChange={e=>setNewProduct({...newProduct, hsnCode: e.target.value})} placeholder="e.g. 998313"/>
              </div>
            </div>
            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-4">
              <button onClick={()=>setShowProductModal(false)} className="text-slate-500 font-black px-8 py-4 rounded-2xl hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={handleAddProduct} className="bg-[#8B5CF6] text-white font-black px-10 py-4 rounded-2xl shadow-xl shadow-purple-100 hover:bg-[#7C3AED] transition-all">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceForm;
