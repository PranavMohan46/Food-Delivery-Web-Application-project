require("dotenv").config();
const paymentRoutes = require("../routes/payment");
const express = require("express");
const cors = require("cors");
const path = require("path");
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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/owner", ownerRoutes);

// Connect to MongoDB
let cachedDb = null;
mongoose.set("bufferCommands", false); // Fail fast to see error

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  console.log("Attempting to connect to MongoDB...");
  try {
    const db = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    console.log("MongoDB connected successfully");
    await seedIfEmpty();
    cachedDb = db;
    return db;
  } catch (err) {
    console.error("DEBUG: MongoDB Connection Error Details:", {
      message: err.message,
      code: err.code,
      name: err.name
    });
    throw err;
  }
}

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    res.status(500).send("Database connection failed");
  }
});

module.exports = app;
