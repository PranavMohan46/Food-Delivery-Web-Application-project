const express = require("express");
const Order = require("../models/Order");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, address, phone, total, paymentId, paymentStatus } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array required" });
    }
    if (!address || !phone || total == null) {
      return res.status(400).json({ error: "address, phone, and total required" });
    }
    const order = await Order.create({
      userId: req.userId,
      items: items.map((item) => ({
        restaurantId: item.restaurantId ? String(item.restaurantId) : "",
        restaurantName: item.restaurantName ? String(item.restaurantName) : "",
        dishName: String(item.dishName || ""),
        qty: Number(item.qty),
        price: Number(item.price),
      })),
      address,
      phone,
      total: Number(total),
      paymentId: paymentId || "",
      paymentStatus: paymentStatus || "pending",
    });
    res.status(201).json({ order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
