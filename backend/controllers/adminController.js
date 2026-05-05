const { Admin } = require('../models');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, isAdmin: true }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d'
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { User } = require('../models');

    const admin = await User.findOne({ where: { email: username.toLowerCase().trim(), isAdmin: true } });

    if (admin && (await admin.matchPassword(password))) {
      if (!admin.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      res.json({
        id: admin.id,
        username: admin.name,
        email: admin.email,
        token: generateToken(admin.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/me
// @access  Private (Admin)
exports.getMe = async (req, res) => {
  try {
    const { User } = require('../models');
    // The middleware might set req.user or req.admin, using req.user as standard
    const adminId = req.user?.id || req.admin?.id;
    const admin = await User.findByPk(adminId, {
      attributes: { exclude: ['password'] }
    });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List all admins
// @route   GET /api/admin/list
// @access  Private (Admin)
exports.listAdmins = async (req, res) => {
  try {
    const { User } = require('../models');
    const admins = await User.findAll({
      where: { isAdmin: true },
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new admin
// @route   POST /api/admin/create
// @access  Private (Admin)
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const { User, Settings } = require('../models');

    // Standardize to lowercase for reliable login
    const loginField = (email || username).toLowerCase().trim();

    const existingUser = await User.findOne({ where: { email: loginField } });
    
    if (existingUser) {
      if (existingUser.isAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
      }
      
      // Revive as admin
      existingUser.isAdmin = true;
      if (password) existingUser.password = password; // Update password if provided
      await existingUser.save();
      
      return res.status(200).json({
        id: existingUser.id,
        username: existingUser.name,
        email: existingUser.email,
        message: 'Existing user restored as admin'
      });
    }

    const admin = await User.create({
      name: username,
      email: loginField,
      password,
      isAdmin: true
    });

    await Settings.create({ userId: admin.id, businessName: `${username} Corp` });

    res.status(201).json({
      id: admin.id,
      username: admin.name,
      email: admin.email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle admin status
// @route   PUT /api/admin/:id/toggle-status
// @access  Private (Admin)
exports.toggleStatus = async (req, res) => {
  try {
    const { User } = require('../models');
    const admin = await User.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating yourself
    if (admin.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({ message: `Account status changed to ${admin.isActive ? 'Active' : 'Inactive'}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admin/:id
// @access  Private (Admin)
exports.deleteAdmin = async (req, res) => {
  try {
    const { User } = require('../models');
    const admin = await User.findByPk(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    const currentAdminId = req.user?.id || req.admin?.id;
    if (admin.id === currentAdminId) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await admin.destroy();

    res.json({ message: 'Admin account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Reset admin password
// @route   PUT /api/admin/:id/reset-password
// @access  Private (Admin)
exports.resetAdminPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { User } = require('../models');
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const admin = await User.findByPk(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'User not found' });
    }

    admin.password = password;
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
