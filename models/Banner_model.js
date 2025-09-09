const mongoose = require('mongoose')

const Banner = new mongoose.Schema({
  heading: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  button_name: { type: String, required: true },
  link: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  position: { type: String, enum: ['hero', 'slider','footer'], default: 'hero' },
}, { timestamps: true });


module.exports = mongoose.model("Banner",Banner)