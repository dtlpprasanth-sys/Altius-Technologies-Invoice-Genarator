import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { Plus, Search, Trash2, Eye, Download, FileText, Bell, MoreVertical, CheckCircle2, Clock, AlertCircle, Send, FileEdit } from 'lucide-react';
import { toast } from 'react-toastify';

const STATUSES = ['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'];

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [downloading, setDownloading] = useState(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceApi.getAll({ search, status, limit: 50 });
      setInvoices(data.invoices || []);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, [search, status]);

  const handleDelete = async (id, num, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete invoice ${num}?`)) return;
    try {
      await invoiceApi.delete(id);
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
      a.href = url; a.download = `${num}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF generation failed'); }
    finally { setDownloading(null); }
  };

  const getStatusConfig = (s) => {
    switch(s.toLowerCase()) {
      case 'paid': return { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
      case 'overdue': return { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: AlertCircle };
      case 'sent': return { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Send };
      case 'draft': return { color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200', icon: FileEdit };
      case 'cancelled': return { color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: AlertCircle };
      default: return { color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: FileText };
    }
  };

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold border ${config.bg} ${config.color}`}>
        <Icon size={12} strokeWidth={3} />
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen animate-fade-in pb-12">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 md:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Manage and track your billings</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all relative">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          <Link to="/invoices/new" className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 active:scale-95">
            <Plus size={18} strokeWidth={3} /> Create Invoice
          </Link>
        </div>
      </header>

      <div className="px-6 py-8 md:px-10 max-w-7xl mx-auto w-full flex-1">
        
        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
          <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner border border-slate-200/50 overflow-x-auto custom-scrollbar">
            {STATUSES.map(s => (
              <button 
                key={s} 
                onClick={() => setStatus(s)}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                  status === s 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoices or clients..."
              className="w-full bg-white border border-slate-200 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-medium rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold tracking-wide animate-pulse">Loading Invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 border-dashed p-12 md:p-20 text-center max-w-3xl mx-auto mt-6 shadow-sm animate-slide-up">
            <div className="w-28 h-28 bg-gradient-to-tr from-primary-50 to-indigo-50 border-8 border-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-8">
              <FileText size={48} className="text-primary-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">No invoices yet</h3>
            <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
              Get paid faster by creating and sending your first professional invoice in minutes.
            </p>
            <Link to="/invoices/new" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95">
              <Plus size={20} strokeWidth={3}/> Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
            {invoices.map(inv => (
              <div 
                key={inv._id} 
                onClick={() => navigate(`/invoices/${inv._id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col relative overflow-hidden"
              >
                {/* Decorative top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-primary-400 transition-colors duration-500"></div>

                <div className="flex justify-between items-start mb-5">
                  <StatusBadge status={inv.status} />
                  
                  <div className="relative z-10" onClick={e => e.stopPropagation()}>
                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                      <MoreVertical size={18} strokeWidth={2.5} />
                    </button>
                    {/* Quick actions popover on hover */}
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 flex flex-col gap-1 min-w-[120px]">
                       <button onClick={(e) => handleDownload(inv._id, inv.invoiceNumber, e)} disabled={downloading===inv._id} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 text-slate-700 rounded-lg transition-colors text-left">
                         {downloading===inv._id ? <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"/> : <Download size={14} strokeWidth={2.5}/>}
                         Download
                       </button>
                       <button onClick={(e) => handleDelete(inv._id, inv.invoiceNumber, e)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-left">
                         <Trash2 size={14} strokeWidth={2.5}/>
                         Delete
                       </button>
                    </div>
                  </div>
                </div>

                <h4 className="text-slate-400 font-bold text-[11px] tracking-widest uppercase mb-1">{inv.invoiceNumber}</h4>
                <h3 className="text-lg font-black text-slate-900 mb-5 line-clamp-1" title={inv.clientName || 'No Client'}>{inv.clientName || 'Draft Invoice'}</h3>
                
                <div className="mt-auto pt-5 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock size={12} strokeWidth={2.5} /> Due {formatDate(inv.dueDate)}
                    </p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(inv.total, inv.currency)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:border-primary-100 transition-all shadow-sm">
                    <Eye size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
