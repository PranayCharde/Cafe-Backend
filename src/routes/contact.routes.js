const express = require("express");
const Contact = require("../models/Contact");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Submit contact form
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const created = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : "",
      message: message.trim(),
      status: "unread",
    });

    res.status(201).json({
      message: "Message received. We will get back to you shortly!",
      data: created,
    });
  } catch (error) {
    console.error("Contact submit error:", error);
    res.status(500).json({ message: "Failed to submit contact inquiry." });
  }
});

/**
 * Get all contact inquiries (admin)
 */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json({ data: messages });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({ message: "Failed to fetch contact inquiries." });
  }
});

/**
 * Update contact inquiry status
 */
router.put("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Inquiry not found" });
    }
    res.json({ message: "Status updated", data: updated });
  } catch (error) {
    console.error("Update contact status error:", error);
    res.status(500).json({ message: "Failed to update inquiry status." });
  }
});

module.exports = router;
