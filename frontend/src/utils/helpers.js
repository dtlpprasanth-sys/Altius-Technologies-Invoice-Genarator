// Number to words (Indian numbering system)
export const numberToWords = (num, currency = 'INR') => {
  const majorCurrency = currency === 'INR' ? 'Rupees' : currency === 'USD' ? 'Dollars' : currency === 'EUR' ? 'Euros' : currency === 'GBP' ? 'Pounds' : currency;
  const minorCurrency = currency === 'INR' ? 'Paise' : 'Cents';

  if (!num || isNaN(num)) return `Zero ${majorCurrency} Only`;
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const major = Math.floor(num);
  const minor = Math.round((num - major) * 100);
  let result = convert(major) + ` ${majorCurrency}`;
  if (minor > 0) result += ' and ' + convert(minor) + ` ${minorCurrency}`;
  return result + ' Only';
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
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
