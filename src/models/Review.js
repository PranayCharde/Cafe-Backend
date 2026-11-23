const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    approved: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Review", reviewSchema);

