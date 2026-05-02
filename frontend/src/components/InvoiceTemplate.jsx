import React from 'react';
import { numberToWords, formatDate } from '../utils/helpers';
import InvoiceFooter from './InvoiceFooter';

const InvoiceTemplate = ({ data, settings }) => {
  const billedTo = data.client || {};
  const items = data.items || [];
  const currencySymbol = data.settings?.currencySymbol || '$';
  const currency = data.settings?.currency || 'USD';
  const lutText = data.header?.invoiceSubTitle || data.invoiceSubTitle || settings.lutDetails || '';
  
  // Format conversion rate to exactly 2 decimal places
  const exchangeRate = Number(data.totals?.exchangeRate || data.exchangeRate || 1);
  const displayExchangeRate = exchangeRate.toFixed(2);

  // Format Date to DD-MMM-YYYY
  const displayDate = formatDate(data.header?.invoiceDate || data.invoiceDate);

  const formatAddress = (addrObj) => {
    if (!addrObj) return [];
    const parts = [];
    if (addrObj.address) parts.push(addrObj.address);
    if (addrObj.streetAddress) parts.push(addrObj.streetAddress);
    const line2 = [addrObj.city, addrObj.state].filter(Boolean).join(', ');
    const line3 = [addrObj.country, addrObj.pincode || addrObj.postalCode].filter(Boolean).join(' - ');
    if (line2) parts.push(line2);
    if (line3) parts.push(line3);
    return parts;
  };

  const billedByLines = formatAddress(settings);
  const billedToLines = formatAddress(billedTo);

  // Total in Words Calculation
  const totalInWords = numberToWords(data.totalInINR || data.total, data.totalInINR ? 'INR' : currency);

  return (
    <div className="invoice-template-container invoice-page bg-white shadow-lg mx-auto overflow-hidden font-sans" style={{ width: '794px', minHeight: '1123px', padding: '40px', boxSizing: 'border-box', fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif", color: '#000' }}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="max-w-[200px] max-h-[100px] object-contain" />
          ) : (
            <div className="w-24 h-12 bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold uppercase">Logo</div>
          )}
        </div>
        <div className="flex-1 text-right">
          <h1 className="text-[14pt] font-bold uppercase mb-1 leading-tight">{settings.businessName}</h1>
          <div className="text-[10pt] leading-[1.4]">
            {billedByLines.map((line, i) => <p key={i}>{line}</p>)}
            <p className="font-bold mt-1 uppercase">Phone: {settings.phone || settings.telephone}</p>
            <p className="font-bold uppercase">GSTIN: {settings.gstin}</p>
          </div>
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center mb-8">
        <h2 className="text-[22pt] font-bold uppercase tracking-widest mb-1">Export Invoice</h2>
        {lutText && (
          <p className="text-[9pt] font-bold uppercase italic leading-tight border-t border-black pt-1 max-w-[90%] mx-auto mt-1">
            {lutText}
          </p>
        )}
      </div>

      {/* 3-Column Info Grid */}
      <div className="grid grid-cols-3 border border-black mb-6">
        {/* Column 1: Invoice Details */}
        <div className="border-r border-black flex flex-col">
          <div className="p-2 border-b border-black font-bold text-[11pt] bg-gray-50">Invoice Details</div>
          <div className="p-3 space-y-4 text-[10pt] flex-1">
            <div className="flex"><span className="text-gray-500 text-[9pt] w-28 shrink-0">INVOICE NO #</span><span className="font-bold text-black">{data.header?.invoiceNumber || data.invoiceNumber}</span></div>
            <div className="flex"><span className="text-gray-500 text-[9pt] w-28 shrink-0">INVOICE DATE</span><span className="font-bold text-black">{displayDate}</span></div>
          </div>
        </div>

        {/* Column 2: Billed By */}
        <div className="border-r border-black flex flex-col">
          <div className="p-2 border-b border-black font-bold text-[11pt] bg-gray-50">Billed By</div>
          <div className="p-3 text-[10pt] leading-[1.6] flex-1">
            <p className="font-bold text-[11pt] mb-2">{settings.businessName}</p>
            {billedByLines.map((line, i) => <p key={i} className="text-gray-600">{line}</p>)}
            <div className="mt-3 font-bold uppercase text-[9pt]">
              <p>GSTIN: <span className="font-bold text-black text-[10pt] ml-1">{settings.gstin}</span></p>
            </div>
          </div>
        </div>

        {/* Column 3: Billed To */}
        <div className="flex flex-col">
          <div className="p-2 border-b border-black font-bold text-[11pt] bg-gray-50">Billed To</div>
          <div className="p-3 text-[10pt] leading-[1.6] flex-1">
            <p className="font-bold text-[11pt] mb-2">{billedTo.businessName || billedTo.name}</p>
            {billedToLines.map((line, i) => <p key={i} className="text-gray-600">{line}</p>)}
            
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="grid grid-cols-[130px_1fr] items-center">
                <span className="text-gray-500 uppercase text-[9pt]">EXPORT CURRENCY:</span>
                <span className="text-[10pt] font-bold text-black">{currency}</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] items-center">
                <span className="text-gray-500 uppercase text-[9pt]">CONVERSION RATE:</span>
                <span className="text-[10pt] font-bold text-black">{displayExchangeRate} INR</span>
              </div>
              <div className="grid grid-cols-[130px_1fr] items-start">
                <span className="text-gray-500 uppercase text-[9pt] leading-tight">PO NO & DATE:</span>
                <span className="text-[10pt] font-bold text-black leading-tight">{data.header?.poNoAndDate || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="border border-black mb-0 overflow-hidden">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr className="border-b border-black font-bold text-[11pt] bg-gray-50">
              <th className="border-r border-black p-2 text-center" style={{ width: '5%' }}>#</th>
              <th className="border-r border-black p-2 text-left" style={{ width: '40%' }}>Item Description</th>
              <th className="border-r border-black p-2 text-center" style={{ width: '10%' }}>HSN/SAC</th>
              <th className="border-r border-black p-2 text-center" style={{ width: '10%' }}>Qty</th>
              <th className="border-r border-black p-2 text-center" style={{ width: '10%' }}>UOM</th>
              <th className="border-r border-black p-2 text-right" style={{ width: '10%' }}>Rate</th>
              <th className="p-2 text-right" style={{ width: '15%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-black text-[10pt]">
                <td className="border-r border-black p-2.5 text-center align-top text-gray-500">{idx + 1}</td>
                <td className="border-r border-black p-2.5 align-top font-bold text-black">{item.name}</td>
                <td className="border-r border-black p-2.5 text-center align-top text-gray-600">{item.hsn}</td>
                <td className="border-r border-black p-2.5 text-right align-top font-bold text-black">{item.quantity}</td>
                <td className="border-r border-black p-2.5 text-center align-top text-gray-600">{item.unit || 'per SKU'}</td>
                <td className="border-r border-black p-2.5 text-right align-top text-black">{Number(item.rate || 0).toFixed(2)}</td>
                <td className="p-2.5 text-right align-top font-bold text-black">{Number(item.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
            {[...Array(Math.max(0, 5 - items.length))].map((_, i) => (
              <tr key={`empty-${i}`} className="border-b border-black h-12">
                <td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex border-x border-b border-black mb-5 bg-white">
        <div className="flex-1"></div>
        <div className="w-[300px] border-l border-black">
          <div className="flex border-b border-black text-[10pt]">
            <div className="flex-1 p-2 text-right border-r border-black bg-gray-50 uppercase text-[9pt] text-black font-bold">Bank Charges</div>
            <div className="w-[100px] p-2 text-right text-black font-normal">{currencySymbol}{Number(data.totals?.bankCharges || 0).toFixed(2)}</div>
          </div>
          <div className="flex border-b border-black text-[11pt]">
            <div className="flex-1 p-2 text-right border-r border-black bg-gray-50 uppercase text-[9pt] text-black font-bold">Total ({currency})</div>
            <div className="w-[100px] p-2 text-right font-normal text-black">{currencySymbol}{Number(data.total || 0).toFixed(2)}</div>
          </div>
          {currency !== 'INR' && (
            <div className="flex text-[10pt]">
              <div className="flex-1 p-2 text-right border-r border-black bg-gray-50 uppercase text-[9pt] text-black font-bold">Total Amount in (INR)</div>
              <div className="w-[100px] p-2 text-right font-normal text-black">₹{Number(data.totalInINR || 0).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Bank Details Box - Compact Layout */}
      <div className="border border-black grid grid-cols-2 h-auto mb-5">
        {/* Terms Column */}
        <div className="border-r border-gray-300 p-4">
          <h3 className="font-bold text-[11pt] mb-4 text-black">Terms and Conditions</h3>
          <ol className="list-decimal pl-5 space-y-1.5 text-[9pt] leading-tight font-bold text-black">
            {(data.totals?.terms || data.terms || []).map((term, idx) => (
              <li key={term.id || idx} className="pl-1">{term.text}</li>
            ))}
          </ol>
        </div>

        {/* Bank Details Column */}
        <div className="p-4">
          <h3 className="font-bold text-[11pt] mb-4 text-black">Bank Details</h3>
          <div className="space-y-2 text-[10pt]">
            {[
              { label: 'ACCOUNT NAME', value: settings.accountName || settings.businessName },
              { label: 'ACCOUNT NUMBER', value: settings.accountNumber },
              { label: 'IFSC', value: settings.ifscCode },
              { label: 'IBAN', value: settings.iban },
              { label: 'SWIFT CODE', value: settings.swiftCode },
              { label: 'BANK', value: settings.bankName }
            ].map((item, i) => item.value ? (
              <div key={i} className="grid grid-cols-[120px_1fr] items-start gap-1">
                <span className="text-[9pt] font-bold text-black uppercase">{item.label}</span>
                <span className="font-normal text-black text-[10pt] leading-tight text-left">{item.value}</span>
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* Summary & Signature Section */}
      <div className="grid grid-cols-[1.5fr_1fr] border border-black mb-5 bg-white">
        <div className="border-r border-black p-4 text-[10pt] flex flex-col justify-start">
          <p className="mb-1"><span className="font-normal text-gray-500 uppercase text-[9pt]">TOTAL (IN WORDS) :</span></p>
          <p className="font-bold text-black text-[10pt] leading-tight">{totalInWords}</p>
        </div>
        <div className="p-4 flex flex-col items-center justify-between text-center relative min-h-[100px]">
          <p className="font-bold text-[10pt] text-black uppercase">For {settings.businessName}</p>
          <div className="flex-1 flex items-center justify-center my-2 w-full">
            {settings.signatureUrl && <img src={settings.signatureUrl} alt="Signature" className="max-h-16 max-w-[80%] grayscale mix-blend-multiply" />}
          </div>
          <div className="w-full">
            <div className="border-t-[1.5px] border-black w-full mb-1"></div>
            <p className="text-[9pt] font-normal text-gray-500 uppercase tracking-widest">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <InvoiceFooter settings={settings} />

    </div>
  );
};

export default InvoiceTemplate;
