require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db");

// Routes
const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const tableRoutes = require("./routes/table.routes");
const createOrderRoutes = require("./routes/order.routes");
const reservationRoutes = require("./routes/reservation.routes");
const reviewRoutes = require("./routes/review.routes");
const contactRoutes = require("./routes/contact.routes");
const setupSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

setupSocket(io);

// Security: Disable X-Powered-By fingerprinting
app.disable("x-powered-by");

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Mount API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", createOrderRoutes(io));
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);

// Root API Index & Health Check
app.get("/api", (req, res) => {
  res.json({
    name: "Bean & Brew Cafe API",
    version: "2.0.0",
    database: "MongoDB",
    status: "online",
    endpoints: {
      auth: "/api/auth",
      menu: "/api/menu",
      orders: "/api/orders",
      tables: "/api/tables",
      reservations: "/api/reservations",
      reviews: "/api/reviews",
      contact: "/api/contact",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database: "MongoDB",
    service: "Bean & Brew Cafe Backend",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "API route not found", path: req.originalUrl });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`☕ Bean & Brew Cafe Backend - Fully Functional Server`);
  console.log(`🍃 Bean & Brew Cafe Backend - MongoDB Powered Server`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`📡 Socket.IO Real-time: Active`);
  console.log(`🔑 Master Admin: admin@beanbrew.com / admin123`);
  console.log(`======================================================\n`);
});
