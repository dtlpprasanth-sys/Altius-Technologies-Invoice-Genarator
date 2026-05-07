const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DeletedInvoice = sequelize.define('DeletedInvoice', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  originalId: { type: DataTypes.UUID },
  userId: { type: DataTypes.UUID, allowNull: false },
  clientId: { type: DataTypes.UUID },
  
  invoiceNumber: { type: DataTypes.STRING, allowNull: false },
  invoiceDate: { type: DataTypes.DATE },
  clientName: { type: DataTypes.STRING },
  total: { type: DataTypes.DECIMAL(15, 2) },
  currency: { type: DataTypes.STRING },
  
  // Snapshot of the entire invoice for audit
  fullData: { type: DataTypes.JSONB },
  
  deletionReason: { type: DataTypes.STRING },
  deletedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedBy: { type: DataTypes.UUID }
}, {
  timestamps: true
});

module.exports = DeletedInvoice;
