const mongoose = require('mongoose');

const helixDataSchema = new mongoose.Schema({
  timeframe: String,
  btcDelta: Number,
  ethDelta: Number,
  helixValue: Number,
  cumulativeHelixValue: Number,
  time: Date,
  interpretation: String,
  lastUpdateTime: Date,
  createdAt: Date,
  updatedAt: Date,
  __v: Number
});

// Create a model factory function for different helix collections
const getHelixModel = (timeframe) => {
  const collectionName = `helix_${timeframe}`;
  return mongoose.model(collectionName, helixDataSchema, collectionName);
};

module.exports = { getHelixModel }; 