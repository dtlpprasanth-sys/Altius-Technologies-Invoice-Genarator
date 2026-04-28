import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download, Printer, ImageIcon } from 'lucide-react';

const InvoicePreview = ({ isOpen, onClose, data, settings }) => {
  const invoiceRef = useRef();

  if (!isOpen) return null;

  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'Zero ' + (data.settings?.currency || 'INR') + ' Only';
    // Simplified version for preview
    return num.toLocaleString() + ' ' + (data.settings?.currency || 'INR') + ' Only';
  };

  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { 
      scale: 3, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${data.header?.invoiceNumber || 'Draft'}.pdf`);
  };

  const billedTo = data.billedTo || {};
  const items = data.items || [];
  const totals = data.totals || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Download size={20}/>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-800">Export Invoice Preview</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Institutional Fidelity Output</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-100">
              <Download size={18}/> Download PDF
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* PREVIEW CONTENT */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50 flex justify-center custom-scrollbar">
          <div 
            ref={invoiceRef}
            className="bg-white w-[210mm] p-[15mm] border border-slate-300 text-black shadow-sm relative overflow-hidden"
            style={{ minHeight: '297mm', fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* INVOICE HEADER */}
            <div className="flex justify-between items-start mb-2">
              <div className="w-72">
                {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" className="max-w-full h-auto"/> : <div className="text-3xl font-black text-slate-200">LOGO</div>}
              </div>
              <div className="text-right text-[12px] space-y-0.5 leading-tight font-medium">
                <h1 className="text-[14px] font-bold uppercase">{settings.businessName}</h1>
                <p className="whitespace-pre-wrap">{settings.streetAddress || settings.address}</p>
                {settings.phone && <p className="font-bold tracking-tight">Phone: {settings.phone}</p>}
                <p className="font-bold uppercase tracking-tight">GSTIN: {settings.gstin}</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-[24px] font-bold uppercase tracking-[6px] mb-1">{data.invoiceTitle || data.header?.title || 'TAX INVOICE'}</h2>
              {settings.lutDetails && (
                <p className="text-[9px] font-bold uppercase italic opacity-90 leading-relaxed tracking-tight max-w-[80%] mx-auto">
                  {settings.lutDetails}
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
                    <span className="font-medium">{data.header?.invoiceNumber || 'EXP-037/2025-26'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Invoice Date</span>
                    <span className="font-medium">{data.header?.invoiceDate || 'Feb 27, 2026'}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Billed By */}
              <div className="border-r border-black p-3 space-y-3">
                <h3 className="font-bold text-[13px] mb-2 underline">Billed By</h3>
                <p className="font-bold text-[14px] uppercase">{settings.businessName}</p>
                <div className="leading-[1.4] text-[11px] space-y-1">
                  {settings.email && <p><span className="font-medium text-slate-600">Email:</span> {settings.email}</p>}
                  {settings.phone && <p><span className="font-medium text-slate-600">Phone:</span> {settings.phone}</p>}
                  {settings.telephone && <p><span className="font-medium text-slate-600">Telephone:</span> {settings.telephone}</p>}
                  {settings.website && <p><span className="font-medium text-slate-600">Website:</span> {settings.website}</p>}
                </div>
              </div>

              {/* Box 3: Billed To */}
              <div className="p-3 space-y-2">
                <h3 className="font-bold text-[13px] mb-2 underline">Billed To</h3>
                <p className="font-bold text-[14px]">{billedTo.businessName || billedTo.name}</p>
                <p className="leading-[1.4] text-[11px]">
                  {billedTo.streetAddress || billedTo.address || billedTo.billingAddress?.address1}<br/>
                  {billedTo.city || billedTo.billingAddress?.city}, {billedTo.state || billedTo.billingAddress?.state}<br/>
                  {billedTo.country || billedTo.billingAddress?.country} {billedTo.postalCode || billedTo.billingAddress?.pincode}
                </p>
                <div className="pt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span className="font-bold">Export Currency:</span><span>{data.currency || data.settings?.currency}</span></div>
                  {Number(data.exchangeRate) > 1 && <div className="flex justify-between"><span className="font-bold">Conversion Rate:</span><span>{data.exchangeRate} INR</span></div>}
                  {data.poNoAndDate && (
                    <div className="flex justify-between gap-2 mt-1">
                      <span className="font-bold shrink-0">Purchase Order No & Date:</span>
                      <span className="text-right">{data.poNoAndDate}</span>
                    </div>
                  )}
                  <p className="leading-[1.3] text-[10px] mt-1 font-bold">Type of Software Export: <span className="font-medium italic">{data.softwareExportType || 'Data Entry and conversion, Software processing, RBI Code: 907'}</span></p>
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
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="border-r border-black p-2 text-center">{idx + 1}.</td>
                    <td className="border-r border-black p-2">{item.name || item.description}</td>
                    <td className="border-r border-black p-2 text-center">{item.hsn}</td>
                    <td className="border-r border-black p-2 text-center">{item.quantity}</td>
                    <td className="border-r border-black p-2 text-center">{item.unit || 'pcs'}</td>
                    <td className="border-r border-black p-2 text-right">{data.settings?.currencySymbol}{Number(item.rate || 0).toFixed(data.settings?.decimalDigits || 2)}</td>
                    <td className="p-2 text-right">{data.settings?.currencySymbol}{Number(item.amount || 0).toFixed(data.settings?.decimalDigits || 2)}</td>
                  </tr>
                ))}
                <tr className="border-b border-black h-8">
                  <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
                </tr>
              </tbody>
            </table>

            {/* TOTALS SECTION */}
            <div className="flex">
              <div className="flex-1 border-l border-black"></div>
              <div className="w-[300px] text-[12px]">
                <div className="flex border-l border-r border-b border-black font-bold">
                  <div className="flex-1 p-2 text-right border-r border-black">Bank Charges</div>
                  <div className="w-[100px] p-2 text-right">{data.settings?.currencySymbol}{Number(data.additionalCharges || 0).toFixed(data.settings?.decimalDigits || 2)}</div>
                </div>
                <div className="flex border-l border-r border-b border-black font-bold">
                  <div className="flex-1 p-2 text-right border-r border-black uppercase tracking-tight">Total ({data.settings?.currency})</div>
                  <div className="w-[100px] p-2 text-right font-black">{data.settings?.currencySymbol}{Number(data.total || 0).toFixed(data.settings?.decimalDigits || 2)}</div>
                </div>
              </div>
            </div>

            {/* FOOTER BOXES */}
            <div className="grid grid-cols-2 border border-black text-[12px] min-h-[140px]">
              {/* Box 1: Total in Words */}
              <div className="border-r border-black p-4">
                <p className="leading-[1.5]">
                  <span className="font-bold underline">Total (in words) :</span>
                  <span className="ml-1 italic">{numberToWords(totals.grandTotal || 1402.25)}</span>
                </p>
              </div>

              {/* Box 2: Signature */}
              <div className="p-4 flex flex-col items-center justify-between text-center">
                <p className="font-bold text-[11px] uppercase leading-tight tracking-tight">
                  For {settings.businessName || 'AltiusNxt Technologies (P) Ltd'}
                </p>
                
                <div className="py-2">
                  {settings.signatureUrl ? (
                    <img src={settings.signatureUrl} alt="Signature" className="max-h-16 max-w-full grayscale mix-blend-multiply brightness-90"/>
                  ) : (
                    <div className="h-12 w-32 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">Authorized Signature</div>
                  )}
                </div>

                <div className="space-y-0">
                  <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">Authorized Signatory</p>
                  <p className="text-[12px] font-bold uppercase">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* TERMS & BANK DETAILS GRID */}
            <div className="grid grid-cols-2 border border-black text-[12px] mt-0 border-t-0 border-collapse">
              {/* Terms and Conditions */}
              <div className="border-r border-black p-4">
                <h3 className="font-bold text-[13px] mb-3">Terms and Conditions</h3>
                <ol className="list-decimal pl-5 space-y-2 text-[11px] leading-relaxed font-medium">
                  {(data.totals?.terms || []).map((term, idx) => (
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
                    <span className="font-bold uppercase">{settings.accountName || settings.businessName}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-medium text-slate-600">Bank Name</span>
                    <span className="font-bold uppercase">{settings.bankName}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-medium text-slate-600">Account Number</span>
                    <span className="font-bold">{settings.accountNumber}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-medium text-slate-600">IFSC Code</span>
                    <span className="font-bold">{settings.ifscCode}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-medium text-slate-600">Swift Code</span>
                    <span className="font-bold uppercase">{settings.swiftCode}</span>
                  </div>
                  <div className="grid grid-cols-[110px_1fr]">
                    <span className="font-medium text-slate-600">IBAN Number</span>
                    <span className="font-bold">{settings.iban}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INSTITUTIONAL FOOTER */}
            <div className="mt-12 border-t-[3px] border-black pt-4">
              <div className="text-center space-y-2">
                <p className="text-[12px] font-bold uppercase tracking-wide">
                  Registered Office Address: {settings.registeredOffice}
                </p>
                
                <div className="flex justify-center gap-8 text-[11px] font-bold">
                  <p>PAN: {settings.pan}</p>
                  <p>IE CODE: {settings.ieCode}</p>
                  <p>CIN NUMBER: {settings.cin}</p>
                </div>

                <div className="flex justify-center gap-8 text-[11px] font-bold">
                  <p>Email: {settings.email}</p>
                  <p>Website: {settings.website}</p>
                  <p>Tel: {settings.telephone}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
;
;
