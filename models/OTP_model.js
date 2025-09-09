const mongoose = require('mongoose')

const OTP = new mongoose.Schema({
  OTP: { type: String, required: true },
  FROM: { type: String, required: true },
}, { timestamps: true });


module.exports = mongoose.model("OTP",OTP)