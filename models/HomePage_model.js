const mongoose = require("mongoose");

const homePageSchema = new mongoose.Schema(
  {
    banners: [
      {
        BannerId: { type: mongoose.Schema.Types.ObjectId, ref: "Banner" },
      },
    ],
    featuredCategories: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],

    trendingProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    newArrivals: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      },
    ],
    flashDeals: {
      end_time: { type: Date },
      products: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
          discount: { type: Number }, // in %
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomePage", homePageSchema);
