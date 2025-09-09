const mongoose = require("mongoose");

const address = new mongoose.Schema({
  phone: { type: Number }, // e.g., "Small", "Large", "XL"
  pin_code: { type: Number, required: true },
  locality: { type: String }, // discount price per variant
  address: { type: String },
  town: { type: String },
  state: { type: String }, // discount price per variant
  landmark: { type: String },
  alternate_phone: { type: Number },
  flag: { type: Boolean, default: false },
});

const User = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true,required:true },
    password: { type: String, required: true },
    flag: { type: Boolean, default: true },
    address: [address],
    liked_products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        default: null 
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", User);
