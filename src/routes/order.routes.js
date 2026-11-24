const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Table = require("../models/Table");
const { authenticateToken, requireAdmin, optionalToken } = require("../middleware/auth");

module.exports = function createOrderRoutes(io) {
  const router = express.Router();

  /**
   * Place a new order (Dine-in from QR table or Takeaway/Delivery)
   */
  router.post("/", async (req, res) => {
    try {
      const {
        customerName,
        mobileNumber,
        email,
        tableNumber,
        orderType = "dine-in",
        items = [],
        paymentMode = "UPI",
        notes = "",
        deliveryAddress = "",
        specialInstructions = "",
      } = req.body;

      if (!customerName || !mobileNumber) {
        return res.status(400).json({ message: "Customer name and mobile number are required." });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "At least one item is required to place an order." });
      }

      if (orderType === "dine-in" && !tableNumber) {
        return res.status(400).json({ message: "Table number is required for dine-in orders." });
      }

      // Upsert Customer User
      let user = await User.findOne({ phone: mobileNumber.trim() });
      if (!user) {
        user = await User.create({
          name: customerName.trim(),
          phone: mobileNumber.trim(),
          email: email ? email.trim() : null,
          role: "customer",
        });
      } else if (email && !user.email) {
        user.email = email.trim();
        await user.save();
      }

      // Calculate total amount
      let calculatedTotal = 0;
      const formattedItems = items.map((it, idx) => {
        const itemPrice = parseFloat(it.price) || 0;
        const itemQty = parseInt(it.quantity, 10) || 1;
        calculatedTotal += itemPrice * itemQty;
        return {
          id: idx + 1,
          productId: it.productId || it.id || idx + 1,
          name: it.name,
          price: String(itemPrice),
          quantity: itemQty,
          notes: it.notes || "",
        };
      });

      const orderData = {
        userId: user._id,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email ? email.trim() : user.email || "",
        tableNumber: orderType === "dine-in" ? parseInt(tableNumber, 10) : null,
        orderType,
        paymentMode,
        totalAmount: calculatedTotal,
        notes: notes || specialInstructions || "",
        status: "pending",
        items: formattedItems,
      };

      const placedOrder = await Order.create(orderData);

      // If dine-in, mark table occupied
      if (orderType === "dine-in" && tableNumber) {
        await Table.findOneAndUpdate(
          { tableNumber: parseInt(tableNumber, 10) },
          { status: "occupied" }
        );
      }

      const responsePayload = {
        ...placedOrder.toJSON(),
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
      };

      // Broadcast real-time event to Admin Panel
      if (io) {
        console.log(`📡 Emitting 'new_order' event for Order #${placedOrder.orderId}`);
        io.to("admin_room").emit("new_order", responsePayload);
        io.to("admins").emit("new_order", responsePayload);
        io.emit("new_order", responsePayload); // broadcast to all connected admins
      }

      res.status(201).json({
        message: "Order placed successfully!",
        data: responsePayload,
      });
    } catch (error) {
      console.error("Place order error:", error);
      res.status(500).json({ message: "Failed to place order.", error: error.message });
    }
  });

  /**
   * Get orders (Admin gets all, or customer filters by own mobile/table)
   */
  router.get("/", optionalToken, async (req, res) => {
    try {
      const { status, tableNumber, mobileNumber } = req.query;
      const isAdmin = req.user && req.user.role === "admin";

      // Security check: only authenticated admins can view all orders
      if (!isAdmin && !mobileNumber && !tableNumber) {
        return res.status(403).json({
          message: "Access restricted. Administrator privileges required to view all orders.",
        });
      }

      const filter = {};
      if (status) filter.status = status;
      if (tableNumber) filter.tableNumber = parseInt(tableNumber, 10);
      if (mobileNumber) filter.mobileNumber = mobileNumber.trim();

      const orders = await Order.find(filter)
        .populate("userId", "name phone email createdAt")
        .sort({ createdAt: -1 });

      const enriched = orders.map((o) => {
        const obj = o.toJSON();
        return {
          ...obj,
          customerPhone: o.mobileNumber,
          customerEmail: o.email || (o.userId ? o.userId.email : ""),
          user: o.userId
            ? {
                id: o.userId._id,
                name: o.userId.name,
                phone: o.userId.phone,
                email: o.userId.email,
              }
            : null,
        };
      });

      res.json({ data: enriched });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders." });
    }
  });

  /**
   * Get order by ID (orderId number or Mongo _id)
   */
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let order = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id).populate("userId", "name phone email");
      }
      if (!order) {
        order = await Order.findOne({ orderId: parseInt(id, 10) || -1 }).populate(
          "userId",
          "name phone email"
        );
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({ data: order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Failed to fetch order details." });
    }
  });

  /**
   * Update order status (Admin)
   */
  router.put("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid order status." });
      }

      let order = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        order = await Order.findById(id);
      }
      if (!order) {
        order = await Order.findOne({ orderId: parseInt(id, 10) || -1 });
      }

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      await order.save();

      // If dine-in order is completed or cancelled, check table status
      if (order.orderType === "dine-in" && order.tableNumber) {
        if (["completed", "cancelled"].includes(status)) {
          const remainingActive = await Order.countDocuments({
            tableNumber: order.tableNumber,
            orderType: "dine-in",
            status: { $in: ["pending", "preparing", "ready"] },
          });

          if (remainingActive === 0) {
            await Table.findOneAndUpdate(
              { tableNumber: order.tableNumber },
              { status: "available" }
            );
          }
        }
      }

      const updatedPayload = {
        ...order.toJSON(),
        customerPhone: order.mobileNumber,
        customerEmail: order.email,
      };

      // Emit real-time status update to Admin Panel
      if (io) {
        console.log(`📡 Emitting 'order_status_updated' event for Order #${order.orderId}: ${status}`);
        io.to("admin_room").emit("order_status_updated", updatedPayload);
        io.to("admins").emit("order_status_updated", updatedPayload);
        io.emit("order_status_updated", updatedPayload);
      }

      res.json({
        message: `Order status changed to ${status}`,
        data: updatedPayload,
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Failed to update order status." });
    }
  });

  /**
   * Delete order (Admin)
   */
  router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      let deleted = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        deleted = await Order.findByIdAndDelete(id);
      }
      if (!deleted) {
        deleted = await Order.findOneAndDelete({ orderId: parseInt(id, 10) || -1 });
      }

      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (io) {
        io.to("admin_room").emit("order_deleted", { id: deleted.orderId || deleted._id });
        io.to("admins").emit("order_deleted", { id: deleted.orderId || deleted._id });
        io.emit("order_deleted", { id: deleted.orderId || deleted._id });
      }

      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ message: "Failed to delete order." });
    }
  });

  return router;
};
