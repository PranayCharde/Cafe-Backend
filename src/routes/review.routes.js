const express = require("express");
const Review = require("../models/Review");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Get approved customer reviews
 */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({ createdAt: -1 });
    res.json({ data: reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

/**
 * Submit a review
 */
router.post("/", async (req, res) => {
  try {
    const { name, rating, message, city } = req.body;

    if (!name || !rating || !message) {
      return res.status(400).json({ message: "Name, rating and message are required." });
    }

    const created = await Review.create({
      name: name.trim(),
      rating: parseInt(rating, 10),
      message: message.trim(),
      city: city ? city.trim() : "",
      approved: true, // auto-approve for demo
    });

    res.status(201).json({
      message: "Review submitted successfully! Thank you for your feedback.",
      data: created,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: "Failed to submit review." });
  }
});

/**
 * Delete a review (Admin)
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Failed to delete review." });
  }
});

module.exports = router;
