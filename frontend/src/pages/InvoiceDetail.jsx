import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invoiceApi, settingsApi } from '../services/api';
import { formatCurrency, formatDate, numberToWords } from '../utils/helpers';
import { ArrowLeft, Edit, Download, Trash2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [settings, setSettings] = useState({});
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
      a.download = `${invoice.invoiceNumber || 'Invoice'}.pdf`;
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

  const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[invoice.currency] || invoice.currency;

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto pb-32">
      {/* ACTION BAR */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
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

      {/* INSTITUTIONAL EXPORT PREVIEW */}
      <div className="bg-white p-[15mm] border border-slate-200 shadow-2xl relative overflow-hidden mx-auto max-w-[210mm]" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
        
        {/* TOP HEADER */}
        <div className="flex justify-between items-start mb-4">
          <div className="w-64">
            {invoice.logoUrl ? <img src={invoice.logoUrl} alt="Logo" className="max-w-full h-auto"/> : <div className="text-3xl font-black text-slate-200">LOGO</div>}
          </div>
          <div className="text-right text-[12px] space-y-0.5 leading-tight font-medium">
            <h1 className="text-[14px] font-bold uppercase">{invoice.business?.businessName || invoice.business?.name || invoice.businessName}</h1>
            <p className="whitespace-pre-line">{invoice.business?.streetAddress || invoice.business?.address || invoice.businessAddress}</p>
            {(settings.phone || invoice.business?.phone) && <p className="font-bold tracking-tight">Phone: {settings.phone || invoice.business?.phone}</p>}
            {(invoice.businessGstin || invoice.business?.gstin) && <p className="font-bold uppercase tracking-tight">GSTIN: {invoice.businessGstin || invoice.business?.gstin}</p>}
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-[24px] font-bold uppercase tracking-[6px] mb-1">{invoice.invoiceTitle || invoice.header?.title || 'TAX INVOICE'}</h2>
          { (invoice.lutDetails || invoice.businessDetails?.lutDetails) && (
            <p className="text-[9px] font-bold uppercase italic opacity-90 leading-relaxed tracking-tight max-w-[80%] mx-auto">
              {invoice.lutDetails || invoice.businessDetails?.lutDetails}
            </p>
          )}
        </div>

        {/* BOXED GRID INFO */}
        <div className="grid grid-cols-3 border border-black text-[12px] border-collapse">
          {/* Box 1: Invoice Details */}
          <div className="border-r border-black p-3 space-y-4">
            <h3 className="font-bold text-[13px] mb-2 underline">Invoice Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-bold">Invoice No #</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Invoice Date</span>
                <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Billed By */}
          <div className="border-r border-black p-3 space-y-3">
            <h3 className="font-bold text-[13px] mb-2 underline">Billed By</h3>
            <p className="font-bold text-[14px] uppercase">{invoice.business?.businessName || invoice.businessName}</p>
            <div className="leading-[1.4] text-[11px] space-y-1">
              {invoice.business?.email && <p><span className="font-medium text-slate-600">Email:</span> {invoice.business.email}</p>}
              {(settings.phone || invoice.business?.phone) && <p><span className="font-medium text-slate-600">Phone:</span> {settings.phone || invoice.business?.phone}</p>}
              {(settings.telephone || invoice.business?.telephone) && <p><span className="font-medium text-slate-600">Telephone:</span> {settings.telephone || invoice.business?.telephone}</p>}
              {(settings.website || invoice.website || invoice.business?.website) && <p><span className="font-medium text-slate-600">Website:</span> {settings.website || invoice.website || invoice.business?.website}</p>}
            </div>
          </div>

          {/* Box 3: Billed To */}
          <div className="p-3 space-y-2">
            <h3 className="font-bold text-[13px] mb-2 underline">Billed To</h3>
            <p className="font-bold text-[14px]">{invoice.clientName}</p>
            <p className="leading-[1.4] text-[11px] whitespace-pre-line">
              {invoice.clientAddress}
            </p>
            <div className="pt-2 space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span className="font-bold">Export Currency:</span><span>{invoice.currency}</span></div>
              {Number(invoice.exchangeRate) > 1 && <div className="flex justify-between"><span className="font-bold">Conversion Rate:</span><span>{invoice.exchangeRate} INR</span></div>}
              {invoice.poNoAndDate && (
                <div className="flex justify-between gap-2 mt-1">
                  <span className="font-bold shrink-0">Purchase Order No & Date:</span>
                  <span className="text-right">{invoice.poNoAndDate}</span>
                </div>
              )}
              <p className="leading-[1.3] text-[10px] mt-1 font-bold">Type of Software Export: <span className="font-medium italic">{invoice.softwareExportType || 'Data Entry and conversion, Software processing, RBI Code: 907'}</span></p>
            </div>
          </div>
        </div>

        {/* SEPARATOR ROW */}
        <div className="h-6 border-x border-black flex items-center px-4 relative">
          <div className="absolute right-4 font-bold text-[16px]">.</div>
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full border-collapse border border-black text-[12px]">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="border-r border-black p-2 text-center w-[40px]">.</th>
              <th className="border-r border-black p-2 text-left">Item</th>
              <th className="border-r border-black p-2 text-center w-[120px]">HSN/SAC</th>
              <th className="border-r border-black p-2 text-center w-[80px]">Quantity</th>
              <th className="border-r border-black p-2 text-center w-[80px]">UOM</th>
              <th className="border-r border-black p-2 text-right w-[100px]">Rate</th>
              <th className="p-2 text-right w-[100px]">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="border-r border-black p-2 text-center">{idx + 1}.</td>
                <td className="border-r border-black p-2">{item.name}</td>
                <td className="border-r border-black p-2 text-center">{item.hsn || '-'}</td>
                <td className="border-r border-black p-2 text-center">{item.quantity}</td>
                <td className="border-r border-black p-2 text-center">{item.unit || 'per SKU'}</td>
                <td className="border-r border-black p-2 text-right">{sym}{Number(item.rate).toFixed(2)}</td>
                <td className="p-2 text-right">{sym}{Number(item.amount).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="border-b border-black h-8">
              <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
            </tr>
          </tbody>
        </table>

        {/* TOTALS SECTION */}
        <div className="flex">
          <div className="flex-1 border-l border-black p-4">
             {/* Notes / Terms can go here if needed */}
          </div>
          <div className="w-[300px] text-[12px]">
            {Number(invoice.additionalCharges || 0) > 0 && (
              <div className="flex border-l border-r border-b border-black font-bold">
                <div className="flex-1 p-2 text-right border-r border-black">Bank Charges</div>
                <div className="w-[100px] p-2 text-right">{sym}{Number(invoice.additionalCharges).toFixed(2)}</div>
              </div>
            )}
            <div className="flex border-l border-r border-b border-black font-bold">
              <div className="flex-1 p-2 text-right border-r border-black uppercase tracking-tight">Total ({invoice.currency})</div>
              <div className="w-[100px] p-2 text-right font-black">{sym}{Number(invoice.total || 0).toFixed(2)}</div>
            </div>
            {invoice.currency !== 'INR' && (
              <div className="flex border-l border-r border-b border-black font-bold">
                <div className="flex-1 p-2 text-right border-r border-black">Total Amount in (INR)</div>
                <div className="w-[100px] p-2 text-right">₹{Number(invoice.totalInINR || 0).toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER BOXES */}
        <div className="grid grid-cols-2 border border-black text-[12px] min-h-[140px]">
          {/* Box 1: Total in Words */}
          <div className="border-r border-black p-4">
            <p className="leading-[1.5]">
              <span className="font-bold underline">Total (in words) :</span>
              <span className="ml-1 italic">{numberToWords(invoice.totalInINR || invoice.total || 0)} Only</span>
            </p>
          </div>

          {/* Box 2: Signature */}
          <div className="p-4 flex flex-col items-center justify-between text-center">
            <p className="font-bold text-[11px] uppercase leading-tight tracking-tight">
              For {invoice.businessName}
            </p>
            
            <div className="py-2">
              {invoice.signatureUrl ? (
                <img src={invoice.signatureUrl} alt="Signature" className="max-h-16 max-w-full grayscale mix-blend-multiply brightness-90"/>
              ) : (
                <div className="h-12 w-32 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">Signature</div>
              )}
            </div>

            <div className="space-y-0">
              <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Authorized Signatory</p>
              <p className="text-[12px] font-bold uppercase">{invoice.signatureLabel || 'Authorized Signatory'}</p>
            </div>
          </div>
        </div>

        {/* TERMS & BANK DETAILS GRID */}
        <div className="grid grid-cols-2 border border-black text-[12px] mt-0 border-t-0 border-collapse">
          {/* Terms and Conditions */}
          <div className="border-r border-black p-4">
            <h3 className="font-bold text-[13px] mb-3">Terms and Conditions</h3>
            <ol className="list-decimal pl-5 space-y-2 text-[11px] leading-relaxed font-medium">
              {((invoice.terms?.length > 0 ? invoice.terms : null) || (invoice.totals?.terms?.length > 0 ? invoice.totals.terms : null) || [
                { id: 1, text: 'Payment Terms Immediate through wire transfer to our bank account on acceptance of data' },
                { id: 2, text: 'For despatch details refer to the Project Delivery Log. The relevant logs have been loaded to your FTP' }
              ]).map((term, idx) => (
                <li key={term.id || idx}>{term.text}</li>
              ))}
            </ol>
          </div>

          {/* Bank Details */}
          <div className="p-4">
            <h3 className="font-bold text-[13px] mb-3">Bank Details</h3>
            <div className="space-y-2 text-[11px]">
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">Account Holder Name</span>
                <span className="font-bold uppercase tracking-tight">{invoice.business?.accountName || invoice.businessName}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">Bank Name</span>
                <span className="font-bold uppercase">{invoice.business?.bankName}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">Account Number</span>
                <span className="font-bold">{invoice.business?.accountNumber}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">IFSC Code</span>
                <span className="font-bold">{invoice.business?.ifscCode}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">Swift Code</span>
                <span className="font-bold uppercase">{invoice.business?.swiftCode}</span>
              </div>
              <div className="grid grid-cols-[110px_1fr]">
                <span className="font-medium text-slate-600">IBAN Number</span>
                <span className="font-bold">{invoice.business?.iban}</span>
              </div>
            </div>
          </div>
        </div>

        {/* INSTITUTIONAL FOOTER */}
        <div className="mt-12 border-t-[3px] border-black pt-4">
          <div className="text-center space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wide">
              Registered Office Address: {invoice.business?.registeredOffice || invoice.registeredOffice}
            </p>
            
            <div className="flex justify-center gap-8 text-[11px] font-bold">
              <p>PAN: {invoice.businessPan || invoice.business?.pan}</p>
              <p>IE CODE: {invoice.ieCode || invoice.business?.ieCode}</p>
              <p>CIN NUMBER: {invoice.cin || invoice.business?.cin}</p>
            </div>

            <div className="flex justify-center gap-8 text-[11px] font-bold">
              <p>Email: {settings.email || invoice.business?.email}</p>
              <p>Website: {settings.website || invoice.website || invoice.business?.website}</p>
              <p>Tel: {settings.telephone || invoice.business?.telephone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
