// backend/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const passwordResetTemplate = require("../utils/emailTemplate"); // ⭐ ADDED

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// ------------------------------------------------------
// USER TOKEN COOKIE
// ------------------------------------------------------
const setTokenCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.cookie("token", token, cookieOptions);
  return token;
};

// ------------------------------------------------------
// ⭐ ADMIN TOKEN COOKIE (NEW)
// ------------------------------------------------------
const setAdminTokenCookie = (user, res) => {
  const token = jwt.sign(
    { id: user._id, role: "admin" },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    path: "/",
    domain: "xn--slclothing-gbb.com", // IMPORTANT FOR LIVE SITE
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

// ------------------------------------------------------
// USER REGISTRATION
// ------------------------------------------------------
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: "User already exists" });

    const user = await User.create({ name, email, password });
    setTokenCookie(user, res);

    res.status(201).json({ success: true, message: "Registered", user: user.toJSON() });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------------------------------
// NORMAL USER LOGIN
// ------------------------------------------------------
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    setTokenCookie(user, res);
    res.status(200).json({ success: true, message: "Logged in", user: user.toJSON() });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------------------------------
// ⭐ ADMIN LOGIN (UPDATED)
// ------------------------------------------------------
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    if (user.role !== "admin")
      return res.status(403).json({ success: false, message: "Access denied: Not an admin" });

    // ⭐ Set separate admin token
    setAdminTokenCookie(user, res);

    res.status(200).json({
      success: true,
      message: "Admin logged in",
      user: user.toJSON(),
    });
  } catch (err) {
    console.error("Admin Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------
exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", { httpOnly: true, path: "/" });
    res.clearCookie("adminToken", { httpOnly: true, path: "/" });
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------------------------------
// GET LOGGED-IN USER INFO
// ------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------------------------------
// UPDATED FORGOT PASSWORD (HTML + RESEND)
// ------------------------------------------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // ⭐ Beautiful HTML email
    const htmlMessage = passwordResetTemplate(user.name, resetUrl);

    await sendEmail({
      email: user.email,
      subject: "Reset Your SolClothing Password",
      message: htmlMessage,
    });

    res.status(200).json({ success: true, message: "Reset email sent" });

  } catch (err) {
    console.error("Forgot password error:", err);

    if (req.body?.email) {
      const u = await User.findOne({ email: req.body.email });
      if (u) {
        u.resetPasswordToken = undefined;
        u.resetPasswordExpire = undefined;
        await u.save({ validateBeforeSave: false });
      }
    }

    res.status(500).json({ success: false, message: "Email could not be sent" });
  }
};

// ------------------------------------------------------
// RESET PASSWORD
// ------------------------------------------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ success: false, message: "Password too short" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired token" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
