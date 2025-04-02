const mongoose = require('mongoose');

const cryptoDataSchema = new mongoose.Schema({
  openTime: Number,
  open: String,
  high: String,
  low: String,
  close: String,
  volume: String,
  closeTime: Number,
  symbol: String,
  trades: Number,
  openTimeFormatted: String,
  closeTimeFormatted: String,
  completed: Boolean,
  fetchTimestamp: String,
  createdAt: Date,
  updatedAt: Date,
  __v: Number
});

// Create a dynamic model factory for different collections
const getCryptoModel = (coin, timeframe) => {
  const collectionName = `${coin}_${timeframe}`;
  return mongoose.model(collectionName, cryptoDataSchema, collectionName);
};

module.exports = { getCryptoModel }; 