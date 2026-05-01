const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  unit: { type: DataTypes.STRING, defaultValue: 'per SKU' },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  hsnCode: { type: DataTypes.STRING },
  userId: { type: DataTypes.UUID, allowNull: false }
});

module.exports = Product;
