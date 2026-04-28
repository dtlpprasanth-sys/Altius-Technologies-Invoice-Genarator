const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Client = sequelize.define('Client', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  
  // Tab 1: General
  clientType: { type: DataTypes.ENUM('Individual', 'Company'), defaultValue: 'Company' },
  businessName: { type: DataTypes.STRING, allowNull: false },
  industry: { type: DataTypes.STRING },
  alias: { type: DataTypes.STRING },
  uniqueKey: { type: DataTypes.STRING },
  logoUrl: { type: DataTypes.TEXT },
  
  // Tab 2: Contact & Address
  email: { type: DataTypes.STRING },
  showEmailInInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
  phone: { type: DataTypes.STRING },
  showPhoneInInvoice: { type: DataTypes.BOOLEAN, defaultValue: false },
  country: { type: DataTypes.STRING, defaultValue: 'India' },
  state: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  postalCode: { type: DataTypes.STRING },
  streetAddress: { type: DataTypes.TEXT },
  
  // Tab 3: Tax Info
  gstin: { type: DataTypes.STRING },
  pan: { type: DataTypes.STRING },
  taxTreatment: { type: DataTypes.STRING },

  // Tab 4: Billing & Settings
  defaultDueDate: { type: DataTypes.INTEGER, defaultValue: 15 },
  paymentAccount: { type: DataTypes.STRING },
  upiId: { type: DataTypes.STRING },

  // Keep 'name' as a real field to avoid 'virtual' type errors in Postgres
  // and sync it with businessName for backward compatibility
  name: { type: DataTypes.STRING }
}, {
  timestamps: true,
  hooks: {
    beforeSave: (client) => {
      if (client.businessName) {
        client.name = client.businessName;
      }
    }
  }
});

module.exports = Client;
