const express = require("express");
const Cart = require("../models/Cart");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

function normalizeCartItem(input = {}) {
  return {
    restaurantId: input.restaurantId ? String(input.restaurantId) : "",
    restaurantName: input.restaurantName ? String(input.restaurantName).trim() : "",
    dishId: input.dishId ? String(input.dishId) : "",
    dishName: input.dishName ? String(input.dishName).trim() : "",
    qty: Math.max(1, Number(input.qty) || 1),
    price: Number(input.price),
    imageUrl: input.imageUrl ? String(input.imageUrl).trim() : "",
    isVeg: input.isVeg === true || input.isVeg === "true" || input.isVeg === "on",
  };
}

function mergeCartItems(baseItems = [], incomingItems = []) {
  const merged = [...baseItems.map((item) => ({ ...item.toObject?.() || item }))];

  for (const rawItem of incomingItems) {
    const incoming = normalizeCartItem(rawItem);
    if (!incoming.dishName || !Number.isFinite(incoming.price)) continue;

    const existing = merged.find(
      (item) =>
        (incoming.dishId && item.dishId === incoming.dishId) ||
        (!incoming.dishId &&
          item.dishName === incoming.dishName &&
          item.restaurantId === incoming.restaurantId)
    );

    if (existing) {
      existing.qty = Math.max(1, Number(existing.qty || 1) + Number(incoming.qty || 1));
      existing.price = incoming.price;
      existing.imageUrl = incoming.imageUrl || existing.imageUrl;
      existing.restaurantName = incoming.restaurantName || existing.restaurantName;
      existing.isVeg = incoming.isVeg;
    } else {
      merged.push(incoming);
    }
  }

  return merged;
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

router.get("/", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    if (String(req.params.userId) !== String(req.userId)) {
      return res.status(403).json({ error: "You can only view your own cart" });
    }
    const cart = await getOrCreateCart(req.userId);
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/items", async (req, res) => {
  try {
    const incoming = normalizeCartItem(req.body.item || req.body);
    if (!incoming.dishName || !Number.isFinite(incoming.price)) {
      return res.status(400).json({ error: "dishName and price are required" });
    }

    const cart = await getOrCreateCart(req.userId);
    const existing = cart.items.find(
      (item) =>
        (incoming.dishId && item.dishId === incoming.dishId) ||
        (!incoming.dishId &&
          item.dishName === incoming.dishName &&
          item.restaurantId === incoming.restaurantId)
    );

    if (existing) {
      existing.qty += incoming.qty;
      existing.price = incoming.price;
      existing.imageUrl = incoming.imageUrl || existing.imageUrl;
      existing.restaurantName = incoming.restaurantName || existing.restaurantName;
      existing.isVeg = incoming.isVeg;
    } else {
      cart.items.push(incoming);
    }

    await cart.save();
    res.status(201).json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const cart = await getOrCreateCart(req.userId);
    cart.items = mergeCartItems(cart.items, items);
    await cart.save();
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/items/:dishId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    const item = cart.items.find((entry) => entry.dishId === req.params.dishId);
    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (req.body.qty != null) {
      item.qty = Math.max(1, Number(req.body.qty) || 1);
    }

    await cart.save();
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/items/:dishId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    cart.items = cart.items.filter((entry) => entry.dishId !== req.params.dishId);
    await cart.save();
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    cart.items = [];
    await cart.save();
    res.json({ cart });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
