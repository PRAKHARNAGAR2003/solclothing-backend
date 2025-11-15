const Order = require("../models/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Product = require("../models/Product");

/* =========================================================
   ⭐ FINAL STOCK REDUCTION — FIXED & FULLY WORKING
========================================================= */
async function reduceStock(item) {
  try {
    const productId =
      item.product || item._id || item.productId || item?.product?._id;

    if (!productId) return;

    const product = await Product.findById(productId);
    if (!product) return;

    /* ===================================================
        NORMAL PRODUCT
    =================================================== */
    if (!product.isCouplePack) {
      const variant = product.variants?.find(
        (v) => v.colorName === item.selectedColor
      );

      if (variant && variant.sizesStock) {
        const size = item.selectedSize;
        const currentStock = Number(variant.sizesStock[size] || 0);
        const updatedStock = Math.max(0, currentStock - (item.qty || 1));

        variant.sizesStock[size] = updatedStock;
      }

      // ⭐ IMPORTANT — ensure nested objects save
      product.markModified("variants");
      await product.save();
      return;
    }

    /* ===================================================
        COUPLE PACK — PARTNER A
    =================================================== */
    const variantA = product.coupleA?.find(
      (v) => v.colorName === item.selectedColorA
    );

    if (variantA && variantA.sizesStock) {
      const sizeA = item.selectedSizeA;
      const currentA = Number(variantA.sizesStock[sizeA] || 0);
      const updatedA = Math.max(0, currentA - (item.qty || 1));

      variantA.sizesStock[sizeA] = updatedA;
    }

    /* ===================================================
        COUPLE PACK — PARTNER B
    =================================================== */
    const variantB = product.coupleB?.find(
      (v) => v.colorName === item.selectedColorB
    );

    if (variantB && variantB.sizesStock) {
      const sizeB = item.selectedSizeB;
      const currentB = Number(variantB.sizesStock[sizeB] || 0);
      const updatedB = Math.max(0, currentB - (item.qty || 1));

      variantB.sizesStock[sizeB] = updatedB;
    }

    // ⭐ ENSURE saving nested arrays for couple packs
    product.markModified("coupleA");
    product.markModified("coupleB");

    await product.save();
  } catch (err) {
    console.error("Stock update error:", err);
  }
}

/* =========================================================
   RAZORPAY INIT
========================================================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =========================================================
   0️⃣ GET ORDER BY ID
========================================================= */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("getOrderById error:", error);
    res.status(500).json({ success: false, message: "Invalid order ID" });
  }
};

/* =========================================================
   1️⃣ CREATE COD ORDER
========================================================= */
exports.createCODOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, itemsPrice, shippingPrice, totalPrice } =
      req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No order items",
      });
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems,

      shippingAddress: {
        name: shippingAddress?.name || "",
        phone: shippingAddress?.phone || "",
        address: shippingAddress?.address || "",
        postalCode: shippingAddress?.postalCode || "",
        country: shippingAddress?.country || "India",
      },

      paymentMethod: "COD",
      itemsPrice,
      shippingPrice,
      totalPrice,

      isPaid: false,
      isDelivered: false,
    });

    // ⭐ Reduce Stock
    for (const item of orderItems) {
      await reduceStock(item);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("createCODOrder error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   2️⃣ CREATE RAZORPAY ORDER
========================================================= */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount required",
      });
    }

    const options = {
      amount: Number(amount),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({ success: true, order });
  } catch (error) {
    console.error("createRazorpayOrder error:", error);
    res.status(500).json({
      success: false,
      message: "Razorpay order creation failed",
    });
  }
};

/* =========================================================
   3️⃣ VERIFY RAZORPAY PAYMENT + CREATE ORDER
========================================================= */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderPayload,
    } = req.body;

    const sign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (sign !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const {
      orderItems,
      shippingAddress,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = orderPayload;

    const order = await Order.create({
      user: req.user._id,
      orderItems,

      shippingAddress,
      paymentMethod: "Razorpay",
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,

      isPaid: true,
      paidAt: new Date(),
      isDelivered: false,

      paymentResult: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: "COMPLETED",
      },
    });

    // ⭐ Reduce Stock
    for (const item of orderItems) {
      await reduceStock(item);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("verifyRazorpayPayment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

/* =========================================================
   4️⃣ USER: Get My Orders
========================================================= */
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("getMyOrders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   5️⃣ ADMIN: Get All Orders Split
========================================================= */
exports.getAllOrdersSplit = async (req, res) => {
  try {
    const razorpayOrders = await Order.find({
      paymentMethod: "Razorpay",
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const codOrders = await Order.find({
      paymentMethod: "COD",
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      razorpayOrders,
      codOrders,
      allOrders: [...razorpayOrders, ...codOrders],
    });
  } catch (error) {
    console.error("getAllOrdersSplit error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   6️⃣ ADMIN: Mark Order Delivered
========================================================= */
exports.markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.isDelivered = true;
    order.deliveredAt = new Date();

    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    console.error("markDelivered error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   7️⃣ ADMIN: Mark COD Order Paid
========================================================= */
exports.markPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Only COD orders can be marked paid manually",
      });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: "Order marked as PAID",
      order,
    });
  } catch (error) {
    console.error("markPaid error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking paid",
    });
  }
};
