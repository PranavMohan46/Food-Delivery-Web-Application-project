const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YOUR_SECRET",
});

// Expose the Razorpay key_id to the frontend (safe — it's a public key)
router.get("/key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID || "YOUR_KEY_ID" });
});

// Create a Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount === undefined || amount === null || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount provided: " + amount });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // Razorpay expects paise (integer)
      currency: "INR",
      receipt: "rcpt_" + Math.floor(Math.random() * 1000000),
      notes: {
        description: "Food Delivery Order"
      }
    };

    console.log("Creating Razorpay Order with options:", options);

    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order created successfully:", order.id);
    res.json(order);
  } catch (err) {
    console.error("Razorpay create-order error details:", JSON.stringify(err, null, 2));
    res.status(500).json({ 
      error: err.error?.description || err.message || "Razorpay order creation failed" 
    });
  }
});

// Verify payment signature after checkout
router.post("/verify", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "YOUR_SECRET";
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Razorpay verify error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
