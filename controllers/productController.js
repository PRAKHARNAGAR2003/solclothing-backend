const Product = require("../models/Product");
const path = require("path");

/* ----------------------------------------------------------
   ⭐ FIX CASE-SENSITIVITY FOR IMAGES
   Convert all /hoodieImg → /hoodieimg before saving
---------------------------------------------------------- */
const fixImagePath = (str) => {
  if (!str) return str;
  return str.replace("/hoodieImg", "/hoodieimg");
};

/* ----------------------------------------------------------
   CREATE PRODUCT
---------------------------------------------------------- */
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
      images,
    } = req.body;

    if (!name || !price || !category || !gender) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, price, category, gender)",
      });
    }

    const parseField = (field, fallback) => {
      try {
        return typeof field === "string"
          ? JSON.parse(field)
          : field || fallback;
      } catch {
        return fallback;
      }
    };

    let parsedVariants = parseField(variants, []);
    let parsedCoupleA = parseField(coupleA, []);
    let parsedCoupleB = parseField(coupleB, []);
    let parsedImages = parseField(images, []);

    /* ----------------------------------------------------------
       ⭐ FIX PATHS INSIDE VARIANTS
    ---------------------------------------------------------- */
    parsedVariants = parsedVariants.map((v) => ({
      ...v,
      frontImage: fixImagePath(v.frontImage),
      backImage: fixImagePath(v.backImage),
    }));

    parsedCoupleA = parsedCoupleA.map((v) => ({
      ...v,
      frontImage: fixImagePath(v.frontImage),
      backImage: fixImagePath(v.backImage),
    }));

    parsedCoupleB = parsedCoupleB.map((v) => ({
      ...v,
      frontImage: fixImagePath(v.frontImage),
      backImage: fixImagePath(v.backImage),
    }));

    /* ----------------------------------------------------------
       ⭐ FIX MAIN IMAGES[] TOO
    ---------------------------------------------------------- */
    parsedImages = parsedImages.map((img) => fixImagePath(img));

    /* ----------------------------------------------------------
       ⭐ IF images[] IS EMPTY — AUTO ADD VARIANT IMAGES
    ---------------------------------------------------------- */
    if (parsedImages.length === 0) {
      parsedVariants.forEach((v) => {
        if (v.frontImage) parsedImages.push(v.frontImage);
        if (v.backImage) parsedImages.push(v.backImage);
      });
    }

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

    /* ----------------------------------------------------------
       ⭐ CREATE DOCUMENT
    ---------------------------------------------------------- */
    const product = new Product({
      name,
      description,
      price,
      category,
      gender,
      sizes,
      variants: parsedVariants,
      isCouplePack: isCouplePack === true || isCouplePack === "true",
      coupleA: parsedCoupleA,
      coupleB: parsedCoupleB,
      images: parsedImages,
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

/* ----------------------------------------------------------
   GET ALL PRODUCTS
---------------------------------------------------------- */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ----------------------------------------------------------
   GET SINGLE PRODUCT
---------------------------------------------------------- */
exports.getProductById = async (req, res) => {
  try {
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

/* ----------------------------------------------------------
   UPDATE PRODUCT
---------------------------------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const update = { ...req.body };

    // Fix paths on update also
    if (update.images)
      update.images = update.images.map((i) => fixImagePath(i));

    if (update.variants)
      update.variants = update.variants.map((v) => ({
        ...v,
        frontImage: fixImagePath(v.frontImage),
        backImage: fixImagePath(v.backImage),
      }));

    const updated = await Product.findByIdAndUpdate(req.params.id, update, {
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

/* ----------------------------------------------------------
   DELETE PRODUCT
---------------------------------------------------------- */
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

/* ----------------------------------------------------------
   IMAGE UPLOAD
---------------------------------------------------------- */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const filePath = `/hoodieimg/${req.file.filename}`; // FIXED (lowercase)
    res.json({ success: true, filePath });
  } catch (err) {
    console.error("uploadImage error:", err);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
};
