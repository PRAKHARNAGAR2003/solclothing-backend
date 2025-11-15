// backend/server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

/* --------------------------- CONNECT DB --------------------------- */
connectDB()
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ DB connect error:", err);
    process.exit(1);
  });

/* --------------------------- MIDDLEWARE --------------------------- */
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Helmet with relaxed CSP for dev
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Rate Limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* --------------------------- CORS CONFIG --------------------------- */
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const allowedOrigins = [
  FRONTEND,
  "http://localhost:5173",
  "https://solclothing.netlify.app",
  "https://solclothing-new.vercel.app",
  "https://sólclothing.com",              // your human domain
  "https://xn--slclothing-w2a.com"        // correct punycode domain
];

app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options("*", cors());

/* --------------------------- STATIC FILES --------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/hoodieimg", express.static(path.join(__dirname, "hoodieimg")));  // ← REQUIRED FIX

/* --------------------------- KEEP-ALIVE ROUTE --------------------------- */
// ⭐ Added exactly as you requested — lightweight, safe, and does not change anything else
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

/* --------------------------- ROUTES --------------------------- */

// Auth Routes
app.use("/api/auth", require("./routes/auth"));

// Product Routes
app.use("/api/products", require("./routes/product"));

// Order Routes
app.use("/api/orders", require("./routes/orderRoutes"));

// Payment Routes
app.use("/api/payment", require("./routes/payment"));

/* --------------------------- HEALTH CHECK --------------------------- */
app.get("/", (req, res) => res.send("✅ Backend running successfully"));

/* --------------------------- GLOBAL ERROR HANDLER --------------------------- */
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Server error",
  });
});

/* --------------------------- START SERVER --------------------------- */
app.listen(PORT, () =>
  console.log(`🚀 Server running at: http://localhost:${PORT}`)
);
