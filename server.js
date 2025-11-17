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


// --------------------------- CORS CONFIG (VERY IMPORTANT) ---------------------------
const allowedOrigins = [
  "https://sólclothing.com",
  "https://xn--slclothing-gbb.com",
  "https://www.sólclothing.com",
  "https://www.xn--slclothing-gbb.com",

  "https://solclothing-new.vercel.app", // preview
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      console.log("❌ CORS BLOCKED:", origin);
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Handle OPTIONS preflight for all routes
app.options("*", cors());


// ⭐ VERY IMPORTANT FOR ADMIN LOGIN + PREVIEW ON VERCEL
app.options("*", cors());


/* --------------------------- STATIC FILES --------------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/hoodieImg", express.static(path.join(__dirname, "hoodieImg")));

/* --------------------------- KEEP-ALIVE ROUTE --------------------------- */
app.get("/ping", (req, res) => res.status(200).send("pong"));

/* --------------------------- API ROUTES --------------------------- */
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

/* --------------------------- START SERVER (LOCAL ONLY) --------------------------- */
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () =>
    console.log(`🚀 Server running at: http://localhost:${PORT}`)
  );
}

/* --------------------------- EXPORT APP FOR VERCEL --------------------------- */
module.exports = app;
