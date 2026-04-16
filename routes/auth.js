const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { JWT_SECRET, authMiddleware } = require("../middleware/auth");

const router = express.Router();

function userResponse(user, restaurantId = null) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role || "customer",
    restaurantId,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      name,
      role: "customer",
    });
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: userResponse(user),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const DEFAULT_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";

router.post("/register-restaurant", async (req, res) => {
  try {
    const {
      email,
      password,
      ownerName,
      restaurantName,
      cuisine,
      deliveryMins,
      priceForOne,
      offerText,
    } = req.body;
    if (!email || !password || !ownerName || !restaurantName) {
      return res.status(400).json({
        error: "Email, password, your name, and restaurant name are required",
      });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name: ownerName.trim(),
      role: "restaurant_owner",
    });
    const restaurant = await Restaurant.create({
      ownerId: user._id,
      name: restaurantName.trim(),
      cuisine: (cuisine && cuisine.trim()) || "Multi-cuisine",
      deliveryMins: (deliveryMins && String(deliveryMins).trim()) || "25-35 mins",
      priceForOne: priceForOne != null && priceForOne !== "" ? Number(priceForOne) : 250,
      offerText: offerText != null ? String(offerText) : "",
      imageUrl: DEFAULT_RESTAURANT_IMAGE,
      dishes: [],
      isPureVeg: true,
      distanceKm: 2.0,
      rating: 4.0,
    });
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: userResponse(user, restaurant._id),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    let restaurantId = null;
    if ((user.role || "customer") === "restaurant_owner") {
      const r = await Restaurant.findOne({ ownerId: user._id }).select("_id");
      restaurantId = r ? r._id : null;
    }
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      user: userResponse(user, restaurantId),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });
    let restaurantId = null;
    if ((user.role || "customer") === "restaurant_owner") {
      const r = await Restaurant.findOne({ ownerId: user._id }).select("_id");
      restaurantId = r ? r._id : null;
    }
    res.json({ user: userResponse(user, restaurantId) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
