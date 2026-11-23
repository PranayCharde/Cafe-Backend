const express = require("express");
const Contact = require("../models/Contact");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/contact - Customer sends message
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required." });
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      message: message.trim(),
      status: "unread",
    });

    res.status(201).json({
      message: "Message received. We'll be in touch soon!",
      contact,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

/**
 * GET /api/contact - ADMIN ONLY
 */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact inquiries" });
  }
});

module.exports = router;
