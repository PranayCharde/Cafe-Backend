const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET, authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// In-memory rate limiter for admin login brute-force protection
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "global";
  const record = loginAttempts.get(ip);

  if (record) {
    const timePassed = Date.now() - record.lastAttempt;
    if (timePassed < LOCKOUT_TIME_MS && record.count >= MAX_ATTEMPTS) {
      const minutesRemaining = Math.ceil((LOCKOUT_TIME_MS - timePassed) / 60000);
      return res.status(429).json({
        message: `Too many failed login attempts. IP temporarily locked out for security. Try again in ${minutesRemaining} minute(s).`,
      });
    }

    if (timePassed >= LOCKOUT_TIME_MS) {
      // Reset after lockout expires
      loginAttempts.delete(ip);
    }
  }

  next();
}

function recordFailedAttempt(req) {
  const ip = req.ip || req.connection.remoteAddress || "global";
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(ip, record);
}

function clearFailedAttempts(req) {
  const ip = req.ip || req.connection.remoteAddress || "global";
  loginAttempts.delete(ip);
}

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
 * Admin Login (Rate-limited, brute-force secured)
 */
router.post("/admin-login", checkLoginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await User.findOne({ email: email.trim().toLowerCase(), role: "admin" });

    if (!admin) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: "Invalid administrator credentials" });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      recordFailedAttempt(req);
      return res.status(401).json({ message: "Invalid administrator credentials" });
    }

    // Clear failed attempts on valid login
    clearFailedAttempts(req);

    const token = jwt.sign(
      { id: admin._id, name: admin.name, email: admin.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1d" } // Session token expires in 24 hours
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

/**
 * Change Administrator Password
 * Secure endpoint requiring active admin session & validation of existing password
 */
router.post("/change-password", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found." });
    }

    const isMatch = bcrypt.compareSync(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password verification failed." });
    }

    const salt = bcrypt.genSaltSync(10);
    admin.password = bcrypt.hashSync(newPassword, salt);
    await admin.save();

    console.log(`🔒 Administrator password successfully updated for ${admin.email}`);
    res.json({ message: "Administrator password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to update password." });
  }
});

module.exports = router;
