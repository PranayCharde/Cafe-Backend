const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, default: 4 },
    status: { type: String, enum: ["available", "occupied", "reserved"], default: "available" },
  },
  { timestamps: true }
);

tableSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Table", tableSchema);

