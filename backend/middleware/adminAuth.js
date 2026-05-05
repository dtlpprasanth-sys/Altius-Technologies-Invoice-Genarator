const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

      // Check if it's an admin token
      if (!decoded.isAdmin) {
        return res.status(403).json({ message: 'Not authorized as admin' });
      }

      // Get admin from the User table
      req.admin = await User.findOne({
        where: { id: decoded.id, isAdmin: true },
        attributes: { exclude: ['password'] }
      });

      if (!req.admin || !req.admin.isActive) {
        return res.status(401).json({ message: 'Not authorized, admin not found or inactive' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protectAdmin };
