// Number to words (Indian numbering system)
export const numberToWords = (num, currency = 'INR') => {
  if (!num || isNaN(num)) return `ZERO ONLY`;
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const convertIndian = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convertIndian(n % 100) : '');
    if (n < 100000) return convertIndian(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convertIndian(n % 1000) : '');
    if (n < 10000000) return convertIndian(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convertIndian(n % 100000) : '');
    return convertIndian(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convertIndian(n % 10000000) : '');
  };

  const convertInternational = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convertInternational(n % 100) : '');
    if (n < 1000000) return convertInternational(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convertInternational(n % 1000) : '');
    if (n < 1000000000) return convertInternational(Math.floor(n / 1000000)) + ' MILLION' + (n % 1000000 ? ' ' + convertInternational(n % 1000000) : '');
    return convertInternational(Math.floor(n / 1000000000)) + ' BILLION' + (n % 1000000000 ? ' ' + convertInternational(n % 1000000000) : '');
  };

  const convert = currency === 'INR' ? convertIndian : convertInternational;

  const major = Math.floor(num);
  const minor = Math.round((num - major) * 100);
  
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
  if (minor > 0) {
    result += ' AND ' + convert(minor) + ' ' + minorLabel;
  }
  
  return result + ' ONLY';
};

// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

// Calculate invoice totals
export const calculateTotals = (items, globalTaxes, discount, discountType, additionalCharges, exchangeRate = 1, currency = 'INR', gstType = 'intra') => {
  // Calculate each item's tax and total
  const itemsWithCalculations = items.map(item => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    const taxableAmount = qty * rate;
    const totalTaxRate = Number(item.taxRate || 0);
    const taxAmount = (taxableAmount * totalTaxRate) / 100;
    
    // Split for CGST/SGST (Half each for intra-state)
    const cgst = gstType === 'intra' ? taxAmount / 2 : 0;
    const sgst = gstType === 'intra' ? taxAmount / 2 : 0;
    const igst = gstType === 'inter' ? taxAmount : 0;

    return {
      ...item,
      amount: taxableAmount,
      cgst,
      sgst,
      igst,
      taxAmount,
      totalAmount: taxableAmount + taxAmount
    };
  });

  const subtotal = itemsWithCalculations.reduce((sum, item) => sum + item.amount, 0);
  const totalCgst = itemsWithCalculations.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = itemsWithCalculations.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = itemsWithCalculations.reduce((sum, item) => sum + item.igst, 0);
  const itemTaxTotal = totalCgst + totalSgst + totalIgst;

  // Global taxes on subtotal
  const globalTaxesWithAmounts = (globalTaxes || []).map(tax => ({
    ...tax,
    amount: tax.type === 'percentage' ? (subtotal * Number(tax.value || 0)) / 100 : Number(tax.value || 0),
  }));
  const globalTaxTotal = globalTaxesWithAmounts.reduce((sum, tax) => sum + tax.amount, 0);

  const discountAmount = discountType === 'percentage'
    ? (subtotal * Number(discount || 0)) / 100
    : Number(discount || 0);

  const total = subtotal + itemTaxTotal + globalTaxTotal - discountAmount + Number(additionalCharges || 0);
  const totalInINR = currency === 'INR' ? total : total * Number(exchangeRate || 1);

  return { 
    subtotal: Number(subtotal.toFixed(2)), 
    taxTotal: Number((itemTaxTotal + globalTaxTotal).toFixed(2)), 
    totalCgst: Number(totalCgst.toFixed(2)),
    totalSgst: Number(totalSgst.toFixed(2)),
    totalIgst: Number(totalIgst.toFixed(2)),
    itemTaxTotal: Number(itemTaxTotal.toFixed(2)),
    globalTaxTotal: Number(globalTaxTotal.toFixed(2)),
    taxesWithAmounts: globalTaxesWithAmounts, 
    itemsWithCalculations,
    discountAmount: Number(discountAmount.toFixed(2)), 
    total: Number(total.toFixed(2)), 
    totalInINR: Number(totalInINR.toFixed(2)) 
  };
};

// Generate invoice number preview
export const getFinancialYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
