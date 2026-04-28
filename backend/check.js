const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('invoice_generator', 'postgres', 'root', { host: '127.0.0.1', dialect: 'postgres' });
sequelize.query('SELECT * FROM "Settings" LIMIT 1').then(r => console.log(r[0])).catch(console.error);
