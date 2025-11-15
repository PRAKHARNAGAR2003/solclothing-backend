const mongoose = require("mongoose");

// ✅ Variant Schema (for single products)
const variantSchema = new mongoose.Schema({
  colorName: {
    type: String,
    required: true,
    trim: true,
  },
  colorHex: {
    type: String,
    default: "#cccccc",
  },
  frontImage: {
    type: String,
    default: "",
  },
  backImage: {
    type: String,
    default: "",
  },

  sizesStock: {
  type: Object,
  default: {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
  },
},

});

// ✅ Variant Schema for Couple Packs
const coupleVariantSchema = new mongoose.Schema({
  colorName: {
    type: String,
    required: true,
  },
  colorHex: {
    type: String,
    default: "#cccccc",
  },
  frontImage: {
    type: String,
    default: "",
  },
  backImage: {
    type: String,
    default: "",
  },

  sizesStock: {
  type: Object,
  default: {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
  },
},


});

// ✅ Product Schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      default: "Unisex",
    },

    sizes: {
      type: [String],
      default: [],
    },

    // ⭐ NORMAL PRODUCT VARIANTS
    variants: {
      type: [variantSchema],
      default: [],
    },

    // ⭐ ALL IMAGES
    images: {
      type: [String],
      default: [],
    },

    // ⭐ COUPLE PACK TOGGLE
    isCouplePack: {
      type: Boolean,
      default: false,
    },

    // ⭐ COUPLE PACK VARIANTS
    coupleA: {
      type: [coupleVariantSchema],
      default: [],
    },

    coupleB: {
      type: [coupleVariantSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);