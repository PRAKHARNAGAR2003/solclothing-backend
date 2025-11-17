const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token = null;

    // ⭐ 1) Read from cookies
    if (req.cookies?.token) token = req.cookies.token;

    // ⭐ 2) Read from Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ⭐ 3) Read from custom header (for safety)
    if (!token && req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    // ⭐ 4) If STILL no token → unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
