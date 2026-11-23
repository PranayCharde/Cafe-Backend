const express = require("express");
const Reservation = require("../models/Reservation");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/reservations - Customer books a table
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, guests, date, time, specialRequests } = req.body;

    if (!name || !phone || !guests || !date || !time) {
      return res.status(400).json({ message: "Name, phone, guests, date, and time are required." });
    }

    const reservation = await Reservation.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null,
      guests: parseInt(guests, 10),
      date,
      time,
      specialRequests: specialRequests || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Reservation received! We look forward to hosting you.",
      reservation,
    });
  } catch (error) {
    console.error("Reservation error:", error);
    res.status(500).json({ message: "Failed to book reservation" });
  }
});

/**
 * GET /api/reservations - ADMIN ONLY
 */
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ date: -1, time: 1 });
    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

/**
 * PATCH /api/reservations/:id/status - ADMIN ONLY
 */
router.patch("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid reservation status" });
    }

    const updated = await Reservation.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json({ message: `Reservation marked as ${status}`, reservation: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update reservation" });
  }
});

module.exports = router;
