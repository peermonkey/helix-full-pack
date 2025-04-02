const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Get all items
router.get('/', async (req, res) => {
  console.log('GET /api/items route hit');
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    console.log('Items found:', items.length);
    console.log('Sample item:', items[0]);
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new item
router.post('/', async (req, res) => {
  console.log('POST /api/items route hit');
  console.log('Request body:', req.body);
  
  const item = new Item({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price
  });

  try {
    const newItem = await item.save();
    console.log('New item created:', newItem);
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 