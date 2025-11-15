// backend/routes/auth.js
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  forgotPassword,
  resetPassword,
  adminLogin, // ✅ ADDED
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// User Auth Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me", protect, getMe);

// ⭐ Admin Login Route (NEW)
router.post("/admin-login", adminLogin);

module.exports = router;
