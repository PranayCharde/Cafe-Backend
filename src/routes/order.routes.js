const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const { authenticateToken, optionalToken, requireAdmin } = require("../middleware/auth");

module.exports = function (io) {
  const router = express.Router();

  /**
   * POST /api/orders - Place a New Order
   */
  router.post("/", optionalToken, async (req, res) => {
    try {
      const {
        customerName,
        mobileNumber,
        email,
        tableNumber,
        orderType,
        paymentMode,
        totalAmount,
        notes,
        items,
      } = req.body;

      if (!customerName || !mobileNumber || !items || !items.length) {
        return res.status(400).json({ message: "Missing required order details" });
      }

      // Find or create customer
      let user = null;
      if (req.user) {
        user = await User.findById(req.user.id);
      } else if (mobileNumber) {
        user = await User.findOne({ phone: mobileNumber.trim() });
        if (!user) {
          user = await User.create({
            name: customerName.trim(),
            phone: mobileNumber.trim(),
            email: email ? email.trim() : null,
            role: "customer",
          });
        }
      }

      const order = await Order.create({
        userId: user ? user._id : null,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email ? email.trim() : user?.email || null,
        tableNumber: tableNumber ? parseInt(tableNumber, 10) : null,
        orderType: orderType || (tableNumber ? "dine-in" : "delivery"),
        paymentMode: paymentMode || "UPI",
        totalAmount: parseFloat(totalAmount),
        notes: notes || "",
        status: "pending",
        items: items.map((it) => ({
          id: it.id || it.productId,
          productId: it.productId || it.id,
          name: it.name,
          price: String(it.price),
          quantity: parseInt(it.quantity, 10) || 1,
        })),
      });

      // Get count of orders placed by this customer
      const customerOrdersCount = await Order.countDocuments({ mobileNumber: mobileNumber.trim() });

      const orderPayload = {
        id: order.orderId,
        _id: order._id,
        orderId: order.orderId,
        customerName: order.customerName,
        mobileNumber: order.mobileNumber,
        email: order.email,
        tableNumber: order.tableNumber,
        orderType: order.orderType,
        paymentMode: order.paymentMode,
        totalAmount: order.totalAmount,
        notes: order.notes,
        status: order.status,
        items: order.items,
        totalCustomerOrdersCount: customerOrdersCount,
        registeredUserName: user ? user.name : order.customerName,
        registeredPhone: user ? user.phone : order.mobileNumber,
        registeredEmail: user ? user.email : order.email,
        customerSince: user ? user.createdAt : order.createdAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };

      // 🔥 EMIT REAL-TIME SOCKET EVENT TO ALL ADMINS 🔥
      if (io) {
        io.emit("new_order", orderPayload);
        console.log(`[Socket.io] Emitted new_order #${order.orderId} for Table #${order.tableNumber}`);
      }

      res.status(201).json({
        message: "Order placed successfully",
        order: orderPayload,
      });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ message: "Failed to place order" });
    }
  });

  /**
   * GET /api/orders - ADMIN ONLY: Get All Orders
   */
  router.get("/", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status, tableNumber, search, orderType } = req.query;

      const filter = {};

      if (status && status !== "all") {
        filter.status = status;
      }

      if (tableNumber && tableNumber !== "all") {
        filter.tableNumber = parseInt(tableNumber, 10);
      }

      if (orderType && orderType !== "all") {
        filter.orderType = orderType;
      }

      if (search) {
        const isNum = !isNaN(parseInt(search, 10));
        filter.$or = [
          { customerName: { $regex: search, $options: "i" } },
          { mobileNumber: { $regex: search, $options: "i" } },
          ...(isNum ? [{ orderId: parseInt(search, 10) }] : []),
        ];
      }

      const orders = await Order.find(filter)
        .populate("userId", "name phone email createdAt")
        .sort({ createdAt: -1 });

      // Transform with customer info
      const formatted = await Promise.all(
        orders.map(async (ord) => {
          const count = await Order.countDocuments({ mobileNumber: ord.mobileNumber });

          return {
            id: ord.orderId,
            _id: ord._id,
            orderId: ord.orderId,
            customerName: ord.customerName,
            mobileNumber: ord.mobileNumber,
            email: ord.email,
            tableNumber: ord.tableNumber,
            orderType: ord.orderType,
            paymentMode: ord.paymentMode,
            totalAmount: ord.totalAmount,
            notes: ord.notes,
            status: ord.status,
            items: ord.items,
            totalCustomerOrdersCount: count,
            registeredUserName: ord.userId ? ord.userId.name : ord.customerName,
            registeredPhone: ord.userId ? ord.userId.phone : ord.mobileNumber,
            registeredEmail: ord.userId ? ord.userId.email : ord.email,
            customerSince: ord.userId ? ord.userId.createdAt : ord.createdAt,
            createdAt: ord.createdAt,
            updatedAt: ord.updatedAt,
          };
        })
      );

      res.json({ orders: formatted });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  /**
   * GET /api/orders/my-orders - Customer: View My Orders
   */
  router.get("/my-orders", authenticateToken, async (req, res) => {
    try {
      const orders = await Order.find({
        $or: [{ userId: req.user.id }, { mobileNumber: req.user.phone }],
      }).sort({ createdAt: -1 });

      res.json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  /**
   * GET /api/orders/:id - ADMIN ONLY: Get Order Details & Customer History
   */
  router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const isNumeric = !isNaN(parseInt(req.params.id, 10));
      const query = isNumeric ? { orderId: parseInt(req.params.id, 10) } : { _id: req.params.id };

      const order = await Order.findOne(query).populate("userId", "name phone email createdAt");
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const previousOrders = await Order.find({
        mobileNumber: order.mobileNumber,
        _id: { $ne: order._id },
      })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({ order, previousOrders });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  /**
   * PATCH /api/orders/:id/status - ADMIN ONLY: Update Order Status
   */
  router.patch("/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const isNumeric = !isNaN(parseInt(id, 10));
      const query = isNumeric ? { orderId: parseInt(id, 10) } : { _id: id };

      const updated = await Order.findOneAndUpdate(
        query,
        { $set: { status } },
        { new: true }
      ).populate("userId", "name phone email createdAt");

      if (!updated) {
        return res.status(404).json({ message: "Order not found" });
      }

      const count = await Order.countDocuments({ mobileNumber: updated.mobileNumber });

      const payload = {
        id: updated.orderId,
        _id: updated._id,
        orderId: updated.orderId,
        customerName: updated.customerName,
        mobileNumber: updated.mobileNumber,
        email: updated.email,
        tableNumber: updated.tableNumber,
        orderType: updated.orderType,
        paymentMode: updated.paymentMode,
        totalAmount: updated.totalAmount,
        notes: updated.notes,
        status: updated.status,
        items: updated.items,
        totalCustomerOrdersCount: count,
        registeredUserName: updated.userId ? updated.userId.name : updated.customerName,
        registeredPhone: updated.userId ? updated.userId.phone : updated.mobileNumber,
        registeredEmail: updated.userId ? updated.userId.email : updated.email,
        customerSince: updated.userId ? updated.userId.createdAt : updated.createdAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };

      // 🔥 EMIT REAL-TIME SOCKET EVENT 🔥
      if (io) {
        io.emit("order_status_updated", payload);
        console.log(`[Socket.io] Emitted order_status_updated #${payload.id} -> ${status}`);
      }

      res.json({
        message: `Order #${payload.id} marked as ${status}`,
        order: payload,
      });
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  /**
   * DELETE /api/orders/:id - ADMIN ONLY: Delete an Order
   */
  router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const isNumeric = !isNaN(parseInt(req.params.id, 10));
      const query = isNumeric ? { orderId: parseInt(req.params.id, 10) } : { _id: req.params.id };

      const deleted = await Order.findOneAndDelete(query);
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (io) {
        io.emit("order_deleted", { id: deleted.orderId });
      }

      res.json({ message: `Order #${deleted.orderId} removed` });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  return router;
};
