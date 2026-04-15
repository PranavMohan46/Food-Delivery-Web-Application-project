const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: String, default: "" },
    restaurantName: { type: String, default: "" },
    dishId: { type: String, default: "" },
    dishName: { type: String, required: true, trim: true },
    qty: { type: Number, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: "" },
    isVeg: { type: Boolean, default: true },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
