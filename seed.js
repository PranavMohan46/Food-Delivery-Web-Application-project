const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Restaurant = require("./models/Restaurant");

const sample = [
  {
    name: "South Culture",
    cuisine: "South Indian",
    rating: 4.1,
    deliveryMins: "30-35 mins",
    distanceKm: 3.8,
    priceForOne: 300,
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba9a9b0f2?w=800&q=80",
    isPureVeg: true,
    offerText: "Flat ₹120 OFF above ₹199",
    ownerId: null,
    dishes: [
      { name: "Masala Dosa", price: 120, isVeg: true, imageUrl: "" },
      { name: "Idli Sambar", price: 80, isVeg: true, imageUrl: "" },
      { name: "Filter Coffee", price: 50, isVeg: true, imageUrl: "" },
    ],
  },
  {
    name: "Spice Route",
    cuisine: "North Indian",
    rating: 4.4,
    deliveryMins: "25-30 mins",
    distanceKm: 2.1,
    priceForOne: 350,
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    isPureVeg: false,
    offerText: "Free delivery above ₹299",
    ownerId: null,
    dishes: [
      { name: "Butter Chicken", price: 280, isVeg: false, imageUrl: "" },
      { name: "Paneer Tikka", price: 220, isVeg: true, imageUrl: "" },
      { name: "Dal Makhani", price: 180, isVeg: true, imageUrl: "" },
    ],
  },
  {
    name: "Bombay Bites",
    cuisine: "Street Food",
    rating: 4.0,
    deliveryMins: "20-25 mins",
    distanceKm: 1.5,
    priceForOne: 200,
    imageUrl: "https://images.unsplash.com/photo-1601050690117-94f0f4d8e2c4?w=800&q=80",
    isPureVeg: true,
    offerText: "Meals under ₹250",
    ownerId: null,
    dishes: [
      { name: "Vada Pav", price: 45, isVeg: true, imageUrl: "" },
      { name: "Pav Bhaji", price: 120, isVeg: true, imageUrl: "" },
      { name: "Misal Pav", price: 140, isVeg: true, imageUrl: "" },
    ],
  },
  {
    name: "Dragon Wok",
    cuisine: "Chinese",
    rating: 4.2,
    deliveryMins: "35-40 mins",
    distanceKm: 4.2,
    priceForOne: 400,
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
    isPureVeg: false,
    offerText: "20% off on first order",
    ownerId: null,
    dishes: [
      { name: "Hakka Noodles", price: 180, isVeg: true, imageUrl: "" },
      { name: "Chicken Manchurian", price: 240, isVeg: false, imageUrl: "" },
      { name: "Spring Rolls", price: 160, isVeg: true, imageUrl: "" },
    ],
  },
];

async function ensureDemoOwner() {
  const email = "owner@demo.com";
  const existing = await User.findOne({ email });
  if (existing) return;
  const passwordHash = await bcrypt.hash("owner123", 10);
  const user = await User.create({
    email,
    passwordHash,
    name: "Demo Owner",
    role: "restaurant_owner",
  });
  const r = await Restaurant.findOne({ name: "South Culture" });
  if (r) {
    r.ownerId = user._id;
    await r.save();
    console.log("Demo owner → owner@demo.com / owner123 (South Culture)");
  }
}

async function seedIfEmpty() {
  const count = await Restaurant.countDocuments();
  if (count === 0) {
    await Restaurant.insertMany(sample);
    console.log("Sample restaurants seeded.");
  }
  await ensureDemoOwner();
}

module.exports = { seedIfEmpty };
