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
    imageUrl: "/images/Masala-Dosa.jpeg",
    isPureVeg: true,
    offerText: "Flat ₹120 OFF above ₹199",
    ownerId: null,
    dishes: [
      { name: "Masala Dosa", price: 120, isVeg: true, imageUrl: "/images/Masala-Dosa.jpeg" },
      { name: "Idli Sambar", price: 80, isVeg: true, imageUrl: "/images/Idli-Sambhar.jpeg" },
      { name: "Filter Coffee", price: 50, isVeg: true, imageUrl: "/images/Filter-Coffee.jpeg" },
    ],
  },
  {
    name: "Spice Route",
    cuisine: "North Indian",
    rating: 4.4,
    deliveryMins: "25-30 mins",
    distanceKm: 2.1,
    priceForOne: 350,
    imageUrl: "/images/Butter-Chicken.jpeg",
    isPureVeg: false,
    offerText: "Free delivery above ₹299",
    ownerId: null,
    dishes: [
      { name: "Butter Chicken", price: 280, isVeg: false, imageUrl: "/images/Butter-Chicken.jpeg" },
      { name: "Paneer Tikka", price: 220, isVeg: true, imageUrl: "/images/Paneer-Tikka.jpeg" },
      { name: "Dal Makhani", price: 180, isVeg: true, imageUrl: "/images/Dal-Makhan.jpeg" },
    ],
  },
  {
    name: "Bombay Bites",
    cuisine: "Street Food",
    rating: 4.0,
    deliveryMins: "20-25 mins",
    distanceKm: 1.5,
    priceForOne: 200,
    imageUrl: "/images/Vada-Pav.jpeg",
    isPureVeg: true,
    offerText: "Meals under ₹250",
    ownerId: null,
    dishes: [
      { name: "Vada Pav", price: 45, isVeg: true, imageUrl: "/images/Vada-Pav.jpeg" },
      { name: "Pav Bhaji", price: 120, isVeg: true, imageUrl: "/images/Pav-Bhaji.jpeg" },
      { name: "Misal Pav", price: 140, isVeg: true, imageUrl: "/images/Misal-Pav.jpeg" },
    ],
  },
  {
    name: "Dragon Wok",
    cuisine: "Chinese",
    rating: 4.2,
    deliveryMins: "35-40 mins",
    distanceKm: 4.2,
    priceForOne: 400,
    imageUrl: "/images/Chicken-Manchurian.jpeg",
    isPureVeg: false,
    offerText: "20% off on first order",
    ownerId: null,
    dishes: [
      { name: "Hakka Noodles", price: 180, isVeg: true, imageUrl: "/images/Hakka-Noodles.jpeg" },
      { name: "Chicken Manchurian", price: 240, isVeg: false, imageUrl: "/images/Chicken-Manchurian.jpeg" },
      { name: "Spring Rolls", price: 160, isVeg: true, imageUrl: "/images/Spring-Rolls.jpeg" },
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
