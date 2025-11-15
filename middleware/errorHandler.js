// backend/middleware/errorMiddleware.js

// 🔹 Catch all thrown errors
const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err.stack || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// 🔹 Handle unknown routes
const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
};

module.exports = { errorHandler, notFound };
