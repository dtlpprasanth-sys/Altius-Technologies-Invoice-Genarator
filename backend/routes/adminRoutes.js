const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getMe, 
  listAdmins, 
  createAdmin, 
  toggleStatus,
  deleteAdmin,
  resetAdminPassword 
} = require('../controllers/adminController');
const { protect, protectAdmin } = require('../middleware/auth');

router.post('/login', adminLogin);
router.get('/me', protect, protectAdmin, getMe);
router.get('/list', protect, protectAdmin, listAdmins);
router.post('/create', protect, protectAdmin, createAdmin);
router.put('/:id/toggle-status', protect, protectAdmin, toggleStatus);
router.put('/:id/reset-password', protect, protectAdmin, resetAdminPassword);
router.delete('/:id', protect, protectAdmin, deleteAdmin);

module.exports = router;
