const express = require('express');
const router = express.Router();
const {
  getInvoices, createInvoice, getInvoiceById, updateInvoice, deleteInvoice,
  getNextInvoiceNumber, downloadInvoicePDF
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

router.get('/generate-number', protect, getNextInvoiceNumber);
router.route('/').get(protect, getInvoices).post(protect, createInvoice);
router.route('/:id').get(protect, getInvoiceById).put(protect, updateInvoice).delete(protect, deleteInvoice);
router.get('/:id/pdf', protect, downloadInvoicePDF);

module.exports = router;
