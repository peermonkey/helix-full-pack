const express = require('express');
const router = express.Router();
const { getCryptoModel } = require('../models/CryptoData');

// Get available coins and timeframes
router.get('/available', async (req, res) => {
  try {
    const availableCoins = ['btc', 'eth'];
    const availableTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '6h', '8h', '12h', '1d', '1w', '1M'];
    
    res.json({ coins: availableCoins, timeframes: availableTimeframes });
  } catch (err) {
    console.error('Error fetching available options:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get crypto data
router.get('/:coin/:timeframe', async (req, res) => {
  const { coin, timeframe } = req.params;
  console.log(`GET /api/crypto/${coin}/${timeframe} route hit`);
  
  // Validate inputs
  const validCoins = ['btc', 'eth'];
  const validTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '6h', '8h', '12h', '1d', '1w', '1M'];
  
  if (!validCoins.includes(coin.toLowerCase())) {
    return res.status(400).json({ message: 'Invalid coin' });
  }
  
  if (!validTimeframes.includes(timeframe)) {
    return res.status(400).json({ message: 'Invalid timeframe' });
  }
  
  try {
    // Get the appropriate model for the collection
    const CryptoModel = getCryptoModel(coin.toLowerCase(), timeframe);
    
    // Get the limit parameter or default to 100
    const limit = parseInt(req.query.limit) || 100;
    
    // Fetch the data, sorted by most recent first
    const cryptoData = await CryptoModel.find()
      .sort({ openTime: -1 })
      .limit(limit);
    
    console.log(`Found ${cryptoData.length} records for ${coin}_${timeframe}`);
    
    if (cryptoData.length === 0) {
      return res.status(404).json({ message: 'No data found for specified parameters' });
    }
    
    res.json(cryptoData);
  } catch (err) {
    console.error(`Error fetching ${coin}_${timeframe} data:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 