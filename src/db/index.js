const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const seedData = require("./seedData");

// Models
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Table = require("../models/Table");
const Review = require("../models/Review");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cafe_connect_hub";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`🍃 Connected to MongoDB: ${MONGODB_URI}`);

    await autoSeedDatabase();
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}

async function autoSeedDatabase() {
  try {
    // 1. Seed Master Admin
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync("admin123", salt);
      await User.create({
        name: "Master Admin",
        phone: "9999999999",
        email: "admin@beanbrew.com",
        password: hashedPassword,
        role: "admin",
      });
      console.log("Seeded default admin: admin@beanbrew.com / admin123");
    }

    // 2. Seed Categories
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(seedData.categories);
      console.log(`Seeded ${seedData.categories.length} categories.`);
    }

    // 3. Seed Products
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany(seedData.products);
      console.log(`Seeded ${seedData.products.length} menu products.`);
    }

    // 4. Seed Tables
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tablesToInsert = [];
      for (let i = 1; i <= 12; i++) {
        tablesToInsert.push({
          tableNumber: i,
          capacity: i % 3 === 0 ? 6 : 4,
          status: "available",
        });
      }
      await Table.insertMany(tablesToInsert);
      console.log("Seeded 12 dining tables for Bean & Brew.");
    }

    // 5. Seed Reviews
    const revCount = await Review.countDocuments();
    if (revCount === 0) {
      await Review.insertMany(seedData.reviews);
      console.log(`Seeded ${seedData.reviews.length} customer reviews.`);
    }
  } catch (err) {
    console.warn("Seeding notice:", err.message);
  }
}

module.exports = {
  connectDB,
  User,
  Category,
  Product,
  Table,
  Order: require("../models/Order"),
  Reservation: require("../models/Reservation"),
  Review,
  Contact: require("../models/Contact"),
};
