require("dotenv").config();
const paymentRoutes = require("../routes/payment");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("../routes/auth");
const restaurantRoutes = require("../routes/restaurants");
const orderRoutes = require("../routes/orders");
const cartRoutes = require("../routes/cart");
const ownerRoutes = require("../routes/owner");
const { seedIfEmpty } = require("../seed");

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clover_food";

app.use(cors());
app.use(express.json());

// Database connection singleton (caches the PROMISE for optimal serverless performance)
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) return cachedConnection;

  // Store the connection promise so concurrent requests don't start multiple connections
  cachedConnection = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  }).then(async (m) => {
    console.log("MongoDB connected successfully");
    await seedIfEmpty();
    return m;
  }).catch((err) => {
    cachedConnection = null; // Reset on failure so next request can try again
    console.error("DEBUG: MongoDB Connection Error:", err.message);
    throw err;
  });

  return cachedConnection;
}

// IMPORTANT: Database connection middleware MUST come BEFORE any routes
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/owner", ownerRoutes);

module.exports = app;
