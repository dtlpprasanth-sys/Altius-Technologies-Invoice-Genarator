require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/units', require('./routes/unitRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Admin Seeding
const seedAdmin = async () => {
  try {
    const { User, Settings } = require('./models');
    let adminUser = await User.findOne({ where: { email: 'admin' } });
    
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Administrator',
        email: 'admin',
        password: 'admin123',
        isAdmin: true
      });
      await Settings.create({ userId: adminUser.id, businessName: 'Admin Corp' });
      console.log('👤 Default admin created in User table: admin / admin123');
    } else if (!adminUser.isAdmin) {
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log('👤 Existing admin user updated with isAdmin privileges');
    }
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
  }
};

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });
}

const startServer = async () => {
  try {
    // Wait for Database to connect before starting the server
    await connectDB();
    await seedAdmin();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;