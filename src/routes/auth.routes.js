const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, authenticateToken } = require("../middleware/auth");

const router = express.Router();

/**
 * Customer Quick Login / Register
 */
router.post("/customer-login", async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!phone || !name) {
      return res.status(400).json({ message: "Name and Phone number are required." });
    }

    let user = await User.findOne({ phone: phone.trim() });

    if (!user) {
      user = await User.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        role: "customer",
      });
    } else {
      user.name = name.trim();
      if (email) user.email = email.trim();
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Customer login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Admin Login
 */
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email: email.trim().toLowerCase(), role: "admin" });

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Admin authentication successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Current User Profile
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

module.exports = router;
