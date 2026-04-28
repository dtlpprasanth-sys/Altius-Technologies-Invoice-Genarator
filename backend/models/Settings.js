const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Settings = sequelize.define('Settings', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, unique: true },
  businessName: { type: DataTypes.STRING },
  address: { type: DataTypes.TEXT },
  city: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
  pincode: { type: DataTypes.STRING },
  country: { type: DataTypes.STRING, defaultValue: 'India' },
  phone: { type: DataTypes.STRING },
  telephone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  registeredOffice: { type: DataTypes.TEXT },
  gstin: { type: DataTypes.STRING },
  pan: { type: DataTypes.STRING },
  satelliteStation: { type: DataTypes.STRING },
  logoUrl: { type: DataTypes.TEXT },
  signatureUrl: { type: DataTypes.TEXT },
  bankName: { type: DataTypes.STRING },
  accountName: { type: DataTypes.STRING },
  accountNumber: { type: DataTypes.STRING },
  ifscCode: { type: DataTypes.STRING },
  iban: { type: DataTypes.STRING },
  swiftCode: { type: DataTypes.STRING },
  invoicePrefix: { type: DataTypes.STRING, defaultValue: 'INV' },
  invoiceCounter: { type: DataTypes.INTEGER, defaultValue: 1 },
  ieCode: { type: DataTypes.STRING },
  cin: { type: DataTypes.STRING },
  website: { type: DataTypes.STRING },
  lutDetails: { type: DataTypes.TEXT },
  softwareExportType: { type: DataTypes.STRING, defaultValue: 'Data Entry and conversion, Software processing, RBI Code: 907' }
});

module.exports = Settings;
