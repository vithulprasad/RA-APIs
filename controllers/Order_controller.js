const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order_mode");
const Product = require("../models/Product_model"); // for stock deduction
const cart_model = require("../models/Cart_model");
const user_model = require("../models/User_model");
const { sendEmail } = require("../config/mailer");
const { buildOrderEmail } = require("../config/builder");

exports.get_address = async (req, res) => {
  const user = req.user.user_id;

  const find_user = await user_model.findOne({ _id: user });

  return res
    .status(200)
    .json({ message: "address fetched", data: find_user.address.reverse() });
};

exports.single_product = async (req, res) => {
  const id = req.query.id;
  const qty = req.query.qty;
  const find_product = await Product.findOne({ _id: id });
  if (!find_product) {
    return res.status(400).json({ message: "product not fond" });
  }

  if (find_product.status == "inactive") {
    return res.status(400).json({ message: "product is unavailable" });
  }

  if (find_product.quantity <= 0) {
    return res.status(400).json({ message: "product is out of stock" });
  }

  if (find_product.quantity < qty) {
    return res.status(400).json({ message: "sorry quantity is limited" });
  }

  return res.status(200).json({ message: "finded", data: find_product });
};

exports.cart_find = async (req, res) => {
  const id = req.query.id;
  const find_cart = await cart_model
    .findOne({ _id: id })
    .populate("items.product");

  if (!find_cart) {
    return res.status(400).json({ message: "cart not found" });
  }

  if (!find_cart.items.length) {
    return res.status(400).json({ message: "cart is empty" });
  }

  const find_product_is_valid = find_cart.items.some(
    (val) => val.product.status == "inactive"
  );

  if (find_product_is_valid) {
    return res
      .status(400)
      .json({ message: "The cart containing inactive product" });
  }

  const filter_stock = find_cart.items.filter(
    (val) => val.product.quantity <= 0
  );
  console.log(filter_stock, "this is out of stock");

  if (!filter_stock.length == false) {
    return res.status(400).json({
      message: `${filter_stock.map(
        (val) => val.product.name
      )} this product are out of stock`,
    });
  }

  const filter_stock_quantity = find_cart.items.filter(
    (val) => val.product.quantity < val.quantity
  );

  if (filter_stock_quantity.length > 0) {
    return res.status(400).json({
      message: `${filter_stock_quantity.map(
        (val) => val.product.name
      )} - requested quantity is more than available stock`,
    });
  }

  return res.status(200).json({ message: "finded", data: find_cart.items });
};

