const express = require("express");
const Review = require("../models/Review");
const router = express.Router();

// Add Review
router.post("/", async (req, res) => {
  try {
    const { name, rating, message } = req.body;

    const review = await Review.create({ name, rating, message });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
