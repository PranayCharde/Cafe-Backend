const express = require("express");
const Review = require("../models/Review");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/reviews - Approved customer reviews
 */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/**
 * POST /api/reviews - Submit a new review
 */
router.post("/", async (req, res) => {
  try {
    const { name, rating, message, city } = req.body;

    if (!name || !rating || !message) {
      return res.status(400).json({ message: "Name, rating and message are required." });
    }

    const review = await Review.create({
      name: name.trim(),
      rating: parseInt(rating, 10),
      message: message.trim(),
      city: city ? city.trim() : "",
      approved: true,
    });

    res.status(201).json({
      message: "Thank you! Your review has been submitted.",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit review" });
  }
});

/**
 * DELETE /api/reviews/:id - ADMIN ONLY
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: `Review deleted` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete review" });
  }
});

module.exports = router;
