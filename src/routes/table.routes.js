const express = require("express");
const Table = require("../models/Table");
const Order = require("../models/Order");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Get all tables with real-time status and active table orders
 */
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    const activeOrders = await Order.find({
      orderType: "dine-in",
      status: { $in: ["pending", "preparing", "ready"] },
    });

    const enriched = tables.map((tbl) => {
      const tblObj = tbl.toJSON();
      const currentOrders = activeOrders.filter(
        (o) => Number(o.tableNumber) === Number(tbl.tableNumber)
      );
      return {
        ...tblObj,
        currentOrders,
        activeOrdersCount: currentOrders.length,
      };
    });

    res.json({ data: enriched });
  } catch (error) {
    console.error("Get tables error:", error);
    res.status(500).json({ message: "Failed to fetch tables list." });
  }
});

/**
 * Register a new dining table (Admin)
 */
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;
    const num = parseInt(tableNumber, 10);

    if (!num || num < 1) {
      return res.status(400).json({ message: "Valid table number required." });
    }

    const existing = await Table.findOne({ tableNumber: num });
    if (existing) {
      return res.status(400).json({ message: `Table #${num} already registered.` });
    }

    const newTable = await Table.create({
      tableNumber: num,
      capacity: parseInt(capacity, 10) || 4,
      status: "available",
    });

    res.status(201).json({
      message: `Table #${num} registered successfully with QR code!`,
      data: newTable,
    });
  } catch (error) {
    console.error("Create table error:", error);
    res.status(500).json({ message: "Failed to create table." });
  }
});

/**
 * Get details for a specific table by number
 */
router.get("/:tableNumber", async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    const table = await Table.findOne({ tableNumber });

    if (!table) {
      return res.status(404).json({ message: `Table #${tableNumber} not found.` });
    }

    const currentOrders = await Order.find({
      tableNumber,
      orderType: "dine-in",
      status: { $in: ["pending", "preparing", "ready"] },
    }).sort({ createdAt: -1 });

    res.json({
      data: {
        ...table.toJSON(),
        currentOrders,
      },
    });
  } catch (error) {
    console.error("Get table error:", error);
    res.status(500).json({ message: "Failed to fetch table details." });
  }
});

/**
 * Update table status (Admin)
 */
router.put("/:tableNumber/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    const { status } = req.body;

    if (!["available", "occupied", "reserved"].includes(status)) {
      return res.status(400).json({ message: "Invalid table status." });
    }

    const updated = await Table.findOneAndUpdate(
      { tableNumber },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: `Table #${tableNumber} not found.` });
    }

    res.json({
      message: `Table #${tableNumber} is now marked ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error("Update table status error:", error);
    res.status(500).json({ message: "Failed to update table status." });
  }
});

/**
 * Delete a table (Admin)
 */
router.delete("/:tableNumber", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber, 10);
    const deleted = await Table.findOneAndDelete({ tableNumber });

    if (!deleted) {
      return res.status(404).json({ message: `Table #${tableNumber} not found.` });
    }

    res.json({ message: `Table #${tableNumber} removed from floor plan.` });
  } catch (error) {
    console.error("Delete table error:", error);
    res.status(500).json({ message: "Failed to delete table." });
  }
});

module.exports = router;
