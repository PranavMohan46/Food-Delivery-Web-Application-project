const express = require("express");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q, veg } = req.query;
    const filter = {};
    if (veg === "1" || veg === "true") {
      filter.isPureVeg = true;
    }
    if (q && String(q).trim()) {
      const esc = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(esc, "i");
      filter.$or = [{ name: rx }, { cuisine: rx }, { "dishes.name": rx }];
    }
    const list = await Restaurant.find(filter).sort({ name: 1 }).lean();
    res.json({ restaurants: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: "Restaurant not found" });
    res.json({ restaurant: r });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
