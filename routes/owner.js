const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");
const { authMiddleware } = require("../middleware/auth");
const { ownerMiddleware } = require("../middleware/owner");

const uploadDir = path.join(__dirname, "..", "public", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

const router = express.Router();
router.use(authMiddleware);
router.use(ownerMiddleware);

function syncPureVeg(restaurant) {
  if (!restaurant.dishes.length) {
    restaurant.isPureVeg = true;
    return;
  }
  restaurant.isPureVeg = restaurant.dishes.every((d) => d.isVeg);
}

router.get("/restaurant", async (req, res) => {
  try {
    const r = await Restaurant.findById(req.restaurant._id).lean();
    res.json({ restaurant: r });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const restaurant = req.restaurant;
    const orders = await Order.find({
      $or: [
        { "items.restaurantId": String(restaurant._id) },
        { "items.restaurantName": restaurant.name },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const relevantOrders = orders
      .map((order) => {
        const items = (order.items || []).filter(
          (item) =>
            item.restaurantId === String(restaurant._id) || item.restaurantName === restaurant.name
        );
        if (!items.length) return null;
        const revenue = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
        return { ...order, items, revenue };
      })
      .filter(Boolean);

    const analytics = {
      totalOrders: relevantOrders.length,
      totalRevenue: relevantOrders.reduce((sum, order) => sum + order.revenue, 0),
      averageOrderValue: relevantOrders.length
        ? Math.round(
            relevantOrders.reduce((sum, order) => sum + order.revenue, 0) / relevantOrders.length
          )
        : 0,
      activeMenuItems: (restaurant.dishes || []).length,
      recentOrders: relevantOrders.slice(0, 5).map((order) => ({
        id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        revenue: order.revenue,
        itemCount: order.items.reduce((sum, item) => sum + Number(item.qty || 1), 0),
      })),
      topDishes: Object.values(
        relevantOrders.reduce((acc, order) => {
          order.items.forEach((item) => {
            const key = item.dishName || "Unknown dish";
            if (!acc[key]) {
              acc[key] = { dishName: key, qty: 0, revenue: 0 };
            }
            acc[key].qty += Number(item.qty || 1);
            acc[key].revenue += Number(item.price || 0) * Number(item.qty || 1);
          });
          return acc;
        }, {})
      )
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5),
    };

    res.json({ analytics });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/dishes", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid file" });
    }
    try {
      const restaurant = await Restaurant.findById(req.restaurant._id);
      const { name, price, isVeg, description } = req.body;
      if (!name || String(name).trim() === "" || price === "" || price == null) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: "Name and price are required" });
      }
      const veg = isVeg === "true" || isVeg === true || isVeg === "on";
      let imageUrl = "";
      if (req.file) imageUrl = `/uploads/${req.file.filename}`;
      restaurant.dishes.push({
        name: String(name).trim(),
        price: Number(price),
        isVeg: veg,
        imageUrl,
        description: description != null ? String(description).trim() : "",
      });
      syncPureVeg(restaurant);
      await restaurant.save();
      res.status(201).json({ restaurant });
    } catch (e) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: e.message });
    }
  });
});

router.patch("/dishes/:dishId", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid file" });
    }
    try {
      const restaurant = await Restaurant.findById(req.restaurant._id);
      const d = restaurant.dishes.id(req.params.dishId);
      if (!d) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: "Dish not found" });
      }
      const { name, price, isVeg, description } = req.body;
      if (name != null && String(name).trim() !== "") d.name = String(name).trim();
      if (price != null && price !== "") d.price = Number(price);
      if (isVeg != null) d.isVeg = isVeg === "true" || isVeg === true || isVeg === "on";
      if (description != null) d.description = String(description).trim();
      if (req.file) {
        if (d.imageUrl && d.imageUrl.startsWith("/uploads/")) {
          const oldPath = path.join(uploadDir, path.basename(d.imageUrl));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        d.imageUrl = `/uploads/${req.file.filename}`;
      }
      syncPureVeg(restaurant);
      await restaurant.save();
      res.json({ restaurant });
    } catch (e) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: e.message });
    }
  });
});

router.delete("/dishes/:dishId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant._id);
    const d = restaurant.dishes.id(req.params.dishId);
    if (!d) return res.status(404).json({ error: "Dish not found" });
    if (d.imageUrl && d.imageUrl.startsWith("/uploads/")) {
      const oldPath = path.join(uploadDir, path.basename(d.imageUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    d.deleteOne();
    syncPureVeg(restaurant);
    await restaurant.save();
    res.json({ restaurant });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/restaurant", (req, res) => {
  upload.single("cover")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Invalid file" });
    }
    try {
      const restaurant = await Restaurant.findById(req.restaurant._id);
      const { name, cuisine, offerText, deliveryMins, priceForOne, isPureVeg } = req.body;
      if (name != null && String(name).trim() !== "") restaurant.name = String(name).trim();
      if (cuisine != null && String(cuisine).trim() !== "") restaurant.cuisine = String(cuisine).trim();
      if (offerText != null) restaurant.offerText = String(offerText);
      if (deliveryMins != null && String(deliveryMins).trim() !== "") restaurant.deliveryMins = String(deliveryMins).trim();
      if (priceForOne != null && priceForOne !== "") restaurant.priceForOne = Number(priceForOne);
      if (isPureVeg != null) restaurant.isPureVeg = isPureVeg === "true" || isPureVeg === true || isPureVeg === "on";
      if (req.file) {
        if (restaurant.imageUrl && restaurant.imageUrl.startsWith("/uploads/")) {
          const oldPath = path.join(uploadDir, path.basename(restaurant.imageUrl));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        restaurant.imageUrl = `/uploads/${req.file.filename}`;
      }
      await restaurant.save();
      res.json({ restaurant });
    } catch (e) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: e.message });
    }
  });
});

module.exports = router;
