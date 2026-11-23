const express = require("express");
const QRCode = require("qrcode");
const Table = require("../models/Table");
const Order = require("../models/Order");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/tables - Get all tables with real-time occupancy and active order metrics
 */
router.get("/", async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });

    // Populate active orders for each table
    const populated = await Promise.all(
      tables.map(async (table) => {
        const activeOrders = await Order.find({
          tableNumber: table.tableNumber,
          status: { $in: ["pending", "preparing", "ready"] },
        }).sort({ createdAt: -1 });

        const latestOrder = activeOrders[0] || null;

        return {
          id: table._id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          status: table.status,
          activeOrdersCount: activeOrders.length,
          latestOrderId: latestOrder ? latestOrder.orderId : null,
          seatedCustomerName: latestOrder ? latestOrder.customerName : null,
          createdAt: table.createdAt,
        };
      })
    );

    res.json({ tables: populated });
  } catch (error) {
    console.error("Fetch tables error:", error);
    res.status(500).json({ message: "Failed to fetch tables" });
  }
});

/**
 * POST /api/tables/generate-qr - ADMIN ONLY: Generate QR Code
 */
router.post("/generate-qr", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, baseUrl } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required" });
    }

    const host = baseUrl || "http://localhost:5000";
    const targetUrl = `${host}/table/${tableNumber}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 450,
      margin: 2,
      color: {
        dark: "#2b1a12",
        light: "#ffffff",
      },
    });

    res.json({
      success: true,
      tableNumber,
      targetUrl,
      qrDataUrl,
      generatedBy: req.user.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("QR Generation error:", error);
    res.status(500).json({ message: "Failed to generate table QR code" });
  }
});

/**
 * POST /api/tables - ADMIN ONLY: Create a New Table
 */
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required" });
    }

    const num = parseInt(tableNumber, 10);
    const cap = parseInt(capacity, 10) || 4;

    const existing = await Table.findOne({ tableNumber: num });
    if (existing) {
      return res.status(400).json({ message: `Table #${num} already exists in the system` });
    }

    const table = await Table.create({
      tableNumber: num,
      capacity: cap,
      status: "available",
    });

    res.status(201).json({ message: "Table generated successfully", table });
  } catch (error) {
    console.error("Create table error:", error);
    res.status(500).json({ message: "Failed to create table" });
  }
});

/**
 * PATCH /api/tables/:tableNumber - ADMIN ONLY: Update Table
 */
router.patch("/:tableNumber", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    const { status, capacity } = req.body;

    const updated = await Table.findOneAndUpdate(
      { tableNumber: parseInt(tableNumber, 10) },
      { $set: { ...(status && { status }), ...(capacity && { capacity: parseInt(capacity, 10) }) } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ message: "Table updated", table: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update table" });
  }
});

/**
 * DELETE /api/tables/:tableNumber - ADMIN ONLY: Delete Table
 */
router.delete("/:tableNumber", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tableNumber } = req.params;
    await Table.findOneAndDelete({ tableNumber: parseInt(tableNumber, 10) });
    res.json({ message: `Table #${tableNumber} removed successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete table" });
  }
});

module.exports = router;