// ✅ 1. Create Razorpay order + MongoDB order (pending)
exports.createOrder = async (req, res) => {
  try {
    const { products, address, type } = req.body;

    // ✅ Validate address fields
    const requiredFields = ["phone", "town", "landMark", "pinCode", "state"];
    for (const field of requiredFields) {
      if (
        !address ||
        !address[field] ||
        address[field].toString().trim() === ""
      ) {
        return res.status(400).json({
          message: `Address field '${field}' is required.`,
        });
      }
    }

    // ✅ Calculate totalAmount from DB
    let totalAmount = 0;

    for (const p of products) {
      const productDoc = await Product.findById(p.product);
      if (!productDoc) {
        return res
          .status(404)
          .json({ message: `Product not found: ${p.product}` });
      }
      totalAmount += productDoc.discount_price * p.quantity;
    }

    console.log("request is started razorpay", totalAmount);

    // ✅ Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // ✅ Create Razorpay order first
    const options = {
      amount: totalAmount * 100, // paise
      currency: "INR",
      receipt: Date.now().toString(),
    };

    const razorpayOrder = await razorpay.orders.create(options);
    console.log("Razorpay Order:", address);
    if (!razorpayOrder.id) {
      return res.status(400).json({ message: "error creating razorpay " });
    }

    // ✅ Create order in DB
    const newOrder = await Order.create({
      user: req.user.user_id,
      products: await Promise.all(
        products.map(async (p) => {
          const productDoc = await Product.findById(p.product);
          return {
            product: p.product,
            quantity: p.quantity,
            total_price: productDoc
              ? productDoc.discount_price * p.quantity
              : 0,
          };
        })
      ),
      totalAmount,
      razorpay_order_id: razorpayOrder.id,
      address,
      paymentStatus: "pending",
      orderStatus: "pending",
      order_from: type,
    });

    res.json({
      message: "Order created and pending payment",
      order: newOrder,
      raz: razorpayOrder,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ 2. Verify Razorpay payment (frontend -> backend)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const find_user = await user_model.findOne({ _id: req.user.user_id });

    // generate expected signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      // update order
      const order = await Order.findOneAndUpdate(
        { razorpay_order_id },
        {
          $set: {
            razorpay_payment_id,
            razorpay_signature,
            paymentStatus: "paid",
            orderStatus: "processing",
            paidAt: new Date(),
          },
        },
        { new: true }
      ).populate("products.product");

      // reduce stock safely
      for (const item of order.products) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { quantity: -item.quantity } }
        );
      }

      if (order.order_from == "cart") {
        await cart_model.findOneAndUpdate(
          { user: req.user.user_id },
          { $set: { items: [] } }
        );
      }

      const htmlContent = buildOrderEmail({ user: find_user, order: order });

     const data_mew = await sendEmail(
          `${find_user.email}, ${process.env.ADMIN_EMAIL}`,
          "Real Accessories Product purchase details",
          htmlContent
        );


      return res.json({
        success: true,
        message: "Payment verified",
        data: order._id,
        type: order.order_from,
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("verifyPayment error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ 3. Webhook (backup verification)
exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];
    if (digest !== signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;

      const data = await Order.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          $set: {
            razorpay_payment_id: payment.id,
            paymentStatus: "paid",
            orderStatus: "processing",
            paidAt: new Date(),
          },
        }
      );

      const htmlContent = `
      <div style="background-color:#f5f8fa; padding:20px; font-family:Arial, sans-serif; text-align:center;">

          <p><strong>Your Order:</strong> ${data}</p>
      </div>
  `;
      await sendEmail(process.env.ADMIN_EMAIL, "Real Accessories Order",htmlContent);

      // (Optional) Deduct stock here too as backup
    }

    res.json({ success: true });
  } catch (err) {
    console.log("webhook error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ 4. Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "name discount_price front_image");
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ 5. Get user’s own orders
exports.getUserOrders = async (req, res) => {
  try {
    const allowedStatuses = ["processing", "shipped", "delivered", "cancelled"];

    const orders = await Order.find({
      user: req.user.user_id,
      orderStatus: { $in: allowedStatuses }, // ✅ only allowed statuses
    }).populate("products.product", "name discount_price front_image");

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ 6. Update order status (admin only: shipped/delivered/cancelled)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { orderStatus: status },
      { new: true }
    );

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_order_single_by_id = async (req, res) => {
  try {
    const id = req.query.id;

    const order = await Order.findOne({ _id: id })
      .populate("products.product", "name") // ✅ only get product name
      .lean(); // ✅ return plain JS object, easier to reshape

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Reshape response
    const response = {
      _id: order._id,
      totalAmount: order.totalAmount,
      razorpay_order_id: order.razorpay_order_id,
      paidAt: order.paidAt,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      products: order.products.map((p) => ({
        name: p.product?.name,
        quantity: p.quantity,
        total_price: p.total_price,
        image: p.front_image,
      })),
      address: order.address,
    };

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllOrders_admin = async (req, res) => {
  try {
    const { limit = 10, count = 0, type = "all" } = req.query;
    console.log(req.query);

    // Allowed statuses
    const allowedStatuses = [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "completed",
    ];

    // Base filter (✅ always exclude "pending")
    let filter = { orderStatus: { $nin: ["pending"] } };

    // Apply specific type filter if given
    if (type !== "all" && allowedStatuses.includes(type.toLowerCase())) {
      filter.orderStatus = type.toLowerCase();
    }
    console.log(filter);
    // Fetch orders with pagination
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product", "name")
      .sort({ createdAt: -1 }) // latest first
      .skip(parseInt(count))
      .limit(parseInt(limit))
      .lean();

    // Reshape into required format
    const formatted = orders.map((order) => ({
      id: order.razorpay_order_id,
      customer: order.user?.name || "Unknown",
      email: order.user?.email || "",
      amount: order.totalAmount,
      status: order.orderStatus,
      date: new Date(order.createdAt).toISOString().split("T")[0],
      items: order.products?.length || 0,
    }));

    // ✅ Counts for dashboard
    const totalOrders = await Order.countDocuments({
      orderStatus: { $nin: ["pending"] },
    });
    const processingOrders = await Order.countDocuments({
      orderStatus: "processing",
    });
    const shippedOrders = await Order.countDocuments({
      orderStatus: "shipped",
    });
    const deliveredOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });
    const cancelledOrders = await Order.countDocuments({
      orderStatus: "cancelled",
    });
    const completed = await Order.countDocuments({ orderStatus: "completed" });
    console.log(orders.length);
    res.json({
      success: true,
      orders: formatted,
      counts: {
        total: totalOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        completed: completed,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.search_orders = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", type = "all" } = req.query;
    console.log(req.query);

    // Allowed statuses
    const allowedStatuses = [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "delivered",
    ];

    // Base filter (✅ always exclude "pending")
    let filter = { orderStatus: { $nin: ["pending"] } };

    // Apply type filter
    if (type !== "all" && allowedStatuses.includes(type.toLowerCase())) {
      filter.orderStatus = type.toLowerCase();
    }

    // ✅ Search by razorpay_order_id OR user email
    let userIds = [];
    if (search && search.trim() !== "") {
      const users = await user_model.find(
        { email: { $regex: search, $options: "i" } },
        "_id"
      );
      userIds = users.map((u) => u._id);

      filter.$or = [
        { razorpay_order_id: { $regex: search, $options: "i" } },
        { user: { $in: userIds } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formatted = orders.map((order) => ({
      id: order.razorpay_order_id,
      customer: order.user?.name || "Unknown",
      email: order.user?.email || "",
      amount: order.totalAmount,
      status: order.orderStatus,
      date: new Date(order.createdAt).toISOString().split("T")[0],
      items: order.products?.length || 0,
    }));

    res.json({
      success: true,
      orders: formatted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_order_admin_single = async (req, res) => {
  try {
    const { id } = req.query;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    // 1️⃣ Find order by ID and populate product & user
    const order = await Order.findOne({ razorpay_order_id: id })
      .populate("products.product", "name discount_price front_image")
      .populate("user", "name email phone");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 2️⃣ User details from user model
    const user = await user_model
      .findById(order.user._id)
      .select("name email phone");

    // 3️⃣ Payment details from Razorpay API
    let razorpayPaymentDetails = null;
    if (order.razorpay_payment_id) {
      try {
        razorpayPaymentDetails = await razorpay.payments.fetch(
          order.razorpay_payment_id
        );
      } catch (err) {
        console.error("Error fetching Razorpay payment details:", err.message);
      }
    }

    // 4️⃣ Structure response
    const response = {
      orderId: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      order_from: order.order_from,

      products: order.products.map((p) => ({
        product: p.product,
        quantity: p.quantity,
        total_price: p.total_price,
        variant: p.variant,
      })),

      address: order.address,

      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },

      razorpay: {
        orderId: order.razorpay_order_id,
        paymentId: order.razorpay_payment_id,
        signature: order.razorpay_signature,
        paymentDetails: razorpayPaymentDetails,
      },
    };

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    console.error("get_order_admin_single Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.order_action = async (req, res) => {
  try {
    const { action, id } = req.body;

    // Find the order
    const order = await Order.findOne({ razorpay_order_id: id }); // or use _id if that's your identifier
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Allowed transitions
    const validTransitions = {
      processing: "shipped",
      shipped: "delivered",
      delivered: "delivered",
      cancelled: "cancelled", // stays cancelled if already cancelled
    };

    const currentStatus = order.orderStatus;
    const nextStatus = validTransitions[currentStatus];

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: `No valid transition from status "${currentStatus}"`,
      });
    }

    if (nextStatus !== action) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Next valid status after "${currentStatus}" is "${nextStatus}"`,
      });
    }

    // Update order
    order.orderStatus = nextStatus;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_customers = async (req, res) => {
  try {
    const { limit = 10, skip = 0 } = req.query;

    // ✅ Total user count
    const userCount = await user_model.countDocuments();

    // ✅ Total revenue (only delivered orders)
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // ✅ Customers with spent amount
    const customers = await user_model.aggregate([
      {
        $lookup: {
          from: "orders", // collection name in MongoDB
          localField: "_id",
          foreignField: "user",
          as: "orders",
        },
      },
      {
        $addFields: {
          completedOrders: {
            $filter: {
              input: "$orders",
              as: "order",
              cond: { $eq: ["$$order.orderStatus", "delivered"] },
            },
          },
        },
      },
      {
        $addFields: {
          totalSpent: { $sum: "$completedOrders.totalAmount" },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          totalSpent: 1,
          flag: 1,
          orders: { $size: "$completedOrders" },
        },
      },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ]);

    res.json({
      success: true,
      counts: userCount,
      totalRevenue,
      customers,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.get_customer_profile = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    // ✅ Get user details
    const user = await user_model.findById(id).select("-password"); // exclude password if stored

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // ✅ Get orders of this user + populate product details
    const orders = await Order.find({ user: id })
      .populate("products.product", "name price image") // adjust fields of Product model
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      orders,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.send_customer_email = async (req, res) => {
  try {
    const { subject, message, id } = req.body;

    if (!id || !subject || !message) {
      return res
        .status(400)
        .json({
          success: false,
          error: "id, subject, and message are required",
        });
    }

    // ✅ Find user by ID
    const user = await user_model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const email = user.email;

    // ✅ Prepare HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2 style="color:#333;">${subject}</h2>
        <p style="white-space:pre-line; color:#555;">
          ${message}
        </p>
        <br/>
        <p style="font-size:12px; color:#999;">This email was sent by Real Accessories</p>
      </div>
    `;

    // ✅ Send email
    sendEmail(email, subject, htmlContent);

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      to: email,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
