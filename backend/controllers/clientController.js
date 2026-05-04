const Client = require('../models/Client');
const { Op } = require('sequelize');

// @desc Get all clients
// @route GET /api/clients
const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({ 
      order: [['createdAt', 'DESC']]
    });
    
    // Add _id alias for frontend compatibility
    const formattedClients = clients.map(c => {
      const plain = c.get({ plain: true });
      return { ...plain, _id: plain.id };
    });
    
    res.json(formattedClients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create client
// @route POST /api/clients
const createClient = async (req, res) => {
  try {
    const client = await Client.create({ ...req.body, userId: req.user.id });
    
    const plain = client.get({ plain: true });
    res.status(201).json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get client by ID
// @route GET /api/clients/:id
const getClientById = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { id: req.params.id } });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    const plain = client.get({ plain: true });
    res.json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update client
// @route PUT /api/clients/:id
const updateClient = async (req, res) => {
  try {
    const client = await Client.findOne({ where: { id: req.params.id } });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    await client.update(req.body);
    
    const plain = client.get({ plain: true });
    res.json({ ...plain, _id: plain.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete client
// @route DELETE /api/clients/:id
const deleteClient = async (req, res) => {
  try {
    const deleted = await Client.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClients, createClient, getClientById, updateClient, deleteClient };
