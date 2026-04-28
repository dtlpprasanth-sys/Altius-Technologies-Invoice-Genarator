const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // connect to the default db to create the new one
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');
    
    // Check if db exists
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'invoice_generator'`);
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE invoice_generator');
      console.log('Database "invoice_generator" created successfully!');
    } else {
      console.log('Database "invoice_generator" already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
  } finally {
    await client.end();
  }
}

createDatabase();
