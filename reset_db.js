require("dotenv").config();
const mongoose = require("mongoose");
const Restaurant = require("./models/Restaurant");
const User = require("./models/User");
const Order = require("./models/Order");
const { seedIfEmpty } = require("./seed");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clover_food";

async function reset() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for reset.");

    // Delete existing data
    await Restaurant.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log("Cleared Restaurants, Users, and Orders.");

    // Run seed
    await seedIfEmpty();
    console.log("Database re-seeded successfully with local images.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
}

reset();
