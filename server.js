require("dotenv").config();
const paymentRoutes = require("./routes/payment");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const restaurantRoutes = require("./routes/restaurants");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const ownerRoutes = require("./routes/owner");
const { seedIfEmpty } = require("./seed");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/clover_food";
const reactDistDir = path.join(__dirname, "client", "dist");

const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/splash.html");
});

app.use(express.static(path.join(__dirname, "public"), { index: false }));

if (fs.existsSync(reactDistDir)) {
  app.use("/app", express.static(reactDistDir));
}

app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/owner", ownerRoutes);

if (fs.existsSync(reactDistDir)) {
  app.get(/^\/app(?:\/.*)?$/, (req, res) => {
    res.sendFile(path.join(reactDistDir, "index.html"));
  });
}

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedIfEmpty();
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// Only listen if running directly (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
