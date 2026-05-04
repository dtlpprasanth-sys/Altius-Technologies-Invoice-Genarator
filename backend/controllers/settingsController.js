const Settings = require('../models/Settings');

// @desc Get settings
// @route GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ userId: req.user.id });
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
    if (settings) {
      await settings.update(req.body);
    } else {
      settings = await Settings.create({ ...req.body, userId: req.user.id });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
