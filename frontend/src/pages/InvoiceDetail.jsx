import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceApi, settingsApi } from '../services/api';
import { ArrowLeft, Edit, Download, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import ExportInvoicePDF from '../components/ExportInvoicePDF';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const invoiceRef = useRef();

  useEffect(() => {
    Promise.all([invoiceApi.getById(id), settingsApi.get()])
      .then(([invRes, setRes]) => {
        setInvoice(invRes.data);
        if (setRes.data) setSettings(setRes.data);
      })
      .catch(() => toast.error('Invoice not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoiceApi.delete(id);
      toast.success('Deleted successfully');
      navigate('/invoices');
    } catch { toast.error('Error deleting invoice'); }
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const { data } = await invoiceApi.downloadPDF(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      const safeName = (invoice.invoiceNumber || 'Invoice').replace(/[/\\?%*:|"<>]/g, '_');
      a.download = `${safeName}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('PDF generation failed'); }
    finally { setPdfLoading(false); }
  };

  const statusBadge = (s) => {
    const map = { 
      draft: 'bg-slate-100 text-slate-600',
      sent: 'bg-blue-100 text-blue-600',
      paid: 'bg-emerald-100 text-emerald-600',
      overdue: 'bg-rose-100 text-rose-600',
      cancelled: 'bg-slate-200 text-slate-400'
    };
    return <span className={`${map[s] || 'bg-slate-100 text-slate-600'} text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full`}>{s}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>;
  if (!invoice) return <div className="p-8 text-center text-slate-500 font-bold">Invoice not found</div>;

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto pb-32 font-serif">
      {/* ACTION BAR */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-10 font-sans">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">{invoice.invoiceNumber}</h2>
            <div className="flex items-center gap-2 mt-0.5">{statusBadge(invoice.status)}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/invoices/${id}/edit`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all">
            <Edit size={18}/> Edit
          </Link>
          <button onClick={handlePDF} disabled={pdfLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 disabled:opacity-50">
            <Download size={18}/> {pdfLoading ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-100 text-rose-500 font-bold text-sm hover:bg-rose-50 transition-all">
            <Trash2 size={18}/> Delete
          </button>
        </div>
      </div>

      {/* INVOICE CONTENT */}
      <div className="max-w-[1000px] mx-auto p-4 md:p-8 flex flex-col items-center">
        <div ref={invoiceRef} className="bg-slate-100 flex flex-col items-center">
          <ExportInvoicePDF data={invoice} settings={settings} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
