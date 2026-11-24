const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    categoryId: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: String, required: true },
    imageUrl: { type: String },
    isVeg: { type: Boolean, default: true },
    isSpicy: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    available: { type: Boolean, default: true },
    availabilityNote: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.id || ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
