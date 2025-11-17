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

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* --------------------------- CORS CONFIG (UPDATED) --------------------------- */
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const allowedOrigins = [
  FRONTEND,
  "http://localhost:5173",
  "https://solclothing-new.vercel.app",
  "https://xn--slclothing-gbb.com"   // your correct domain
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options("*", cors());

/* --------------------------- STATIC FILES --------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/hoodieImg", express.static(path.join(__dirname, "hoodieImg")));

/* --------------------------- KEEP-ALIVE ROUTE --------------------------- */
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

/* --------------------------- ROUTES --------------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

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

/* --------------------------- START SERVER (ONLY FOR LOCAL) --------------------------- */
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () =>
    console.log(`🚀 Server running at: http://localhost:${PORT}`)
  );
}

/* --------------------------- EXPORT APP FOR VERCEL --------------------------- */
module.exports = app;
