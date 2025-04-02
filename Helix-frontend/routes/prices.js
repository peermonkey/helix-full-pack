const express = require('express');
const router = express.Router();
const { getPriceModel } = require('../models/PriceData');

// Get available coins for price data
router.get('/available', async (req, res) => {
  try {
    const availableCoins = ['btc', 'eth'];
    res.json({ coins: availableCoins });
  } catch (err) {
    console.error('Error fetching available coins:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get the latest real-time price data
router.get('/:coin', async (req, res) => {
  const { coin } = req.params;
  console.log(`GET /api/prices/${coin} route hit`);
  
  // Validate inputs
  const validCoins = ['btc', 'eth'];
  
  if (!validCoins.includes(coin.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid coin' });
  }
  
  try {
    // Get the appropriate model
    const PriceModel = getPriceModel(coin.toLowerCase());
    
    // Get the limit parameter or default to 100
    const limit = parseInt(req.query.limit) || 100;
    
    // Fetch the latest price data, sorted by time (newest first)
    const priceData = await PriceModel.find()
      .sort({ time: -1 })
      .limit(limit);
    
    console.log(`Found ${priceData.length} price records for ${coin}_prices`);
    
    if (priceData.length === 0) {
      return res.status(404).json({ message: 'No price data found' });
    }
    
    // Get the latest price
    const latestPrice = priceData[0].price;
    
    // Add timestamp for client to know when data was fetched
    const responseData = {
      prices: priceData,
      latestPrice: latestPrice,
      fetchedAt: new Date()
    };
    
    res.json(responseData);
  } catch (err) {
    console.error(`Error fetching ${coin}_prices data:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 