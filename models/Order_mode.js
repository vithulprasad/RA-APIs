// models/Order.js
const mongoose = require("mongoose");
const { buildOrderEmail } = require("../config/builder");
const { sendEmail } = require("../config/mailer");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, default: 1 },
        total_price: { type: Number, required: true }, // snapshot price at time of order
        variant: { type: String, default: "" },
      },
    ],

    totalAmount: { type: Number, required: true },

    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "created",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    address: {
      name: { type: String, required: true },
      phone: { type: Number }, // e.g., "Small", "Large", "XL"
      pinCode: { type: Number, required: true },
      locality: { type: String }, // discount price per variant
      address: { type: String },
      town: { type: String },
      state: { type: String }, // discount price per variant
      landMark: { type: String },
      country: { type: String, required: true, default: "India" },
    },

    // audit logs
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    order_from: {
      type: String,
      enum: ["cart", "single"],
    },
  },
  { timestamps: true }
);

orderSchema.post("save", async function (doc) {
  try {
    if (doc.paymentStatus === "paid") {
      const htmlContent = buildOrderEmail({ user: find_user, order: doc });

      const data_mew = await sendEmail(
        process.env.ADMIN_EMAIL,
        "Real Accessories Product purchase details",
        htmlContent
      );
    }
  } catch (err) {
    console.error("❌ Error sending email in post-save:", err);
  }
});

orderSchema.post("findOneAndUpdate", async function (doc) {
  try {
    if (doc && doc.paymentStatus === "paid") {
      const htmlContent = buildOrderEmail({ user: find_user, order: doc });

      const data_mew = await sendEmail(
        process.env.ADMIN_EMAIL,
        "Real Accessories Product purchase details",
        htmlContent
      );
    }
  } catch (err) {
    console.error("❌ Error sending email in post-update:", err);
  }
});
module.exports = mongoose.model("Order", orderSchema);
