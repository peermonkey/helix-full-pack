const mongoose = require('mongoose');

const priceDataSchema = new mongoose.Schema({
  time: Date,
  symbol: String,
  isBuyerMaker: Boolean,
  quantity: String,
  formattedTime: String,
  tradeId: Number,
  price: String,
  __v: Number
});

// Create a model factory function for different price collections
const getPriceModel = (coin) => {
  const collectionName = `${coin}_prices`;
  return mongoose.model(collectionName, priceDataSchema, collectionName);
};

module.exports = { getPriceModel }; 