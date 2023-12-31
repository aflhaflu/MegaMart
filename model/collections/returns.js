require("../../config/dbconfg");
require("dotenv").config();
const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const schema = mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  product: {
    type: ObjectId,
  },
  reason: {
    type: String,
  },
  finalPrice: {
    type: Number,
  },
  image: {
    type: String,
  },
  returnedDate: {
    type: Date,
  },
  orderDate: {
    type: Date,
  },
});

// module.exports = mongoose.model("Cart", schema);
module.exports = mongoose.model(process.env.RETURN_COLLECTION, schema);
