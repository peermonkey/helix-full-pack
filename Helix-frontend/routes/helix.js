const express = require('express');
const router = express.Router();
const { getHelixModel } = require('../models/HelixData');

// Get available timeframes for Helix data
router.get('/available', async (req, res) => {
  try {
    const availableTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '6h', '8h', '12h', '1d', '1w', '1M'];
    res.json({ timeframes: availableTimeframes });
  } catch (err) {
    console.error('Error fetching available timeframes:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get the latest Helix data for a specific timeframe
router.get('/:timeframe', async (req, res) => {
  const { timeframe } = req.params;
  console.log(`GET /api/helix/${timeframe} route hit`);
  
  // Validate inputs
  const validTimeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '6h', '8h', '12h', '1d', '1w', '1M'];
  
  if (!validTimeframes.includes(timeframe)) {
    return res.status(400).json({ message: 'Invalid timeframe' });
  }
  
  try {
    // Get the appropriate model
    const HelixModel = getHelixModel(timeframe);
    
    // Get the limit parameter or default to 50
    const limit = parseInt(req.query.limit) || 50;
    
    // Fetch the latest helix data, sorted by time (newest first)
    const helixData = await HelixModel.find()
      .sort({ time: -1 })
      .limit(limit);
    
    console.log(`Found ${helixData.length} helix records for helix_${timeframe}`);
    
    if (helixData.length === 0) {
      return res.status(404).json({ message: 'No helix data found for specified timeframe' });
    }
    
    // Get the latest data
    const latestData = helixData[0];
    
    // Add timestamp for client to know when data was fetched
    const responseData = {
      data: helixData,
      latestData: latestData,
      fetchedAt: new Date()
    };
    
    res.json(responseData);
  } catch (err) {
    console.error(`Error fetching helix_${timeframe} data:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 