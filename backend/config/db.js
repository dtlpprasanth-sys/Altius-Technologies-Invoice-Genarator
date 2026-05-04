require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create Sequelize instance using direct IP for Windows stability
const sequelize = new Sequelize(
  process.env.DB_NAME || 'invoice_generator',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'root',
  {
    host: process.env.DB_HOST || '127.0.0.1', 
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    const dbUser = process.env.DB_USER || 'postgres';
    console.log(`Connecting as user: ${dbUser}...`);
    
    await sequelize.authenticate();
    console.log('✅ POSTGRESQL CONNECTED SUCCESSFULLY');
    
    // Sync models to database
    await sequelize.sync({ alter: true });
    console.log('✅ DATABASE TABLES SYNCED');
  } catch (error) {
    console.error('❌ POSTGRESQL CONNECTION ERROR:', error.message);
    console.log('---------------------------------------------------------');
    console.log('Please ensure database "invoice_generator" exists.');
    console.log('You can create it by typing "CREATE DATABASE invoice_generator;" in your SQL Shell.');
    console.log('---------------------------------------------------------');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
