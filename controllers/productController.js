const Product = require("../models/Product");
const path = require("path");

// 🧾 Create new product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    console.log("📦 Incoming product data:", req.body);

    const {
      name,
      description,
      price,
      category,
      gender,
      sizes,
      variants,
      isCouplePack,
      coupleA,
      coupleB,
      images
    } = req.body;

    // 🛑 Required fields check
    if (!name || !price || !category || !gender) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, price, category, gender)",
      });
    }

    /* ----------------------------------------
     * PARSE NESTED JSON FIELDS
     * ---------------------------------------- */
    const parseField = (field, fallback) => {
      try {
        return typeof field === "string" ? JSON.parse(field) : field || fallback;
      } catch (err) {
        console.warn("⚠️ Failed to parse:", field);
        return fallback;
      }
    };

    const parsedVariants = parseField(variants, []);
    const parsedCoupleA = parseField(coupleA, []);
    const parsedCoupleB = parseField(coupleB, []);
    const parsedImages = parseField(images, []);

    /* ----------------------------------------
     * ADD COUPLE PACK IMAGES INTO MAIN ARRAY
     * ---------------------------------------- */
    if (isCouplePack === true || isCouplePack === "true") {
      parsedCoupleA.forEach((v) => {
        if (v.frontImage) parsedImages.push(v.frontImage);
        if (v.backImage) parsedImages.push(v.backImage);
      });

      parsedCoupleB.forEach((v) => {
        if (v.frontImage) parsedImages.push(v.frontImage);
        if (v.backImage) parsedImages.push(v.backImage);
      });
    }

    /* ----------------------------------------
     * CREATE PRODUCT DOCUMENT
     * ---------------------------------------- */
    const product = new Product({
      name,
      description,
      price,
      category,
      gender,
      sizes,

      // ⭐ NORMAL VARIANTS (WITH SIZE STOCK)
      variants: parsedVariants.map((v) => ({
        colorName: v.colorName,
        colorHex: v.colorHex,
        frontImage: v.frontImage,
        backImage: v.backImage,
        sizesStock: v.sizesStock || {}
      })),

      isCouplePack: isCouplePack === true || isCouplePack === "true",

      // ⭐ COUPLE A
      coupleA: parsedCoupleA.map((v) => ({
        colorName: v.colorName,
        colorHex: v.colorHex,
        frontImage: v.frontImage,
        backImage: v.backImage,
        sizesStock: v.sizesStock || {}
      })),

      // ⭐ COUPLE B
      coupleB: parsedCoupleB.map((v) => ({
        colorName: v.colorName,
        colorHex: v.colorHex,
        frontImage: v.frontImage,
        backImage: v.backImage,
        sizesStock: v.sizesStock || {}
      })),

      // ⭐ Save all images
      images: parsedImages
    });

    await product.save();
    console.log("✅ Product saved:", product.name);

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("🔥 createProduct error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while saving product",
      error: err.message,
    });
  }
};

// 🛍️ Get all products
exports.getProducts = async (req, res) => {
  try {
    // ⭐ FIXED: .lean() ensures updated nested stock is returned
    const products = await Product.find({}).lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🧠 Get single product
exports.getProductById = async (req, res) => {
  try {
    // ⭐ FIXED: .lean() ensures updated nested sizesStock is returned
    const product = await Product.findById(req.params.id).lean();

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✏️ Update product (Admin)
exports.updateProduct = async (req, res) => {
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
    console.error("updateProduct error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🗑️ Delete product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 📸 Upload product images
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const filePath = `/hoodieimg/${req.file.filename}`;
    res.json({ success: true, filePath });
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
};