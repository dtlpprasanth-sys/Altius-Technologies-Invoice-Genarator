const Settings = require('../models/Settings');

// @desc Get settings
// @route GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create a default shared record if none exists
      settings = await Settings.create({ 
        userId: req.user.id, 
        businessName: 'My Organization' 
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update settings
// @route PUT /api/settings
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ ...req.body, userId: req.user.id });
    } else {
      await settings.update(req.body);
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
