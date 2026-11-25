const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  id: { type: Number },
  productId: { type: Number },
  name: { type: String, required: true },
  price: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: Number, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    tableNumber: { type: Number },
    orderType: { type: String, enum: ["dine-in", "takeaway", "delivery"], default: "dine-in" },
    paymentMode: { type: String, default: "UPI" },
    totalAmount: { type: Number, required: true },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

// Pre-save to assign sequential/readable orderId if not present
orderSchema.pre("save", async function () {
  if (!this.orderId) {
    const highest = await this.constructor.findOne().sort("-orderId");
    this.orderId = highest && highest.orderId ? highest.orderId + 1 : 101;
  }
});

orderSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.orderId || ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);