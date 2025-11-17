const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");

/* --------------------------- MULTER CONFIG --------------------------- */
/* ⭐ FIXED: Correct folder name — hoodieImg (capital I) */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../hoodieImg"));  // FIXED
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({ storage });

/* --------------------------- ADMIN MIDDLEWARE --------------------------- */
const protectAdmin = require("../middleware/adminAuth");

/* ============================================================
   ⭐ IMAGE UPLOAD (ADMIN ONLY)
============================================================ */
router.post("/upload", protectAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Image upload failed",
    });
  }

  /* ⭐ FIXED: hoodieImg path */
  const filePath = `/hoodieImg/${req.file.filename}`; 
  const fullUrl = `${req.protocol}://${req.get("host")}${filePath}`;

  console.log("📸 Uploaded:", filePath);

  res.json({
    success: true,
    filePath,
    url: fullUrl,
  });
});

/* ============================================================
   ⭐ CREATE PRODUCT (ADMIN ONLY)
============================================================ */
router.post("/", protectAdmin, upload.array("images", 10), async (req, res) => {
  try {
    console.log("📦 Incoming product data:", req.body);

    /* ⭐ FIXED hoodieImg path */
    const imagePaths = Array.isArray(req.files)
      ? req.files.map((file) => `/hoodieImg/${file.filename}`)   // FIXED
      : [];

    const parseJSON = (field) => {
      if (!req.body[field]) return [];
      try {
        return typeof req.body[field] === "string"
          ? JSON.parse(req.body[field])
          : req.body[field];
      } catch {
        return [];
      }
    };

    const parsedVariants = parseJSON("variants");
    const parsedSizes = parseJSON("sizes");
    const coupleA = parseJSON("coupleA");
    const coupleB = parseJSON("coupleB");

    /* ⭐ Add couple pack images safely */
    if (req.body.isCouplePack === "true" || req.body.isCouplePack === true) {
      coupleA.forEach((v) => {
        if (v.frontImage) imagePaths.push(v.frontImage);
        if (v.backImage) imagePaths.push(v.backImage);
      });

      coupleB.forEach((v) => {
        if (v.frontImage) imagePaths.push(v.frontImage);
        if (v.backImage) imagePaths.push(v.backImage);
      });
    }

    const productData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      gender: req.body.gender,
      sizes: parsedSizes,
      variants: parsedVariants,
      images: imagePaths,
      isCouplePack:
        req.body.isCouplePack === true || req.body.isCouplePack === "true",
      coupleA,
      coupleB,
    };

    const product = new Product(productData);
    await product.save();

    console.log("✅ Product created:", product.name);
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: err.message,
    });
  }
});

/* ============================================================
   GET ALL PRODUCTS (PUBLIC)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   GET SINGLE PRODUCT (PUBLIC)
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    console.error("❌ Error fetching product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   UPDATE PRODUCT (ADMIN ONLY)
============================================================ */
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, product: updated });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   DELETE PRODUCT (ADMIN ONLY)
============================================================ */
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
