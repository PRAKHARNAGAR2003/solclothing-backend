// server.js
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

/* -------------------- CONNECT DB -------------------- */
connectDB();

/* -------------------- BASIC MIDDLEWARE -------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

/* -------------------- WORKING CORS FIX -------------------- */
const allowedOrigins = [
  "https://xn--slclothing-gbb.com",
  "https://www.xn--slclothing-gbb.com",
  "https://solclothing-new.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.header("Access-Control-Expose-Headers", "Set-Cookie");

  // ⭐ Make preflight requests ALWAYS return early
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* -------------------- HELMET (after CORS) -------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false
  })
);

/* -------------------- RATE LIMIT -------------------- */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

/* -------------------- STATIC FILES -------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/hoodieImg", express.static(path.join(__dirname, "hoodieImg")));

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/product"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

/* -------------------- HEALTH -------------------- */
app.get("/", (req, res) => res.send("Backend OK + Vercel Express Running"));

/* -------------------- LOCAL SERVER -------------------- */
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log("Server running on port", PORT));
}

/* -------------------- EXPORT FOR VERCEL -------------------- */
module.exports = app;
