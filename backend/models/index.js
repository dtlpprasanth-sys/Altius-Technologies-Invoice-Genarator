const User = require('./User');
const Client = require('./Client');
const Invoice = require('./Invoice');
const Product = require('./Product');
const Unit = require('./Unit');
const Settings = require('./Settings');
const Admin = require('./Admin');

// Define associations here if needed
User.hasMany(Invoice, { foreignKey: 'userId' });
Invoice.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Settings, { foreignKey: 'userId' });
Settings.belongsTo(User, { foreignKey: 'userId' });

Client.hasMany(Invoice, { foreignKey: 'clientId' });
Invoice.belongsTo(Client, { foreignKey: 'clientId' });

module.exports = {
  User,
  Client,
  Invoice,
  Product,
  Unit,
  Settings,
  Admin
};
