const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

const PORT = process.env.PORT || 4000;

// ==============================
// MIDDLEWARE
// ==============================

app.use(cors({ origin: "*" }));

app.use(express.json());

// ==============================
// API ROUTES
// ==============================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/categories", categoryRoutes);

// ==============================
// PRODUCT IMAGES
// ==============================

app.use("/images", express.static(path.join(__dirname, "uploads/products")));

// ==============================
// CATEGORY IMAGES
// ==============================

app.use(
  "/category-images",
  express.static(
    path.join(__dirname, "uploads/categories")
  )
);

// ==============================
// TEST
// ==============================

app.get("/", (req, res) => {
  res.send("Apple Blossom Server Running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
