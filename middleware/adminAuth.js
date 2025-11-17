const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  let token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ message: "Admin not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid admin token" });
  }
};
