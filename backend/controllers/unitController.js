const Unit = require('../models/Unit');

// @desc    Get all units for user
// @route   GET /api/units
// @access  Private
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'ASC']]
    });

    // If no units, seed defaults
    if (units.length === 0) {
      const defaults = ['Nos', 'per SKU', 'PCS', 'Box', 'Set', 'Kg', 'Meters'];
      const seeded = await Unit.bulkCreate(
        defaults.map(name => ({ name, userId: req.user.id }))
      );
      return res.json(seeded);
    }

    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a unit
// @route   POST /api/units
// @access  Private
exports.createUnit = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if exists
    let unit = await Unit.findOne({ where: { name, userId: req.user.id } });
    if (unit) return res.status(400).json({ message: 'Unit already exists' });

    unit = await Unit.create({
      name,
      userId: req.user.id
    });

    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
