const mongoose = require("mongoose");

// Variant schema for products with sizes or other variations
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Small", "Large", "XL"
  price: { type: Number, required: true },
  discount_price: { type: Number }, // discount price per variant
  quantity: { type: Number, required: true },
  flag: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,

  brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

  price: { type: Number }, // used only if no variants
  discount_price: { type: Number }, // used only if no variants
  quantity: { type: Number }, // used only if no variants

  images: [String], // array of image URLs
  front_image: { type: String }, // single image URL

  hasVariants: { type: Boolean, default: false },

  variants: [variantSchema], // only used if hasVariants = true

  status: { type: String, enum: ["active", "inactive"], default: "active" },
  features: { type: Array },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
