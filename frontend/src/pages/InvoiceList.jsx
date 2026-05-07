import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  Plus, Search, Trash2, Eye, Download, 
  FileText, Bell, MoreVertical, 
  ChevronLeft, ChevronRight, Copy, CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import DeleteInvoiceModal from '../components/DeleteInvoiceModal';

const STATUSES = [
  { key: 'all',   label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent',  label: 'Submitted' },
  { key: 'paid',  label: 'Paid (Payment)' }
];

const InvoiceList = ({ type = 'invoice' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [downloading, setDownloading] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, num: '' });

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { 
        search, 
        status, 
        type,
        startDate, 
        endDate, 
        page: currentPage, 
        limit: 10 
      };
      const { data } = await invoiceApi.getAll(params);
      setInvoices(data.invoices || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch { 
      if (!silent) toast.error('Failed to load invoices'); 
    }
    finally { 
      if (!silent) setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchInvoices(); 

    // Synchronization: Refresh when window gets focus
    const handleFocus = () => fetchInvoices(true);
    window.addEventListener('focus', handleFocus);
    
    // Synchronization: Periodic polling (every 15s)
    const interval = setInterval(() => fetchInvoices(true), 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [search, status, startDate, endDate, currentPage]);

  const handleDelete = (id, num, e) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, id, num });
  };

  const confirmDelete = async (reason) => {
    try {
      await invoiceApi.delete(deleteDialog.id, { reason });
      toast.success('Invoice deleted and archived');
      setDeleteDialog({ ...deleteDialog, isOpen: false });
      fetchInvoices();
    } catch { toast.error('Delete failed'); }
  };

  const handleMarkAsPaid = async (id, e) => {
    e.stopPropagation();
    try {
      await invoiceApi.markAsPaid(id);
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update status');
    }
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

  const handleDuplicate = async (id, e) => {
    e.stopPropagation();
    try {
      const { data } = await invoiceApi.duplicate(id);
      toast.success(`Invoice duplicated! New Invoice: ${data.invoiceNumber}`);
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Duplication failed');
    }
  };

  const getStatusClass = (s) => {
    const st = s?.toLowerCase();
    if (st === 'draft') return 'status-draft';
    if (st === 'sent' || st === 'paid') return 'status-paid';
    return 'status-pending';
  };

  const getStatusLabel = (s) => {
    const st = s?.toLowerCase();
    if (st === 'sent' || st === 'paid') return 'Submitted';
    if (st === 'draft') return 'Draft';
    return s || 'Draft';
  };

  const getPaymentStatusClass = (s) => {
    const st = s?.toLowerCase();
    if (st === 'paid') return 'status-paid';
    return 'status-pending'; // Unpaid
  };

  const getPaymentStatusLabel = (s) => {
    if (!s || s === 'unpaid') return 'Unpaid';
    if (s === 'paid') return 'Paid';
    return s;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] animate-fade-in">
      
      {/* PAGE HEADER */}
      <header className="h-16 bg-white border-b border-[#E4E4E0] flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="page-header-left">
          <h1 className="text-[26px] font-bold text-[#0C0E10] leading-tight font-heading">{type === 'proforma' ? 'Proforma Invoices' : 'Invoices'}</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5 font-medium">{type === 'proforma' ? 'Manage and track your proforma billings' : 'Manage and track your billings'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to={type === 'proforma' ? '/proforma-invoices/new' : '/invoices/new'} className="btn-green-sm ml-2 flex items-center gap-2 h-9 px-4 rounded-[5px] bg-[#95BF47] text-[#02172E] font-bold text-sm hover:bg-[#85AF37] transition-all">
            <Plus size={16} strokeWidth={3} /> Create {type === 'proforma' ? 'Proforma' : 'Invoice'}
          </Link>
        </div>
      </header>

      <div className="page-body p-8 px-8 max-w-[1600px] mx-auto w-full">
        
        {/* CONTROL BAR */}
        <div className="bg-white border border-[#E4E4E0] rounded-[5px] p-5 mb-4 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0 h-10">
              {STATUSES.map(s => (
                <button 
                  key={s.key} 
                  onClick={() => { setStatus(s.key); setCurrentPage(1); }}
                  className={`h-10 px-4 text-[13px] font-medium transition-all border-b-2 whitespace-nowrap ${
                    status === s.key 
                      ? 'text-[#0C0E10] font-bold border-[#95BF47]' 
                      : 'text-[#6B7280] border-transparent hover:text-[#0C0E10]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative w-72 flex items-center bg-[#FAFAF8] border border-[#E4E4E0] rounded-[5px] h-10 px-3 focus-within:bg-white focus-within:border-[#95BF47] transition-all">
              <Search size={16} className="text-[#6B7280] flex-shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search invoices or clients..."
                className="w-full bg-transparent border-none outline-none pl-2.5 text-[13px] font-medium text-[#0C0E10] placeholder:text-[#6B7280]"
              />
            </div>
          </div>

          {/* DATE FILTERS */}
          <div className="flex items-center gap-4 pt-4 border-t border-[#F4F4F1]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">From:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="bg-[#FAFAF8] border border-[#E4E4E0] rounded-[4px] px-3 py-1.5 text-[13px] font-medium text-[#0C0E10] focus:border-[#95BF47] outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wider">To:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="bg-[#FAFAF8] border border-[#E4E4E0] rounded-[4px] px-3 py-1.5 text-[13px] font-medium text-[#0C0E10] focus:border-[#95BF47] outline-none"
              />
            </div>
            {(startDate || endDate || search !== '' || status !== 'all') && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setSearch(''); setStatus('all'); setCurrentPage(1); }}
                className="text-[12px] font-bold text-[#CC3A3A] hover:underline ml-auto"
              >
                Reset Filters
              </button>
            )}
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
              
              <h3 className="text-[22px] font-bold text-[#0C0E10] font-heading mb-2">No invoices found</h3>
              <p className="text-[14px] text-[#6B7280] max-w-sm mb-8 leading-relaxed">
                We couldn't find any invoices matching your selected filters. Try adjusting your search or dates.
              </p>
              <button 
                onClick={() => { setStatus('all'); setSearch(''); setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                className="text-[#95BF47] font-bold text-[14px] hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#02172E] text-white">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[60px]">#</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[180px]">Invoice No</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Issue Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Due Date</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[160px] text-right">Amount</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[140px]">Payment</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[150px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E0]">
                  {invoices.map((inv, index) => (
                      <tr 
                        key={inv.id || inv._id} 
                        className="hover:bg-[#F3F8E8] transition-all group cursor-pointer"
                        onClick={() => navigate(type === 'proforma' ? `/proforma-invoices/${inv.id || inv._id}/edit` : `/invoices/${inv.id || inv._id}/edit`)}
                      >
                      <td className="px-6 py-4 text-[13px] font-bold text-[#6B7280]">{(currentPage - 1) * 10 + index + 1}</td>
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
                      <td className="px-6 py-4">
                        <span className={`status-badge ${getPaymentStatusClass(inv.paymentStatus)}`}>
                          {getPaymentStatusLabel(inv.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 transition-all">
                          <button onClick={() => navigate(type === 'proforma' ? `/proforma-invoices/${inv.id || inv._id}` : `/invoices/${inv.id || inv._id}`)} className="p-1.5 text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8] rounded-md transition-all" title="View"><Eye size={16}/></button>
                          <button onClick={(e) => handleDownload(inv.id || inv._id, inv.invoiceNumber, e)} className="p-1.5 text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8] rounded-md transition-all" title="Download">{downloading===(inv.id || inv._id) ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#95BF47] rounded-full animate-spin"/> : <Download size={16}/>}</button>
                          <button onClick={(e) => handleDuplicate(inv.id || inv._id, e)} className="p-1.5 text-[#6B7280] hover:text-[#95BF47] hover:bg-[#F3F8E8] rounded-md transition-all" title="Duplicate"><Copy size={16}/></button>
                          {inv.paymentStatus !== 'paid' && (
                            <button onClick={(e) => handleMarkAsPaid(inv.id || inv._id, e)} className="p-1.5 text-[#6B7280] hover:text-[#15803D] hover:bg-[#DCFCE7] rounded-md transition-all" title="Mark as Paid"><CheckCircle size={16}/></button>
                          )}
                          <button onClick={(e) => handleDelete(inv.id || inv._id, inv.invoiceNumber, e)} className="p-1.5 text-[#6B7280] hover:text-[#CC3A3A] hover:bg-[#FEF2F2] rounded-md transition-all" title="Delete"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION FOOTER */}
              <div className="px-6 py-4 border-t border-[#E4E4E0] flex items-center justify-between bg-white">
                <div className="text-[13px] text-[#6B7280] font-medium">
                  Showing <span className="font-bold text-[#0C0E10]">{invoices.length}</span> of <span className="font-bold text-[#0C0E10]">{totalCount}</span> invoices
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 border border-[#E4E4E0] rounded-[4px] text-[#6B7280] hover:bg-[#FAFAF8] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="px-4 text-[13px] font-bold text-[#0C0E10]">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 border border-[#E4E4E0] rounded-[4px] text-[#6B7280] hover:bg-[#FAFAF8] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <DeleteInvoiceModal 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ ...deleteDialog, isOpen: false })}
        onConfirm={confirmDelete}
        invoiceNumber={deleteDialog.num}
      />
    </div>
  );
};

export default InvoiceList;
