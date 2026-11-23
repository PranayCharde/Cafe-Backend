const express = require("express");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/menu/categories
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find().sort({ id: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

/**
 * GET /api/menu/products
 */
router.get("/products", async (req, res) => {
  try {
    const { categoryId, isPopular, search } = req.query;

    const filter = {};

    if (categoryId && categoryId !== "all") {
      filter.categoryId = parseInt(categoryId, 10);
    }

    if (isPopular === "true" || isPopular === "1") {
      filter.isPopular = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter).sort({ id: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

/**
 * GET /api/menu/products/:id
 */
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const product = isNaN(id)
      ? await Product.findById(req.params.id)
      : await Product.findOne({ id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

/**
 * ADMIN ONLY: Create Product
 */
router.post("/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { categoryId, name, description, price, imageUrl, isVeg, isSpicy, isPopular, available } = req.body;

    if (!categoryId || !name || !price) {
      return res.status(400).json({ message: "Category, name and price are required." });
    }

    const highest = await Product.findOne().sort("-id");
    const newId = highest && highest.id ? highest.id + 1 : 1;

    const product = await Product.create({
      id: newId,
      categoryId: parseInt(categoryId, 10),
      name: name.trim(),
      description: description || "",
      price: String(price),
      imageUrl: imageUrl || "",
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      isSpicy: isSpicy !== undefined ? Boolean(isSpicy) : false,
      isPopular: isPopular !== undefined ? Boolean(isPopular) : false,
      available: available !== undefined ? Boolean(available) : true,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (error) {
    res.status(500).json({ message: "Failed to create product" });
  }
});

/**
 * ADMIN ONLY: Update Product
 */
router.put("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const query = isNaN(id) ? { _id: req.params.id } : { id };

    const updated = await Product.findOneAndUpdate(query, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated", product: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

/**
 * ADMIN ONLY: Delete Product
 */
router.delete("/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const query = isNaN(id) ? { _id: req.params.id } : { id };

    await Product.findOneAndDelete(query);
    res.json({ message: `Product #${req.params.id} deleted` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete product" });
  }
});

module.exports = router;
