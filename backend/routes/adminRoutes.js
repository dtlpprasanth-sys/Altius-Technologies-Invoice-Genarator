const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getMe, 
  listAdmins, 
  createAdmin, 
  toggleStatus 
} = require('../controllers/adminController');
const { protect, protectAdmin } = require('../middleware/auth');

router.get('/list', protect, protectAdmin, listAdmins);
router.post('/create', protect, protectAdmin, createAdmin);
router.put('/:id/toggle-status', protect, protectAdmin, toggleStatus);

module.exports = router;
