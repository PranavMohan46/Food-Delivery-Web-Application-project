const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  isVeg: { type: Boolean, default: true },
  imageUrl: { type: String, default: "" },
  description: { type: String, default: "" },
});

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true },
    cuisine: { type: String, required: true },
    rating: { type: Number, default: 4.0 },
    deliveryMins: { type: String, default: "25-30 mins" },
    distanceKm: { type: Number, default: 2.5 },
    priceForOne: { type: Number, default: 250 },
    imageUrl: { type: String, required: true },
    isPureVeg: { type: Boolean, default: false },
    offerText: { type: String, default: "" },
    dishes: [dishSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
