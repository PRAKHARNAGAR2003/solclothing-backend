// backend/routes/payment.js
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const router = express.Router();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

let razorpay;

// Initialize Razorpay safely
try {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay client initialized");
} catch (err) {
  console.warn("⚠️ Razorpay Initialization Failed:", err.message || err);
  razorpay = null;
}

// Helper
const ensureRazorpay = (res) => {
  if (!razorpay) {
    res.status(503).json({
      success: false,
      message:
        "Razorpay not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
    });
    return false;
  }
  return true;
};

/* =========================================================
   1️⃣ TEST ROUTE
========================================================= */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Payment route is working",
    razorpayConfigured: !!razorpay,
  });
});

/* =========================================================
   2️⃣ CREATE ONLY RAZORPAY ORDER (Testing)
========================================================= */
router.post("/create-order", async (req, res) => {
  if (!ensureRazorpay(res)) return;

  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({
        success: false,
        message: "Amount must be provided in paisa (number)",
      });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      key: RAZORPAY_KEY_ID,
      order,
    });
  } catch (err) {
    console.error("❌ Razorpay create-order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: err.message || err,
    });
  }
});

/* =========================================================
   3️⃣ PAYMENT VERIFICATION ONLY (Testing)
========================================================= */
router.post("/verify", (req, res) => {
  if (!ensureRazorpay(res)) return;

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for verification",
      });
    }

    // Expected signature
    const generated_signature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const isValid = generated_signature === razorpay_signature;

    res.json({
      success: isValid,
      valid: isValid,
      generated_signature,
    });
  } catch (err) {
    console.error("❌ Razorpay verify error:", err);
    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: err.message || err,
    });
  }
});

module.exports = router;
