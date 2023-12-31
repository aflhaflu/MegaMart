require("../../config/dbconfg");
require("dotenv").config();
const mongoose = require("mongoose");
const schema = mongoose.Schema({
  categoryname: {
    type: String,
    required: true,
    unique: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    default: 0,
  },
  addedDate: {
    type: Date,
    required: true,
  },
  categoryImage: {
    type: String,
  },
  categorystatus: {
    type: Boolean,
    default:true,
  },
});

// module.exports = mongoose.model("Category", schema);
module.exports = mongoose.model(process.env.CATEGORY_COLLECTION, schema);
