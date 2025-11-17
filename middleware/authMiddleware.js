const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    // ⭐ 0) Allow CORS preflight request to pass
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    let token = null;

    // ⭐ 1) Read token from cookies
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // ⭐ 2) Read token from Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ⭐ 3) Read token from custom header
    if (!token && req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    // ⭐ 4) Still no token → unauthorized
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // ⭐ 5) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    // ⭐ 6) Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ⭐ Attach user to req
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
