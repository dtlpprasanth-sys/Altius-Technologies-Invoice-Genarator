const User = require('../models/User');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'invoice_generator_fallback_secret_key_2024';
  if (!process.env.JWT_SECRET) {
    console.log('⚠️ WARNING: Using fallback JWT_SECRET. Check your .env file.');
  }
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// @desc Register user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (userExists) return res.status(400).json({ message: 'User already exists with this email' });

    // Create user
    const user = await User.create({ 
      name, 
      email: email.toLowerCase().trim(), 
      password 
    });

    // Create default settings if none exist (shared system)
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({ userId: user.id, businessName: name });
    }

    // Send response formatted for frontend expectations
    res.status(201).json({
      _id: user.id, // Aliasing for frontend
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user.id),
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated. Please contact administrator.' });
      }

      res.json({
        _id: user.id, // Aliasing for frontend
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get user profile
// @route GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userObj = user.get({ plain: true });
    userObj._id = userObj.id; // Aliasing for frontend
    
    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
