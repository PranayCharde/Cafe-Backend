const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

categorySchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret.id || ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Category", categorySchema);

