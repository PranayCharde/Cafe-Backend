const express = require("express");
const Reservation = require("../models/Reservation");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Create a new table reservation
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, guests, date, time, specialRequests } = req.body;

    if (!name || !phone || !guests || !date || !time) {
      return res.status(400).json({
        message: "Name, phone, guest count, date and time are required.",
      });
    }

    const created = await Reservation.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      guests: parseInt(guests, 10),
      date,
      time,
      specialRequests: specialRequests ? specialRequests.trim() : "",
      status: "pending",
    });

    res.status(201).json({
      message: "Table reservation requested successfully!",
      data: created,
    });
  } catch (error) {
    console.error("Reservation create error:", error);
    res.status(500).json({ message: "Failed to create table reservation." });
  }
});

/**
 * Get all reservations (Admin)
 */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ date: -1, time: 1 });
    res.json({ data: reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    res.status(500).json({ message: "Failed to fetch reservations." });
  }
});

/**
 * Update reservation status (Admin)
 */
router.put("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid reservation status" });
    }

    const updated = await Reservation.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({
      message: `Reservation status changed to ${status}`,
      data: updated,
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    res.status(500).json({ message: "Failed to update reservation." });
  }
});

module.exports = router;
