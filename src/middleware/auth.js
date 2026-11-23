const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "bean-and-brew-super-secret-key-2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired session" });
    }
    req.user = user;
    next();
  });
}

function optionalToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access restricted. Admin credentials required." });
  }
  next();
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  optionalToken,
  requireAdmin,
};

