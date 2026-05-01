import React from 'react';
import { formatDate, numberToWords } from '../utils/helpers';
import InvoiceFooter from './InvoiceFooter';

/* ── Helpers ── */
const toTitleCase = (str = '') =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const B = '1px solid #000';   // standard border
const F = "'Inter','Helvetica Neue',Arial,sans-serif";

/* ── Shared page header (logo + company address) ── */
const PageHeader = ({ settings }) => {
  const rawAddr = settings.address || settings.streetAddress || '';
  const cityState = [settings.city, settings.state].filter(Boolean).join(', ') + 
                   (settings.zipCode || settings.pincode ? ' – ' + (settings.zipCode || settings.pincode) : '');
  const country = settings.country || 'India';

  const lines = [rawAddr];
  if (cityState && !rawAddr.includes(settings.city || '___') && !rawAddr.includes(settings.state || '___')) {
    lines.push(cityState);
  }
  if (country && !rawAddr.includes(country)) {
    lines.push(country);
  }
  const finalLines = lines.filter(Boolean);
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
      <div>
        {settings.logoUrl
          ? <img src={settings.logoUrl} alt="logo" style={{ maxWidth:190, maxHeight:72, objectFit:'contain', display:'block' }} />
          : <div style={{ width:120, height:60, background:'#e5e7eb' }} />}
      </div>
      <div style={{ textAlign:'right', lineHeight:1.5, fontSize:'9pt' }}>
        <div style={{ fontWeight:700, fontSize:'11pt', letterSpacing:'0.03em', marginBottom:2 }}>{settings.businessName}</div>
        {finalLines.map((l,i) => <div key={i}>{l}</div>)}
        {(settings.phone||settings.telephone) && <div>Phone: {settings.phone||settings.telephone}</div>}
        {settings.gstin && <div>GSTIN: {settings.gstin}</div>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
const ExportInvoicePDF = ({ data = {}, settings = {} }) => {
  const header   = data.header  || {};
  const billedTo = data.clientDetails || data.client || {};
  const items    = data.items   || [];
  const totals   = data.totals  || {};
  const terms    = data.terms   || totals.terms || [];

  const currency    = data.currency    || header.currency    || 'USD';
  const sym         = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency + ' ';
  const exRate      = data.exchangeRate || header.exchangeRate || settings.exchangeRate || '0';
  const bankCharges = Number(data.bankCharges  || totals.bankCharges  || 0).toFixed(2);
  const totalFor    = Number(data.total        || 0).toFixed(2);
  const totalINR    = Number(data.totalInINR   || 0).toFixed(2);

  const rawWords    = numberToWords(data.total, currency);
  const inWords     = toTitleCase(rawWords.replace(/\s+only\s*$/i, ''));

  /* LUT — from invoice.lutDetails or settings */
  const lutArn  = settings.lutArn || settings.arnNumber || '';
  const lutDate = settings.lutDate || settings.lutRefDate || '';
  const lut = data.invoiceSubTitle || header.subtitle || data.lutDetails
    || `SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX${lutArn ? `  LUT Ref: ARN – ${lutArn} dated ${formatDate(lutDate)}` : ''}`;

  /* Exact field names from Invoice.js model */
  const invoiceNo   = data.invoiceNumber || header.invoiceNumber || '';
  const invoiceDate = formatDate(data.invoiceDate || header.date || data.createdAt);
  const poNoAndDate       = data.poNoAndDate       || header.poNoAndDate       || '';
  const softwareExportType = data.softwareExportType || header.softwareExportType || '';

  const rawByAddr = data.businessAddress || settings.address || settings.streetAddress || '';
  const byCityState = [settings.city, settings.state].filter(Boolean).join(', ') + (settings.zipCode || settings.pincode ? ', '+(settings.zipCode || settings.pincode) : '');
  const byCountry = settings.country;

  const byLines = [rawByAddr];
  if (byCityState && !rawByAddr.includes(settings.city || '___') && !rawByAddr.includes(settings.state || '___')) {
    byLines.push(byCityState);
  }
  if (byCountry && !rawByAddr.includes(byCountry)) {
    byLines.push(byCountry);
  }
  const finalByLines = byLines.filter(Boolean);

  const toLines = [
    billedTo.address || billedTo.streetAddress || billedTo.billingAddress || '',
    [billedTo.city, billedTo.state].filter(Boolean).join(', ') + ((billedTo.zipCode || billedTo.postalCode) ? ' '+(billedTo.zipCode || billedTo.postalCode) : ''),
    billedTo.country,
  ].filter(Boolean);

  /* Only 1 filler row — matches reference */
  const fillerRows = Math.max(0, 1 - items.length);


  /* Page wrapper */
  const Page = ({ children }) => (
    <div className="invoice-page" style={{
      width:794, minHeight:1123,
      padding:'32px 38px 28px',
      boxSizing:'border-box',
      fontFamily:F, fontSize:'9.5pt', color:'#000', background:'#fff',
      display:'flex', flexDirection:'column',
      marginBottom:40,
    }}>
      {children}
    </div>
  );

  /* Label/value cell styles */
  /* Inline label:value row style */
  const inlineRow = { fontSize:'8.5pt', marginBottom:4, lineHeight:1.5 };
  const inlineLbl = { color:'#6b7280', fontWeight:400, marginRight:4 };
  const inlineVal = { fontWeight:700, color:'#000' };

  /* Stacked label/value (for Invoice Details column) */
  const lbl = { fontSize:'8pt', color:'#6b7280', display:'block', marginBottom:1 };
  const val = { fontSize:'9.5pt', fontWeight:700, display:'block' };

  /* Extra Billed To fields — from Invoice model top-level fields */
  // poNoAndDate and softwareExportType already extracted above


  /* Totals rows */
  const totalsRows = [
    { label:`Bank Charges`,           v:`${sym}${bankCharges}` },
    { label:`Total (${currency})`,    v:`${sym}${totalFor}` },
    { label: currency === 'INR' ? 'Total (INR)' : 'Total Amount in (INR)',  v:`₹${totalINR}` },
  ];

  return (
    <div className="export-invoice-pdf-container" style={{ fontFamily:F }}>

      {/* ══════════════ PAGE 1 ══════════════ */}
      <Page>
        <PageHeader settings={settings} />
        {/* Title + LUT — no horizontal rule above */}
        <div style={{ textAlign:'center', marginBottom:10 }}>
          <div style={{ fontSize:'15pt', fontWeight:700, letterSpacing:'0.08em' }}>{data.invoiceTitle || header.title || 'Export Invoice'}</div>
          <div style={{ fontSize:'7pt', fontStyle:'italic', lineHeight:1.4, marginTop:4, color:'#333' }}>{lut}</div>
        </div>

        {/* ── Outer content box ── */}
        <div style={{ border:B }}>

          {/* 1. Top Blank Row — divider at 62% */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'62%' }} />
              <col style={{ width:'38%' }} />
            </colgroup>
            <tbody>
              <tr style={{ height:25 }}>
                <td style={{ borderBottom:B, borderRight:B }} />
                <td style={{ borderBottom:B, textAlign:'right', paddingRight:10, fontSize:'10pt' }}>*</td>
              </tr>
            </tbody>
          </table>

          {/* 2. Info Grid — 27% / 35% / 38% */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'27%' }} />
              <col style={{ width:'35%' }} />
              <col style={{ width:'38%' }} />
            </colgroup>
            <tbody>
              <tr style={{ fontSize:'9.5pt' }}>
                {/* Col 1 – Invoice Details */}
                <td style={{ borderRight:B, borderBottom:B, padding:'10px 10px', verticalAlign:'top' }}>
                  <div style={{ fontWeight:700, fontSize:'9pt', color:'#444', marginBottom:8 }}>Invoice Details</div>
                  <div style={{ marginBottom:6, fontSize:'8pt' }}>
                    <span style={{ color:'#6b7280' }}>Invoice No #  </span>
                    <span style={{ fontWeight:700 }}>{invoiceNo}</span>
                  </div>
                  <div style={{ fontSize:'8pt' }}>
                    <span style={{ color:'#6b7280' }}>Invoice Date  </span>
                    <span style={{ fontWeight:700 }}>{invoiceDate}</span>
                  </div>
                </td>

                {/* Col 2 – Billed By */}
                <td style={{ borderRight:B, borderBottom:B, padding:'10px 10px', verticalAlign:'top' }}>
                  <div style={{ fontWeight:700, fontSize:'9pt', color:'#444', marginBottom:8 }}>Billed By</div>
                  <div style={{ fontWeight:700, fontSize:'10pt', marginBottom:4 }}>{settings.businessName}</div>
                  {finalByLines.map((l,i) => <div key={i} style={{ fontSize:'8.5pt', lineHeight:1.4 }}>{l}</div>)}
                  {settings.gstin && (
                    <div style={{ marginTop:5, fontSize:'8.5pt' }}>
                      <span style={{ color:'#6b7280' }}>GSTIN: </span>
                      <span>{settings.gstin}</span>
                    </div>
                  )}
                  {settings.satelliteStation && (
                    <div style={{ marginTop:3, fontSize:'8.5pt' }}>
                      <span style={{ color:'#6b7280' }}>Satellite Station: </span>
                      <span>{settings.satelliteStation}</span>
                    </div>
                  )}
                </td>

                {/* Col 3 – Billed To */}
                <td style={{ borderBottom:B, padding:'10px 10px', verticalAlign:'top' }}>
                  <div style={{ fontWeight:700, fontSize:'9pt', color:'#444', marginBottom:8 }}>Billed To</div>
                  <div style={{ fontWeight:700, fontSize:'10pt', marginBottom:4 }}>{billedTo.businessName || billedTo.name}</div>
                  {toLines.map((l,i) => <div key={i} style={{ fontSize:'8.5pt', lineHeight:1.4 }}>{l}</div>)}
                  <div style={{ marginTop:6, fontSize:'8.5pt', lineHeight:1.6 }}>
                    <div style={inlineRow}><span style={inlineLbl}>Export Currency:</span><span style={inlineVal}>{currency}</span></div>
                    <div style={inlineRow}><span style={inlineLbl}>Conversion Rate:</span><span style={inlineVal}>{exRate} INR</span></div>
                    {poNoAndDate && (
                      <div style={inlineRow}><span style={inlineLbl}>Purchase Order No &amp; Date:</span><span style={inlineVal}>{poNoAndDate}</span></div>
                    )}
                    {softwareExportType && (
                      <div style={inlineRow}><span style={inlineLbl}>Type of Software Export:</span><span style={inlineVal}>{softwareExportType}</span></div>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 3. Consolidated Item & Totals Table — 7 Columns */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <colgroup>
              <col style={{ width:'3%' }} />
              <col style={{ width:'42%' }} />
              <col style={{ width:'10%' }} />
              <col style={{ width:'9%' }} />
              <col style={{ width:'11%' }} />
              <col style={{ width:'12%' }} />
              <col style={{ width:'13%' }} />
            </colgroup>
            <thead>
              {/* Full-width gap row — no internal vertical lines, just top/bottom borders */}
              <tr style={{ height:20 }}>
                <td colSpan={7} style={{ borderBottom:B }} />
              </tr>
              <tr style={{ fontSize:'9.5pt', fontWeight:700 }}>
                {['', 'Item', 'HSN/SAC', 'Quantity', 'UOM', 'Rate', 'Amount'].map((h,i,arr) => (
                  <th key={i} style={{
                    borderBottom:B, borderRight: i < arr.length-1 ? B : 'none',
                    padding:'8px 4px', textAlign: i===1?'left':i>4?'right':'center', fontWeight:700
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Items start directly after header row */}
              {items.map((item, idx) => (
                <tr key={idx} style={{ fontSize:'9pt' }}>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 4px', textAlign:'center', color:'#555' }}>{idx+1}.</td>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 8px' }}>{item.name}</td>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 4px', textAlign:'center' }}>{item.hsn}</td>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 4px', textAlign:'center' }}>{item.quantity}</td>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 4px', textAlign:'center' }}>{item.unit || 'per SKU'}</td>
                  <td style={{ borderBottom:B, borderRight:B, padding:'8px 6px', textAlign:'right' }}>{sym}{Number(item.rate||0).toFixed(2)}</td>
                  <td style={{ borderBottom:B, padding:'8px 6px', textAlign:'right', fontWeight:700 }}>{sym}{Number(item.amount||0).toFixed(2)}</td>
                </tr>
              ))}

              {/* 1 filler row after items — no internal vertical lines */}
              <tr style={{ height:22 }}>
                <td colSpan={7} style={{ borderBottom:B }} />
              </tr>

              {/* Totals Section — vertical lines for first 5 columns persist */}
              {totalsRows.map((r,i) => (
                <tr key={i}>
                  {/* Single merged empty cell cols 1-4 — NO internal vertical lines (matches reference) */}
                  <td colSpan={4} style={{ borderBottom:B, borderRight:B }} />
                  {/* Label spans UOM+Rate cols (11%+12%=23%) */}
                  <td colSpan={2} style={{ borderBottom:B, borderRight:B, padding:'6px 8px', textAlign:'right', color:'#333', fontWeight:400, fontSize:'8.5pt', whiteSpace:'nowrap' }}>{r.label}</td>
                  {/* Value in Amount col */}
                  <td style={{ borderBottom:B, padding:'6px 8px', textAlign:'right', fontWeight: i === totalsRows.length - 1 ? 700 : 400, fontSize:'9.5pt', whiteSpace:'nowrap' }}>{r.v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Total in Words + Signature Section */}
          <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
            <tbody>
              <tr>
                <td style={{ borderRight:B, padding:'10px 12px', verticalAlign:'top', width:'50%' }}>
                  <div style={{ fontSize:'8.5pt' }}>
                    <strong>Total (in words) :</strong>
                    <span style={{ fontWeight:400 }}> {inWords} Only</span>
                  </div>
                </td>
                <td style={{ padding:'10px 12px', textAlign:'center', verticalAlign:'top', width:'50%' }}>
                  <div style={{ fontWeight:700, fontSize:'9pt', marginBottom:6 }}>For {settings.businessName}</div>
                  <div style={{ minHeight:55, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
                    {settings.signatureUrl && (
                      <img src={settings.signatureUrl} alt="sig"
                        style={{ maxHeight:55, maxWidth:'75%', objectFit:'contain', mixBlendMode:'multiply' }} />
                    )}
                  </div>
                  <div style={{ paddingTop:4 }}>
                    <div style={{ fontSize:'7.5pt', color:'#6b7280' }}>Authorized Signatory</div>
                    <div style={{ fontSize:'9pt', fontWeight:700 }}>Authorised Signatory</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>{/* end outer content box */}
      </Page>

      {/* ══════════════ PAGE 2 ══════════════ */}
      <Page>
        <table style={{ width:'100%', borderCollapse:'collapse', border:B, marginBottom:20 }}>
          <tbody>
            <tr>
              <td style={{ borderRight:B, padding:'16px 18px', verticalAlign:'top', width:'50%' }}>
                <div style={{ fontWeight:700, fontSize:'10pt', marginBottom:10 }}>Terms and Conditions</div>
                <ol style={{ paddingLeft:16, margin:0, fontSize:'9pt', lineHeight:1.7, listStyleType:'decimal', listStylePosition:'inside' }}>
                  {terms.map((t,i) => (
                    <li key={t.id||i} style={{ marginBottom:6, paddingLeft:4 }}>{t.text}</li>
                  ))}
                </ol>
              </td>
              <td style={{ padding:'16px 18px', verticalAlign:'top', width:'50%' }}>
                <div style={{ fontWeight:700, fontSize:'10pt', marginBottom:10 }}>Bank Details</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'9pt' }}>
                  <tbody>
                    {[
                      { label:'Account Name',   val: settings.accountName || settings.businessName },
                      { label:'Account Number', val: settings.accountNumber },
                      { label:'IFSC',           val: settings.ifscCode },
                      { label:'IBAN',           val: settings.iban },
                      { label:'SWIFT Code',     val: settings.swiftCode },
                      { label:'Bank',           val: settings.bankName },
                    ].filter(r => r.val).map((r,i) => (
                      <tr key={i}>
                        <td style={{ padding:'4px 0', color:'#6b7280', fontWeight:400, width:130, verticalAlign:'top' }}>{r.label}</td>
                        <td style={{ padding:'4px 0', fontWeight:700, color:'#000', verticalAlign:'top' }}>{r.val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        <InvoiceFooter settings={settings} />
      </Page>

    </div>
  );
};

export default ExportInvoicePDF;
