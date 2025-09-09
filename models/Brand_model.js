const mongoose = require('mongoose')

const Brand = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });


module.exports = mongoose.model("Brand",Brand)