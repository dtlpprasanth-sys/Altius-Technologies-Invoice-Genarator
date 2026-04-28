const Invoice = require('../models/Invoice');
const Settings = require('../models/Settings');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Generate invoice number
const generateInvoiceNumber = async (userId) => {
  const settings = await Settings.findOne({ where: { userId } });
  const prefix = settings?.invoicePrefix || 'INV';
  const counter = settings?.invoiceCounter || 1;
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  const fyStr = `${String(year).slice(2)}-${String(nextYear).slice(2)}`;
  const num = String(counter).padStart(3, '0');
  const invoiceNumber = `${prefix}-${num}/${fyStr}`;

  if (settings) {
    await settings.update({ invoiceCounter: counter + 1 });
  }
  return invoiceNumber;
};

// @desc Get all invoices
const getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const where = { userId: req.user.id };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
        { clientName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset: Number(offset),
      limit: Number(limit)
    });

    const formattedInvoices = invoices.map(inv => {
      const plain = inv.get({ plain: true });
      return { ...plain, _id: plain.id };
    });

    res.json({ invoices: formattedInvoices, total: count, page: Number(page), pages: Math.ceil(count / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create invoice
const createInvoice = async (req, res) => {
  try {
    const settings = await Settings.findOne({ where: { userId: req.user.id } });
    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    
    const invoice = await Invoice.create({
      ...req.body,
      userId: req.user.id,
      businessDetails: settings ? settings.toJSON() : {},
      invoiceNumber: req.body.invoiceNumber || invoiceNumber,
    });
    
    const plain = invoice.get({ plain: true });
    res.status(201).json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    const plain = invoice.get({ plain: true });
    res.json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update invoice
const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    await invoice.update(req.body);
    
    const plain = invoice.get({ plain: true });
    res.json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get next invoice number
const getNextInvoiceNumber = async (req, res) => {
  try {
    const invoiceNumber = await generateInvoiceNumber(req.user.id);
    const settings = await Settings.findOne({ where: { userId: req.user.id } });
    if (settings) {
      await settings.update({ invoiceCounter: Math.max(1, settings.invoiceCounter - 1) });
    }
    res.json({ invoiceNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Download invoice as PDF
const downloadInvoicePDF = async (req, res) => {
  let browser;
  try {
    const invoice = await Invoice.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const html = generateInvoiceHTML(invoice);
    
    const chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];
    const executablePath = chromePaths.find(p => fs.existsSync(p));

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(html, { waitUntil: 'load' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true
    });

    await browser.close();
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Invoice_${invoice.invoiceNumber}.pdf"`);
    res.send(pdf);
  } catch (error) {
    if (browser) await browser.close();
    res.status(500).send(`Error generating PDF: ${error.message}`);
  }
};

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };
  const rupees = Math.floor(num);
  let result = convert(rupees) + ' Rupees Only';
  return result;
};

const generateInvoiceHTML = (invoice) => {
  const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' };
  const symbol = currencySymbols[invoice.currency] || invoice.currency;
  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  
  const customization = invoice.customization || { color: '#2563eb' };
  const primaryColor = customization.color;

  const itemRows = (invoice.items || []).map((item, i) => `
    <tr class="item-row">
      <td style="text-align: center; color: #64748b; font-size: 10px;">${i + 1}</td>
      <td style="padding-left: 10px;">
        <div style="font-weight: 700; color: #1e293b; font-size: 12px;">${item.name}</div>
        ${item.description ? `<div style="font-size: 9px; color: #64748b; margin-top: 2px;">${item.description}</div>` : ''}
      </td>
      <td style="text-align: center;">${item.hsn || '-'}</td>
      <td style="text-align: center;">${item.quantity} ${item.unit || 'pcs'}</td>
      <td style="text-align: right;">${fmt(item.rate)}</td>
      <td style="text-align: center;">${item.taxRate}%</td>
      <td style="text-align: right; font-weight: 700; color: #1e293b;">${fmt(item.total)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { color: #1e293b; line-height: 1.5; font-size: 11px; background: white; padding: 40px; }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 20px; }
  .logo { max-height: 60px; max-width: 200px; object-fit: contain; }
  .title-area h1 { font-size: 28px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; letter-spacing: -1px; }
  .title-area p { color: #64748b; font-weight: 700; font-size: 14px; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
  .section-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: ${primaryColor}; margin-bottom: 8px; letter-spacing: 1px; }
  .biz-name { font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .biz-details { color: #475569; font-size: 10px; line-height: 1.6; }

  .meta-grid { background: #f8fafc; border-radius: 16px; padding: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
  .meta-item label { display: block; font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
  .meta-item span { font-size: 12px; font-weight: 700; color: #1e293b; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  thead th { background: ${primaryColor}; color: white; padding: 12px 10px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: 700; }
  td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }

  .summary-section { display: flex; justify-content: space-between; gap: 40px; }
  .notes-area { flex: 1; }
  .totals-area { width: 280px; }
  
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 11px; border-bottom: 1px dashed #e2e8f0; }
  .total-row.grand { border-bottom: none; margin-top: 10px; background: ${primaryColor}; color: white; padding: 12px; border-radius: 8px; }
  .total-row.grand label { font-size: 14px; font-weight: 800; }
  .total-row.grand span { font-size: 18px; font-weight: 800; }

  .words-box { background: #f8fafc; padding: 15px; border-radius: 12px; margin-top: 20px; font-size: 10px; border: 1px solid #e2e8f0; }
  .words-box b { color: ${primaryColor}; text-transform: uppercase; font-size: 8px; display: block; margin-bottom: 4px; }

  .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
  .bank-details { font-size: 9px; color: #64748b; }
  .signature { text-align: right; }
  .sig-line { border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 10px; font-weight: 800; font-size: 10px; text-transform: uppercase; width: 180px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      ${invoice.businessDetails?.logoUrl ? `<img src="${invoice.businessDetails.logoUrl}" class="logo">` : `<h2 style="font-size: 24px; font-weight: 800;">${invoice.businessDetails?.businessName || invoice.businessName}</h2>`}
    </div>
    <div class="title-area">
      <h1>${invoice.invoiceTitle}</h1>
      <p># ${invoice.invoiceNumber}</p>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="section-label">Billed By</div>
      <div class="biz-name">${invoice.businessDetails?.businessName || invoice.businessName}</div>
      <div class="biz-details">
        ${invoice.businessDetails?.address || invoice.businessAddress}<br>
        Email: ${invoice.businessDetails?.email || ''} | Phone: ${invoice.businessDetails?.phone || ''}<br>
        <b>GSTIN: ${invoice.businessDetails?.gstin || ''}</b>
      </div>
    </div>
    <div style="text-align: right;">
      <div class="section-label">Billed To</div>
      <div class="biz-name">${invoice.clientName}</div>
      <div class="biz-details">
        ${invoice.clientDetails?.billingAddress?.address1 || invoice.clientAddress}<br>
        ${invoice.clientDetails?.billingAddress?.city || ''}, ${invoice.clientDetails?.billingAddress?.state || ''}<br>
        <b>GSTIN: ${invoice.clientDetails?.gstin || ''}</b>
      </div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>Date of Issue</label>
      <span>${formatDate(invoice.invoiceDate)}</span>
    </div>
    <div class="meta-item">
      <label>Due Date</label>
      <span>${formatDate(invoice.dueDate)}</span>
    </div>
    <div class="meta-item">
      <label>PO / Reference</label>
      <span>${invoice.referenceNumber || '-'}</span>
    </div>
    <div class="meta-item">
      <label>Currency</label>
      <span>${invoice.currency}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Item Description</th>
        <th style="width: 80px; text-align: center;">HSN</th>
        <th style="width: 60px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Rate</th>
        <th style="width: 60px; text-align: center;">Tax</th>
        <th style="width: 120px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="summary-section">
    <div class="notes-area">
      <div class="section-label">Notes & Terms</div>
      <div style="font-size: 10px; color: #64748b;">${invoice.notes || 'No notes provided.'}</div>
      
      <div class="words-box">
        <b>Amount in words</b>
        ${numberToWords(invoice.total)}
      </div>

      <div class="bank-details" style="margin-top: 30px;">
        <div class="section-label">Bank Details</div>
        Bank: ${invoice.businessDetails?.bankName || '-'}<br>
        A/C: ${invoice.businessDetails?.accountNumber || '-'}<br>
        IFSC: ${invoice.businessDetails?.ifscCode || '-'}
      </div>
    </div>
    <div class="totals-area">
      <div class="total-row">
        <label>Subtotal</label>
        <span>${symbol} ${fmt(invoice.subtotal)}</span>
      </div>
      <div class="total-row">
        <label>Tax (GST)</label>
        <span>${symbol} ${fmt(invoice.taxTotal)}</span>
      </div>
      ${invoice.shippingCharges > 0 ? `
      <div class="total-row">
        <label>Shipping</label>
        <span>${symbol} ${fmt(invoice.shippingCharges)}</span>
      </div>` : ''}
      <div class="total-row grand">
        <label>Grand Total</label>
        <span>${symbol} ${fmt(invoice.total)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div style="font-size: 8px; color: #94a3b8;">
      Generated by InvoiceFlow • professional invoicing software
    </div>
    <div class="signature">
      <div style="height: 50px;">
        ${(invoice.signature?.image || invoice.businessDetails?.signatureUrl) ? `<img src="${invoice.signature?.image || invoice.businessDetails.signatureUrl}" style="max-height: 50px;">` : ''}
      </div>
      <div class="sig-line">${invoice.signature?.label || 'Authorized Signatory'}</div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
  downloadInvoicePDF
};
