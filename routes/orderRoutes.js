const express = require("express");
const router = express.Router();

const {
  createCODOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
  getAllOrdersSplit,
  markDelivered,
  markPaid,
} = require("../controllers/orderController");

const Order = require("../models/Order");
const Product = require("../models/Product");

// USER middleware (keep)
const { protect } = require("../middleware/authMiddleware");

// NEW ADMIN TOKEN middleware
const protectAdmin = require("../middleware/adminAuth");


// ====================================================
// 1️⃣ COD ORDER
// ====================================================
router.post("/cod", protect, createCODOrder);

// ====================================================
// 2️⃣ RAZORPAY ORDER CREATE
// ====================================================
router.post("/razorpay/create", protect, createRazorpayOrder);

// ====================================================
// 3️⃣ RAZORPAY VERIFY
// ====================================================
router.post("/razorpay/verify", protect, verifyRazorpayPayment);

// ====================================================
// 4️⃣ USER: MY ORDERS
// ====================================================
router.get("/my-orders", protect, getMyOrders);

// ====================================================
// 5️⃣ ADMIN: ALL ORDERS
// ====================================================
router.get("/admin/orders", protectAdmin, getAllOrdersSplit);

// ====================================================
// 6️⃣ ADMIN: MARK DELIVERED
// ====================================================
router.put("/admin/deliver/:id", protectAdmin, markDelivered);

// ====================================================
// NEW ⭐ Admin: Mark Order as PAID (for COD)
// ====================================================
router.put("/admin/pay/:id", protectAdmin, markPaid);


// ====================================================
// 📊 7️⃣ ADMIN DASHBOARD STATS
// ====================================================
router.get("/admin/stats", protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find({});
    const products = await Product.find({});

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.isDelivered).length;
    const pendingDeliveries = orders.filter((o) => !o.isDelivered).length;

    const totalRevenue = orders
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return res.json({
      success: true,
      stats: {
        totalOrders,
        deliveredOrders,
        pendingDeliveries,
        totalRevenue,
        totalProducts: products.length,
      },
    });
  } catch (error) {
    console.log("Admin Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching stats",
    });
  }
});


// ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
// ⭐ MUST BE LAST ROUTE — dynamic /:id
// ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐
router.get("/:id", getOrderById);

module.exports = router;
