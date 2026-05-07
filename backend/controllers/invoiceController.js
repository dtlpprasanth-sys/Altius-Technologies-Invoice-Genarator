const { Invoice, Client, Settings, DeletedInvoice } = require('../models');
const { CURRENCY_SYMBOLS } = require('../utils/currencies');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');

const getInvoices = async (req, res) => {
  try {
    const { search, status, type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const where = {};

    // Type filter
    if (type) {
      where.type = type;
    } else {
      where.type = 'invoice';
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'paid') {
        where.paymentStatus = 'paid';
      } else {
        where.status = status;
      }
    } else {
      // For 'all', we don't necessarily filter by status unless we want to exclude some
      // but let's keep it consistent
    }

    // Search filter
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
        { clientName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Date Range filter
    if (startDate && endDate) {
      where.invoiceDate = {
        [Op.between]: [
          new Date(startDate + 'T00:00:00.000Z'),
          new Date(endDate + 'T23:59:59.999Z')
        ]
      };
    } else if (startDate) {
      where.invoiceDate = { [Op.gte]: new Date(startDate + 'T00:00:00.000Z') };
    } else if (endDate) {
      where.invoiceDate = { [Op.lte]: new Date(endDate + 'T23:59:59.999Z') };
    }

    const offset = (page - 1) * limit;

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      invoices,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.body;
    const existing = await Invoice.findOne({ where: { invoiceNumber } });
    if (existing) return res.status(400).json({ message: 'Invoice number already exists' });

    const invoiceData = { ...req.body, userId: req.user.id };
    
    // Explicitly map business details to top-level fields for persistence
    if (req.body.businessDetails) {
      invoiceData.businessName = req.body.businessDetails.businessName;
      invoiceData.businessAddress = req.body.businessDetails.streetAddress || req.body.businessDetails.address;
      invoiceData.businessGstin = req.body.businessDetails.gstin;
      invoiceData.businessPan = req.body.businessDetails.pan;
      invoiceData.ieCode = req.body.businessDetails.ieCode;
      invoiceData.cin = req.body.businessDetails.cin;
      invoiceData.website = req.body.businessDetails.website;
      invoiceData.lutDetails = req.body.businessDetails.lutDetails;
    }

    const invoice = await Invoice.create(invoiceData);
    
    // Update counter in settings (global settings)
    const settings = await Settings.findOne();
    if (settings && invoice.type !== 'proforma') {
      const current = settings.invoiceCounter || '1';
      const length = current.length;
      const next = (parseInt(current, 10) + 1).toString().padStart(length, '0');
      settings.invoiceCounter = next;
      await settings.save();
    }

    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsPaid = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    invoice.paymentStatus = 'paid';
    await invoice.save();
    
    res.json({ message: 'Invoice marked as paid', invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    const updateData = { ...req.body };
    
    // Explicitly map business details for persistence during update
    if (req.body.businessDetails) {
      updateData.businessName = req.body.businessDetails.businessName;
      updateData.businessAddress = req.body.businessDetails.streetAddress || req.body.businessDetails.address;
      updateData.businessGstin = req.body.businessDetails.gstin;
      updateData.businessPan = req.body.businessDetails.pan;
      updateData.ieCode = req.body.businessDetails.ieCode;
      updateData.cin = req.body.businessDetails.cin;
      updateData.website = req.body.businessDetails.website;
      updateData.lutDetails = req.body.businessDetails.lutDetails;
    }

    await invoice.update(updateData);
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const deleteInvoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await Invoice.findOne({
      where: { id: req.params.id }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    // Create audit record
    await DeletedInvoice.create({
      originalId: invoice.id,
      userId: invoice.userId,
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      clientName: invoice.clientName,
      total: invoice.total,
      currency: invoice.currency,
      fullData: invoice.toJSON(),
      deletionReason: reason || 'No reason provided',
      deletedBy: req.user.id
    });

    await invoice.destroy();
    res.json({ message: 'Invoice deleted and archived' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNextInvoiceNumber = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) return res.json({ nextNumber: 'INV-001' });
    
    const prefix = settings.invoicePrefix || 'INV';
    const counter = settings.invoiceCounter || '001';
    const year = settings.fiscalYear ? `/${settings.fiscalYear}` : '';
    res.json({ nextNumber: `${prefix}-${counter}${year}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadInvoicePDF = async (req, res) => {
  let browser;
  try {
    const [invoice, settings] = await Promise.all([
      Invoice.findOne({ where: { id: req.params.id } }),
      Settings.findOne()
    ]);

    if (!invoice) return res.status(404).send('Invoice not found');

    const html = generateInvoiceHTML(invoice, settings);
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true
    });

    await browser.close();
    res.contentType('application/pdf');
    const safeFilename = `Invoice_${invoice.invoiceNumber.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.send(Buffer.from(pdf));
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).send(`Error generating PDF: ${error.message}`);
  }
};

const numberToWords = (num, currency = 'INR') => {
  const n = Number(num);
  if (!n || isNaN(n)) return `ZERO ONLY`;
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const convertIndian = (val) => {
    if (val < 20) return ones[val];
    if (val < 100) return tens[Math.floor(val / 10)] + (val % 10 ? ' ' + ones[val % 10] : '');
    if (val < 1000) return ones[Math.floor(val / 100)] + ' HUNDRED' + (val % 100 ? ' ' + convertIndian(val % 100) : '');
    if (val < 100000) return convertIndian(Math.floor(val / 1000)) + ' THOUSAND' + (val % 1000 ? ' ' + convertIndian(val % 1000) : '');
    if (val < 10000000) return convertIndian(Math.floor(val / 100000)) + ' LAKH' + (val % 100000 ? ' ' + convertIndian(val % 100000) : '');
    return convertIndian(Math.floor(val / 10000000)) + ' CRORE' + (val % 10000000 ? ' ' + convertIndian(val % 10000000) : '');
  };

  const convertInternational = (val) => {
    if (val < 20) return ones[val];
    if (val < 100) return tens[Math.floor(val / 10)] + (val % 10 ? ' ' + ones[val % 10] : '');
    if (val < 1000) return ones[Math.floor(val / 100)] + ' HUNDRED' + (val % 100 ? ' ' + convertInternational(val % 100) : '');
    if (val < 1000000) return convertInternational(Math.floor(val / 1000)) + ' THOUSAND' + (val % 1000 ? ' ' + convertInternational(val % 1000) : '');
    if (val < 1000000000) return convertInternational(Math.floor(val / 1000000)) + ' MILLION' + (val % 1000000 ? ' ' + convertInternational(val % 1000000) : '');
    return convertInternational(Math.floor(val / 1000000000)) + ' BILLION' + (val % 1000000000 ? ' ' + convertInternational(val % 1000000000) : '');
  };

  const convert = currency === 'INR' ? convertIndian : convertInternational;

  const major = Math.floor(n);
  const minor = Math.round((n - major) * 100);
  
  const getCurrencyLabels = (code) => {
    const map = {
      'INR': { major: ['RUPEE', 'RUPEES'], minor: ['PAISA', 'PAISE'] },
      'USD': { major: ['DOLLAR', 'DOLLARS'], minor: ['CENT', 'CENTS'] },
      'EUR': { major: ['EURO', 'EUROS'], minor: ['CENT', 'CENTS'] },
      'GBP': { major: ['POUND', 'POUNDS'], minor: ['PENNY', 'PENCE'] }
    };
    return map[code] || { major: [code, code], minor: ['CENT', 'CENTS'] };
  };

  const labels = getCurrencyLabels(currency);
  const majorLabel = major === 1 ? labels.major[0] : labels.major[1];
  const minorLabel = minor === 1 ? labels.minor[0] : labels.minor[1];

  let result = convert(major) + ' ' + majorLabel;
  if (minor > 0) result += ' AND ' + convert(minor) + ' ' + minorLabel;
  return result + ' ONLY';
};

const generateInvoiceHTML = (invoice, settings = {}) => {
  const snapshot = invoice.business || invoice.businessDetails || {};
  // Use settings from profile as the base, then override with any snapshot data if it exists
  const biz = { ...settings?.dataValues, ...snapshot };
  const clnt = invoice.client || invoice.clientDetails || {};
  const items = invoice.items || [];
  const terms = invoice.terms || [];

  const currency = invoice.currency || 'USD';
  const symbols = CURRENCY_SYMBOLS;
  const sym = symbols[currency] || currency + ' ';
  const numLocale = invoice.numberFormat ?? biz.numberFormat ?? 'en-US';
  const decimals  = invoice.decimals ?? biz.decimals ?? 2;
  const fmt = (n) => Number(n || 0).toLocaleString(numLocale, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  const toTitleCase = (str = '') => str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const rawWords = numberToWords(invoice.total, currency);
  const inWords = toTitleCase(rawWords.replace(/\s+only\s*$/i, ''));

  const lutArn = biz.lutArn || biz.arnNumber || '';
  const lutDate = biz.lutDate || biz.lutRefDate || '';
  const lut = invoice.invoiceSubTitle || invoice.lutDetails || `SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX${lutArn ? `  LUT Ref: ARN – ${lutArn} dated ${formatDate(lutDate)}` : ''}`;

  const isDraft = invoice.status === 'draft';
  const currentBiz = isDraft ? biz : (invoice.businessDetails || biz);

  // Helper to prevent redundant address lines
  const cityStateZip = [currentBiz.city, currentBiz.state].filter(Boolean).join(', ') + (currentBiz.pincode ? ' – ' + currentBiz.pincode : '');
  const countryLine = currentBiz.country || 'India';
  
  const headerLines = [];
  const rawAddr = isDraft
    ? (biz.address || biz.streetAddress || invoice.businessAddress || '')
    : (invoice.businessAddress || biz.address || biz.streetAddress || '');
  
  // If the raw address doesn't already contain the city/state, add them as separate lines
  headerLines.push(rawAddr);
  if (cityStateZip && !rawAddr.includes(currentBiz.city || '___') && !rawAddr.includes(currentBiz.state || '___')) {
    headerLines.push(cityStateZip);
  }
  if (countryLine && !rawAddr.includes(countryLine)) {
    headerLines.push(countryLine);
  }

  const billedByLines = [
    isDraft ? (biz.address || biz.streetAddress || invoice.businessAddress) : (invoice.businessAddress || biz.address || biz.streetAddress),
    [isDraft ? biz.city : (invoice.businessDetails?.city || biz.city), isDraft ? biz.state : (invoice.businessDetails?.state || biz.state)].filter(Boolean).join(', ') + (isDraft ? (biz.pincode || '') : (invoice.businessDetails?.postalCode || biz.pincode ? ', ' + (invoice.businessDetails?.postalCode || biz.pincode) : '')),
    isDraft ? (biz.country || 'India') : (invoice.businessDetails?.country || biz.country || 'India')
  ].filter(Boolean);

  const billedToLines = [
    clnt.address || clnt.streetAddress || invoice.clientAddress,
    [clnt.city, clnt.state].filter(Boolean).join(', ') + (clnt.pincode || clnt.postalCode ? ' ' + (clnt.pincode || clnt.postalCode) : ''),
    clnt.country
  ].filter(Boolean);

  const poNoAndDate = invoice.poNoAndDate || '';
  const softwareExportType = invoice.softwareExportType || '';

  const itemRows = items.map((item, idx) => `
    <tr style="font-size: 9pt;">
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 4px; text-align: center; color: #555;">${idx + 1}.</td>
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 8px;">${item.name || ''}</td>
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 4px; text-align: center;">${item.hsn || ''}</td>
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 4px; text-align: center;">${item.quantity || ''}</td>
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 4px; text-align: center;">${item.unit || ''}</td>
      <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px 6px; text-align: right;">${sym}${fmt(item.rate)}</td>
      <td style="border-bottom: 1px solid #000; padding: 8px 6px; text-align: right; font-weight: 700;">${sym}${fmt(item.amount)}</td>
    </tr>
  `).join('');

  const totalsRows = [
    { label: 'Bank Charges', v: `${sym}${fmt(invoice.bankCharges)}`, bold: false },
    { label: `Total (${currency})`, v: `${sym}${fmt(invoice.total)}`, bold: false },
    { label: currency === 'INR' ? 'Total (INR)' : 'Total Amount in (INR)', v: `₹${fmt(invoice.totalInINR)}`, bold: true }
  ];

  // Get correct bank details based on currency
  const selectedBank = isDraft
    ? ((biz.bankAccounts || []).find(b => b.currency === currency) || null)
    : (invoice.bankDetails || (biz.bankAccounts || []).find(b => b.currency === currency) || null);

  const bankDetails = selectedBank ? [
    { label: 'Account Name', val: selectedBank.accountName || (selectedBank.currency ? biz.businessName : '') },
    { label: 'Account Number', val: selectedBank.accountNumber || '' },
    { label: 'IFSC', val: selectedBank.ifscCode || '' },
    { label: 'IBAN', val: selectedBank.iban || '' },
    { label: 'SWIFT Code', val: selectedBank.swiftCode || '' },
    { label: 'Bank', val: selectedBank.bankName || '' }
  ] : [];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f3f4f6; -webkit-print-color-adjust: exact; margin: 0; }
  .page { 
    width: 794px; min-height: 1123px; 
    padding: 32px 38px 28px; 
    background: #fff; margin: 0 auto; 
    display: flex; flex-direction: column; 
    position: relative; page-break-after: always; 
    box-sizing: border-box; 
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; 
    font-size: 9.5pt; color: #000; 
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .b-all { border: 1px solid #000; }
  .b-b { border-bottom: 1px solid #000; }
  .b-r { border-right: 1px solid #000; }
</style>
</head>
<body>
  <!-- PAGE 1 -->
  <div class="page">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
      <div>
        ${(invoice.logoUrl || biz.logoUrl) 
          ? `<img src="${invoice.logoUrl || biz.logoUrl}" style="max-width: 190px; max-height: 72px; object-fit: contain; display: block;">`
          : `<div style="width: 120px; height: 60px; background: #e5e7eb;"></div>`
        }
      </div>
      <div style="text-align: right; line-height: 1.5; font-size: 9pt;">
        <div style="font-weight: 700; font-size: 11pt; letter-spacing: 0.03em; margin-bottom: 2px;">${isDraft ? (biz.businessName || invoice.businessName) : (invoice.businessName || biz.businessName)}</div>
        ${headerLines.map(l => `<div>${l}</div>`).join('')}
        ${(isDraft ? (biz.phone || biz.telephone || invoice.businessDetails?.phone) : (invoice.businessDetails?.phone || invoice.businessDetails?.telephone || biz.phone || biz.telephone)) ? `<div>Phone: ${isDraft ? (biz.phone || biz.telephone || invoice.businessDetails?.phone) : (invoice.businessDetails?.phone || invoice.businessDetails?.telephone || biz.phone || biz.telephone)}</div>` : ''}
        ${(isDraft ? (biz.gstin || invoice.businessGstin) : (invoice.businessGstin || biz.gstin)) ? `<div>GSTIN: ${isDraft ? (biz.gstin || invoice.businessGstin) : (invoice.businessGstin || biz.gstin)}</div>` : ''}
      </div>
    </div>

    <!-- Title + LUT -->
    <div style="text-align: center; margin-bottom: 10px;">
      <div style="font-size: 15pt; font-weight: 700; letter-spacing: 0.08em;">${invoice.invoiceTitle || 'Export Invoice'}</div>
      <div style="font-size: 7pt; font-style: italic; line-height: 1.4; margin-top: 4px; color: #333;">${lut}</div>
    </div>

    <!-- Outer Content Box -->
    <div class="b-all">
      <table>
        <colgroup><col style="width: 66%;"><col style="width: 34%;"></colgroup>
        <tbody>
          <tr style="height: 25px;">
            <td class="b-b b-r"></td>
            <td class="b-b" style="text-align: right; padding-right: 10px; font-size: 10pt;">*</td>
          </tr>
        </tbody>
      </table>

      <table>
        <colgroup><col style="width: 32%;"><col style="width: 34%;"><col style="width: 34%;"></colgroup>
        <tbody>
          <tr style="font-size: 9.5pt;">
            <td class="b-r b-b" style="padding: 10px 10px; vertical-align: top;">
              <div style="font-weight: 700; font-size: 9pt; color: #444; margin-bottom: 8px;">Invoice Details</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
                <tbody>
                  <tr>
                    <td style="font-weight: 700; padding-bottom: 6px; width: 110px; color: #000; white-space: nowrap; text-transform: uppercase;">Invoice No #</td>
                    <td style="padding-bottom: 6px; font-weight: 400; color: #000; white-space: nowrap;">${invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #000; white-space: nowrap; text-transform: uppercase;">Invoice Date</td>
                    <td style="font-weight: 400; color: #000; white-space: nowrap;">${formatDate(invoice.invoiceDate)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td class="b-r b-b" style="padding: 10px 10px; vertical-align: top;">
              <div style="font-weight: 700; font-size: 9pt; color: #444; margin-bottom: 8px;">Billed By</div>
              <div style="font-weight: 700; font-size: 10pt; margin-bottom: 4px;">${invoice.businessName || biz.businessName}</div>
              ${billedByLines.map(l => `<div style="font-size: 8.5pt; line-height: 1.4;">${l}</div>`).join('')}
              ${(invoice.businessGstin || biz.gstin) ? `
              <div style="margin-top: 5px; font-size: 8.5pt;">
                <span style="font-weight: 700; color: #000; margin-right: 4px;">GSTIN:</span>
                <span style="color: #000;">${invoice.businessGstin || biz.gstin}</span>
              </div>` : ''}
              ${biz.satelliteStation ? `
              <div style="margin-top: 3px; font-size: 8.5pt;">
                <span style="font-weight: 700; color: #000; margin-right: 4px;">Satellite Station:</span>
                <span style="color: #000;">${biz.satelliteStation}</span>
              </div>` : ''}
            </td>
            <td class="b-b" style="padding: 10px 10px; vertical-align: top;">
              <div style="font-weight: 700; font-size: 9pt; color: #444; margin-bottom: 8px;">Billed To</div>
              <div style="font-weight: 700; font-size: 10pt; margin-bottom: 4px;">${invoice.clientName || clnt.name}</div>
              ${billedToLines.map(l => `<div style="font-size: 8.5pt; line-height: 1.4;">${l}</div>`).join('')}
              <div style="margin-top: 6px; font-size: 8.5pt; line-height: 1.6;">
                <div style="font-size: 8.5pt; margin-bottom: 4px; line-height: 1.5;"><span style="font-weight: 700; color: #000; margin-right: 4px;">Export Currency:</span><span style="font-weight: 400; color: #000;">${currency}</span></div>
                <div style="font-size: 8.5pt; margin-bottom: 4px; line-height: 1.5;"><span style="font-weight: 700; color: #000; margin-right: 4px;">Conversion Rate:</span><span style="font-weight: 400; color: #000;">${Number(invoice.exchangeRate || 0).toLocaleString(numLocale, { minimumFractionDigits: decimals, maximumFractionDigits: Math.max(decimals, 2) })} INR</span></div>
                ${poNoAndDate ? `<div style="font-size: 8.5pt; margin-bottom: 4px; line-height: 1.5;"><span style="font-weight: 700; color: #000; margin-right: 4px;">Purchase Order No &amp; Date:</span><span style="font-weight: 400; color: #000;">${poNoAndDate}</span></div>` : ''}
                ${softwareExportType ? `<div style="font-size: 8.5pt; margin-bottom: 4px; line-height: 1.5;"><span style="font-weight: 700; color: #000; margin-right: 4px;">Type of Software Export:</span><span style="font-weight: 400; color: #000;">${softwareExportType}</span></div>` : ''}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <colgroup>
          <col style="width: 3%;"><col style="width: 42%;"><col style="width: 10%;"><col style="width: 9%;"><col style="width: 11%;"><col style="width: 12%;"><col style="width: 13%;">
        </colgroup>
        <thead>
          <tr style="height: 20px;"><td colspan="7" class="b-b"></td></tr>
          <tr style="font-size: 9.5pt; font-weight: 700;">
            <th class="b-b b-r" style="padding: 8px 4px; text-align: center;"></th>
            <th class="b-b b-r" style="padding: 8px 4px; text-align: left;">Item</th>
            <th class="b-b b-r" style="padding: 8px 4px; text-align: center;">HSN/SAC</th>
            <th class="b-b b-r" style="padding: 8px 4px; text-align: center;">Quantity</th>
            <th class="b-b b-r" style="padding: 8px 4px; text-align: center;">UNIT</th>
            <th class="b-b b-r" style="padding: 8px 4px; text-align: right;">Rate</th>
            <th class="b-b" style="padding: 8px 4px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr style="height: 22px;">
            <td class="b-b" colspan="7"></td>
          </tr>
          ${totalsRows.map(r => `
            <tr>
              <td colspan="4" class="b-b b-r"></td>
              <td colspan="2" class="b-b b-r" style="padding: 6px 8px; text-align: right; color: #000; font-weight: 700; font-size: 8.5pt; white-space: nowrap;">${r.label}</td>
              <td class="b-b" style="padding: 6px 8px; text-align: right; font-weight: 400; font-size: 9.5pt; white-space: nowrap;">${r.v}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td class="b-r" style="padding: 10px 12px; vertical-align: top; width: 50%;">
              <div style="font-size: 8.5pt;"><strong>Total (in words) :</strong><span style="font-weight: 400;"> ${inWords} Only</span></div>
            </td>
            <td style="padding: 10px 12px; text-align: center; vertical-align: top; width: 50%; min-width: 250px;">
              <div style="font-weight: 700; font-size: 9pt; margin-bottom: 6px; white-space: pre-wrap;">For ${isDraft ? (biz.businessName || invoice.businessName) : (invoice.businessName || biz.businessName)}</div>
              <div style="min-height: 55px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                ${(isDraft ? (biz.signatureUrl || invoice.signatureUrl) : (invoice.signatureUrl || biz.signatureUrl)) ? `<img src="${isDraft ? (biz.signatureUrl || invoice.signatureUrl) : (invoice.signatureUrl || biz.signatureUrl)}" style="max-height: 55px; max-width: 75%; object-fit: contain; mix-blend-mode: multiply;">` : ''}
              </div>
              <div style="padding-top: 4px;">
                <div style="font-size: 9pt; font-weight: 700;">Authorised Signatory</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
        </div>
  </div>

  <!-- PAGE 2 -->
  <div class="page">
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px;">
      <tbody>
        <tr>
          <td class="b-r" style="padding: 16px 18px; vertical-align: top; width: 50%;">
            <div style="font-weight: 700; font-size: 10pt; margin-bottom: 10px;">Terms and Conditions</div>
            <ol style="padding-left: 16px; margin: 0; font-size: 9pt; line-height: 1.7; list-style-type: decimal; list-style-position: inside;">
              ${terms.map(t => `<li style="margin-bottom: 6px; padding-left: 4px;">${t.text}</li>`).join('')}
            </ol>
          </td>
          <td style="padding: 16px 18px; vertical-align: top; width: 50%;">
            <div style="font-weight: 700; font-size: 10pt; margin-bottom: 10px;">Bank Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
              <tbody>
                ${bankDetails.map(r => `
                  <tr>
                    <td style="padding: 4px 0; color: #000; font-weight: 700; width: 130px; vertical-align: top; text-transform: uppercase;">${r.label}</td>
                    <td style="padding: 4px 0; font-weight: 400; color: #000; vertical-align: top;">${r.val}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <div style="width: 100%; padding-top: 12px; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;">
      <div style="border-top: 3px solid #000; margin-bottom: 8px;"></div>
      <div style="text-align: center; font-size: 9.5pt; font-weight: 700; margin-bottom: 5px; line-height: 1.4;">
        Regd office : ${isDraft ? (biz.registeredOffice || biz.address || invoice.businessAddress || '') : (invoice.businessDetails?.registeredOffice || biz.registeredOffice || biz.address || invoice.businessAddress || '')}
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 9pt; margin-bottom: 2px;">
        <div style="text-align: center; white-space: nowrap;">
          <span style="color: #000; font-weight: 700;">PAN: </span>
          <span style="font-weight: 400; color: #000;">${isDraft ? (biz.pan || invoice.businessPan || '') : (invoice.businessPan || biz.pan || '')}</span>
        </div>
        <div style="text-align: center; white-space: nowrap;">
          <span style="color: #000; font-weight: 700;">IE Code : </span>
          <span style="font-weight: 400; color: #000;">${isDraft ? (biz.ieCode || invoice.ieCode || '') : (invoice.ieCode || biz.ieCode || '')}</span>
        </div>
        <div style="text-align: center; white-space: nowrap;">
          <span style="color: #000; font-weight: 700;">CIN: </span>
          <span style="font-weight: 400; color: #000;">${isDraft ? (biz.cin || invoice.cin || '') : (invoice.cin || biz.cin || '')}</span>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 9pt; margin-bottom: 2px;">
        <div style="text-align: center; white-space: nowrap;">
          <span style="color: #000; font-weight: 700;">Email :</span>
          <span style="font-weight: 400; color: #000;">${isDraft ? (biz.email || invoice.businessDetails?.email || '') : (invoice.businessDetails?.email || biz.email || '')}</span>
        </div>
        <div style="text-align: center; white-space: nowrap; font-weight: 400; color: #000;">
          ${((isDraft ? biz.website : (invoice.website || biz.website)) || '').replace(/^https?:\/\//, '')}
        </div>
        <div style="text-align: center; white-space: nowrap;">
          <span style="color: #000; font-weight: 700;">Tel : </span>
          <span style="font-weight: 400; color: #000;">${isDraft ? (biz.telephone || biz.phone || invoice.businessDetails?.telephone || '') : (invoice.businessDetails?.telephone || invoice.businessDetails?.phone || biz.telephone || biz.phone || '')}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
};

const duplicateInvoice = async (req, res) => {
  try {
    const original = await Invoice.findOne({ where: { id: req.params.id } });
    if (!original) return res.status(404).json({ message: 'Original invoice not found' });

    // Get next number from settings
    const settings = await Settings.findOne();
    let nextNumber = 'INV-001';
    if (settings) {
      const prefix = settings.invoicePrefix || 'INV';
      const counter = settings.invoiceCounter || '001';
      const year = settings.fiscalYear ? `/${settings.fiscalYear}` : '';
      nextNumber = `${prefix}-${counter}${year}`;

      // Increment counter for next time
      const length = counter.length;
      const next = (parseInt(counter, 10) + 1).toString().padStart(length, '0');
      settings.invoiceCounter = next;
      await settings.save();
    }

    // Create copy (exclude id, invoiceNumber, status, and timestamps)
    const { 
      id, invoiceNumber, status, createdAt, updatedAt, ...rest 
    } = original.get({ plain: true });

    const duplicated = await Invoice.create({
      ...rest,
      invoiceNumber: nextNumber,
      status: 'draft',
      userId: req.user.id
    });

    res.status(201).json(duplicated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
  downloadInvoicePDF,
  duplicateInvoice,
  markAsPaid
};
