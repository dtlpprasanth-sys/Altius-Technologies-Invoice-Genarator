const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['name', 'userId']
    }
  ]
});

module.exports = Unit;
