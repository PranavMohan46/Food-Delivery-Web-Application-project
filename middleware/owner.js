const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

async function ownerMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || (user.role || "customer") !== "restaurant_owner") {
      return res.status(403).json({ error: "Restaurant owner access only" });
    }
    const restaurant = await Restaurant.findOne({ ownerId: user._id });
    if (!restaurant) {
      return res.status(404).json({ error: "No restaurant linked to your account" });
    }
    req.ownerUser = user;
    req.restaurant = restaurant;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { ownerMiddleware };
