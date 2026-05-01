const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  clientId: { type: DataTypes.UUID },
  
  // 1. Enhanced Header
  invoiceTitle: { type: DataTypes.STRING, defaultValue: 'Export Invoice' },
  invoiceSubTitle: { type: DataTypes.STRING },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false },
  referenceNumber: { type: DataTypes.STRING }, // PO/Reference
  poNoAndDate: { type: DataTypes.STRING },
  softwareExportType: { type: DataTypes.STRING, defaultValue: 'Data Entry and conversion, Software processing, RBI Code: 907' },
  invoiceDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dueDate: { type: DataTypes.DATE },
  customFields: { type: DataTypes.JSONB, defaultValue: [] }, // [{ label: '', value: '' }]
  status: { 
    type: DataTypes.ENUM('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'), 
    defaultValue: 'draft' 
  },
  
  // 2. Business & Client Block
  business: { type: DataTypes.JSONB },
  businessDetails: { type: DataTypes.JSONB },
  businessName: { type: DataTypes.STRING },
  businessAddress: { type: DataTypes.TEXT },
  businessGstin: { type: DataTypes.STRING },
  businessPan: { type: DataTypes.STRING },
  ieCode: { type: DataTypes.STRING },
  cin: { type: DataTypes.STRING },
  website: { type: DataTypes.STRING },
  lutDetails: { type: DataTypes.TEXT },
  clientName: { type: DataTypes.STRING },
  clientAddress: { type: DataTypes.TEXT },
  client: { type: DataTypes.JSONB },
  clientDetails: { type: DataTypes.JSONB },
  logoUrl: { type: DataTypes.TEXT },
  signatureUrl: { type: DataTypes.TEXT },
  showShipping: { type: DataTypes.BOOLEAN, defaultValue: false },
  shippingDetails: { type: DataTypes.JSONB },
  placeOfSupply: { type: DataTypes.STRING },

  // 3. Advanced Item Section
  items: { type: DataTypes.JSONB, defaultValue: [] }, 
  // Schema: { id, name, sku, description, image, hsn, quantity, unit, rate, discount, taxRate, amount, total }
  
  // 4. Financials & Tax Engine
  currency: { type: DataTypes.STRING, defaultValue: 'INR' },
  exchangeRate: { type: DataTypes.STRING, defaultValue: '1' },
  taxInclusive: { type: DataTypes.BOOLEAN, defaultValue: false },
  roundingEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  
  subtotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discountValue: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  discountType: { type: DataTypes.ENUM('fixed', 'percentage'), defaultValue: 'fixed' },
  additionalCharges: { type: DataTypes.JSONB, defaultValue: [] }, 
  bankCharges: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }, 
  taxBreakdown: { type: DataTypes.JSONB, defaultValue: {} }, 
  taxTotal: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  totalInINR: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },

  // 5. Signature & Attachments
  signature: { type: DataTypes.JSONB }, // { url: '', label: '', type: 'upload|draw' }
  attachments: { type: DataTypes.JSONB, defaultValue: [] },
  additionalInfo: { type: DataTypes.JSONB, defaultValue: [] },

  // 6. Terms & Recurring
  notes: { type: DataTypes.TEXT },
  terms: { type: DataTypes.JSONB, defaultValue: [] },
  recurring: { type: DataTypes.JSONB, defaultValue: { enabled: false, frequency: 'monthly' } },
  
  // 7. Advanced Display Controls (The "Power" Section)
  displayControls: {
    type: DataTypes.JSONB,
    defaultValue: {
      showSKU: false,
      showHSN: true,
      showDescription: true,
      showItemImage: false,
      showItemDiscount: true,
      showTotalQuantity: true,
      showTaxSummary: true,
      fullWidthDescription: false,
      color: '#2563eb',
      template: 'modern'
    }
  },
  
  auditTrail: { type: DataTypes.JSONB, defaultValue: [] }
}, {
  timestamps: true
});

module.exports = Invoice;
