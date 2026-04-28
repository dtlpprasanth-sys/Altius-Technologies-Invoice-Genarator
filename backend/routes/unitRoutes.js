const express = require('express');
const router = express.Router();
const { getUnits, createUnit } = require('../controllers/unitController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getUnits);
router.post('/', createUnit);

module.exports = router;
