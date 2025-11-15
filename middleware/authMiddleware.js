// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ------------------------------------------------------
// USER AUTHENTICATION (PROTECT ROUTES)
// ------------------------------------------------------
exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // 1) From cookies
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 2) From Bearer token
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// ------------------------------------------------------
// ADMIN PROTECTION (FOR ADMIN-PANEL ROUTES)
// ------------------------------------------------------
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Admin access denied",
  });
};
