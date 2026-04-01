const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// ✅ MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/foodapp")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ CONNECT ROUTES 
const authRoutes = require("./routes/auth.js");
app.use("/api/auth", authRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});