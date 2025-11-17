const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    // ⭐ Allow CORS preflight
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    let token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("Admin Auth Error:", err);
    return res.status(401).json({ message: "Invalid admin token" });
  }
};
