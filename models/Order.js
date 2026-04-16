const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  restaurantId: { type: String, default: "" },
  restaurantName: String,
  dishName: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    address: { type: String, required: true },
    phone: { type: String, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: "Placed" },
    paymentId: { type: String, default: "" },
    paymentStatus: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
