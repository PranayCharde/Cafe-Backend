const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * Get all menu categories
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ id: 1, _id: 1 });
    res.json({ data: categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Failed to fetch categories." });
  }
});

/**
 * Create a new category (Admin)
 */
router.post("/categories", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required." });
    }

    const created = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description ? description.trim() : "",
      imageUrl: imageUrl ? imageUrl.trim() : "",
    });

    res.status(201).json({ message: "Category created", data: created });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Failed to create category." });
  }
});

/**
 * Get menu products with filtering
 */
router.get("/products", async (req, res) => {
  try {
    const { categoryId, category, search, available, isVeg } = req.query;
    const filter = {};

    if (categoryId) filter.categoryId = parseInt(categoryId, 10);
    if (available !== undefined) filter.available = available === "true" || available === "1";
    if (isVeg !== undefined) filter.isVeg = isVeg === "true" || isVeg === "1";

    if (category) {
      const cat = await Category.findOne({ slug: category.toLowerCase() });
      if (cat) {
        filter.categoryId = cat.id;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ categoryId: 1, id: 1 });
    res.json({ data: products });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Failed to fetch menu items." });
  }
});

/**
 * Get product by ID
 */
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({ id: parseInt(id, 10) || -1 });
    }

    if (!product) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ data: product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Failed to fetch product details." });
  }
});

/**
 * Create new product (Admin)
 */
router.post("/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      categoryId,
      category,
      name,
      description,
      price,
      imageUrl,
      image,
      isVeg,
      isSpicy,
      isPopular,
      available,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and Price are required." });
    }

    let resolvedCatId = parseInt(categoryId, 10) || 1;
    if (category) {
      const catObj = await Category.findOne({ slug: String(category).toLowerCase() });
      if (catObj && catObj.id) resolvedCatId = catObj.id;
    }

    // Assign sequential numeric id
    const highest = await Product.findOne().sort("-id");
    const nextId = highest && highest.id ? highest.id + 1 : 101;

    const created = await Product.create({
      id: nextId,
      categoryId: resolvedCatId,
      name: name.trim(),
      description: description ? description.trim() : "",
      price: String(price),
      imageUrl: imageUrl || image || "",
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isSpicy: Boolean(isSpicy),
      isPopular: Boolean(isPopular),
      available: available !== undefined ? Boolean(available) : true,
      availabilityNote: req.body.availabilityNote ? req.body.availabilityNote.trim() : "",
    });

    res.status(201).json({ message: "Menu item created successfully", data: created });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Failed to create menu item." });
  }
});

/**
 * Update product (Admin)
 */
router.put("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.image && !updateData.imageUrl) {
      updateData.imageUrl = updateData.image;
    }

    let updated = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    }
    if (!updated) {
      updated = await Product.findOneAndUpdate({ id: parseInt(id, 10) || -1 }, updateData, {
        new: true,
      });
    }

    if (!updated) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item updated", data: updated });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Failed to update menu item." });
  }
});

/**
 * Delete product (Admin)
 */
router.delete("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deleted = await Product.findByIdAndDelete(id);
    }
    if (!deleted) {
      deleted = await Product.findOneAndDelete({ id: parseInt(id, 10) || -1 });
    }

    if (!deleted) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete menu item." });
  }
});

module.exports = router;
