import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  Plus, Search, Trash2, Eye, Download, 
  FileText, Bell, MoreVertical, 
  Send, FileEdit, Trash
} from 'lucide-react';
import { toast } from 'react-toastify';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUSES = [
  { key: 'all',   label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent',  label: 'Submitted' }
];

const InvoiceList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('all');
  const [downloading, setDownloading] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, num: '' });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceApi.getAll({ search, status, limit: 50 });
      setInvoices(Array.isArray(data) ? data : (data.invoices || []));
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchInvoices(); 

    // Synchronization: Refresh when window gets focus
    const handleFocus = () => fetchInvoices();
    window.addEventListener('focus', handleFocus);
    
    // Synchronization: Periodic polling (every 15s)
    const interval = setInterval(fetchInvoices, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [search, status]);

  const handleDelete = (id, num, e) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id, num });
  };

  const confirmDelete = async () => {
    try {
      await invoiceApi.delete(deleteDialog.id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch { toast.error('Delete failed'); }
  };

  const handleDownload = async (id, num, e) => {
    e.stopPropagation();
    setDownloading(id);
    try {
      const { data } = await invoiceApi.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      const safeName = (num || 'Invoice').replace(/[/\\?%*:|"<>]/g, '_');
      a.href = url; a.download = `${safeName}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF generation failed'); }
    finally { setDownloading(null); }
  };

  const getStatusClass = (s) => {
    const st = s?.toLowerCase();
    if (st === 'draft') return 'status-draft';
    if (st === 'sent')  return 'status-sent';  // Submitted
    return 'status-pending';
  };

  const getStatusLabel = (s) => {
    const st = s?.toLowerCase();
    if (st === 'sent') return 'Submitted';
    if (st === 'draft') return 'Draft';
    return s || 'Draft';
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] animate-fade-in">
      
      {/* PAGE HEADER */}
      <header className="h-16 bg-white border-b border-[#E4E4E0] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="page-header-left">
          <h1 className="text-[26px] font-bold text-[#0C0E10] leading-tight font-heading">Invoices</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium">Manage and track your billings</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/invoices/new" className="btn-green-sm ml-2 flex items-center gap-2 h-9 px-4 rounded-[5px] bg-[#95BF47] text-[#02172E] font-bold text-sm hover:bg-[#85AF37] transition-all">
            <Plus size={16} strokeWidth={3} /> Create Invoice
          </Link>
        </div>
      </header>

      <div className="page-body p-8 px-8 max-w-[1600px] mx-auto w-full">
        
        {/* CONTROL BAR */}
        <div className="h-[52px] bg-white border border-[#E4E4E0] rounded-[5px] flex items-center justify-between px-5 mb-4 shadow-sm">
          <div className="flex items-center gap-0 h-full">
            {STATUSES.map(s => (
              <button 
                key={s.key} 
                onClick={() => setStatus(s.key)}
                className={`h-[52px] px-4 text-[13px] font-medium transition-all border-b-2 whitespace-nowrap ${
                  status === s.key 
                    ? 'text-[#0C0E10] font-bold border-[#95BF47]' 
                    : 'text-[#6B7280] border-transparent hover:text-[#0C0E10]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-72 flex items-center bg-white border border-[#E4E4E0] rounded-[5px] h-9 px-3 focus-within:border-[#95BF47] focus-within:ring-4 focus-within:ring-[#95BF47]/10 transition-all">
            <Search size={16} className="text-[#6B7280] flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices or clients..."
              className="w-full bg-transparent border-none outline-none pl-2.5 text-[13px] font-medium text-[#0C0E10] placeholder:text-[#6B7280]"
            />
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="panel shadow-sm min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-10 h-10 border-4 border-[#95BF47]/20 border-t-[#95BF47] rounded-full animate-spin mb-4" />
              <p className="text-[#6B7280] font-bold text-sm animate-pulse">Loading Invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="empty-state py-24 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#FAFAF8] rounded-full flex items-center justify-center mb-6 border border-[#E4E4E0]">
                <FileText size={32} className="text-[#6B7280]" />
              </div>
              
              {search === '' ? (
                <>
                  <h3 className="text-[22px] font-bold text-[#0C0E10] font-heading mb-2">No invoices found</h3>
                  <p className="text-[14px] text-[#6B7280] max-w-sm mb-8 leading-relaxed">
                    {status === 'all' ? 'No invoices yet.' : `No ${status === 'sent' ? 'Submitted' : 'Draft'} invoices yet.`} Create your first invoice to get started.
                  </p>
                  <Link to="/invoices/new" className="btn-navy h-11 px-8 rounded-[5px] text-sm flex items-center gap-2">
                    <Plus size={18} strokeWidth={3} /> Create your first invoice
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-[22px] font-bold text-[#0C0E10] font-heading mb-2">No results matching filters</h3>
                  <p className="text-[14px] text-[#6B7280] max-w-sm mb-8 leading-relaxed">
                    We couldn't find any {status === 'all' ? '' : (status === 'sent' ? 'Submitted ' : 'Draft ')}invoices matching "{search}".
                  </p>
                  <button 
                    onClick={() => { setStatus('all'); setSearch(''); }}
                    className="text-[#95BF47] font-bold text-[14px] hover:underline"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#02172E] text-white">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[40px]"><input type="checkbox" className="w-4 h-4 accent-[#95BF47] rounded" /></th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[180px]">Invoice No</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Issue Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Due Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[160px] text-right">Amount</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[100px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {invoices.map(inv => (
                      <tr 
                        key={inv.id || inv._id} 
                        className="hover:bg-[#F3F8E8] transition-all group cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv.id || inv._id}/edit`)}
                      >
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" className="w-4 h-4 accent-[#95BF47] rounded" /></td>
                      <td className="px-6 py-4 text-[14px] font-bold text-[#0C0E10] whitespace-nowrap">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-[14px] text-[#0C0E10]">{inv.clientName || 'Draft'}</td>
                      <td className="px-6 py-4 text-[13px] text-[#6B7280]">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-6 py-4 text-[13px] text-[#6B7280]">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4 text-[14px] font-bold text-[#0C0E10] text-right">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="px-6 py-4">
                        <span className={`status-badge ${getStatusClass(inv.status)}`}>
                          {getStatusLabel(inv.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-3 transition-all">
                          <button onClick={() => navigate(`/invoices/${inv.id || inv._id}`)} className="text-[#6B7280] hover:text-[#95BF47] transition-all" title="View"><Eye size={16}/></button>
                          <button onClick={(e) => handleDownload(inv.id || inv._id, inv.invoiceNumber, e)} className="text-[#6B7280] hover:text-[#95BF47] transition-all" title="Download">{downloading===(inv.id || inv._id) ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#95BF47] rounded-full animate-spin"/> : <Download size={16}/>}</button>
                          <button onClick={(e) => handleDelete(inv.id || inv._id, inv.invoiceNumber, e)} className="text-[#6B7280] hover:text-[#CC3A3A] transition-all" title="Delete"><Trash size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      <ConfirmDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteDialog.num}? This action cannot be undone.`}
        confirmText="Delete Invoice"
      />
    </div>
  );
};

export default InvoiceList;
