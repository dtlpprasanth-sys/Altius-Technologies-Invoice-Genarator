import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Download } from 'lucide-react';
import ExportInvoicePDF from './ExportInvoicePDF';

const InvoicePreview = ({ isOpen, onClose, data, settings }) => {
  const invoiceRef = useRef();

  if (!isOpen) return null;

  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pages = element.querySelectorAll('.invoice-page');
    
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { 
        scale: 4, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 793.7, 
        height: 1122.5
      });
      
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    }
    
    const safeName = (data.header?.invoiceNumber || 'Draft').replace(/[/\\?%*:|"<>]/g, '_');
    pdf.save(`Invoice_${safeName}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">INV</div>
            <div className="text-left">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Export Invoice Preview</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-purple-500">Fixed 2-Page Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPDF} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-all">
              <Download size={18}/> Export PDF
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
              <X size={20}/>
            </button>
          </div>
        </div>

        {/* PREVIEW CONTENT */}
        <div className="flex-1 overflow-auto p-12 bg-slate-100 flex flex-col items-center custom-scrollbar">
          <div ref={invoiceRef}>
            <ExportInvoicePDF data={data} settings={settings} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
