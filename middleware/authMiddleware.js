const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ------------------------------------------------------
   UNIFIED AUTH — READS BOTH USER TOKEN & ADMIN TOKEN
------------------------------------------------------ */
exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // 🔥 1) Check adminToken first
    if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;

      try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        const admin = await User.findById(decoded.id).select("-password");

        if (!admin) {
          return res.status(404).json({ success: false, message: "Admin not found" });
        }

        if (admin.role !== "admin") {
          return res.status(403).json({ success: false, message: "Access denied" });
        }

        req.user = admin;  // attach admin
        return next();
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid admin token" });
      }
    }

    // 🔥 2) Normal user token
    if (req.cookies?.token) {
      token = req.cookies.token;
    } else if (
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

    // Verify normal token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // attach user
    next();

  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/* ------------------------------------------------------
   ADMIN PROTECTION
------------------------------------------------------ */
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Admin access denied",
  });
};
