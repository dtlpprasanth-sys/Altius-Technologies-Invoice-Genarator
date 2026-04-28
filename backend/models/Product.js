const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  hsnCode: { type: DataTypes.STRING },
  userId: { type: DataTypes.UUID, allowNull: false }
});

module.exports = Product;
