const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

const {google} = require("googleapis");

app.get("/oauth2callback", async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send("Authorization code is missing.");
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost:4000/oauth2callback"
    );
    
 const { tokens } = await oauth2Client.getToken(code);
 console.log("\n==============================");
    console.log("REFRESH TOKEN:");
    console.log(tokens.refresh_token);
    console.log("==============================\n");
    res.send("Google authorization successful. Check your terminal.");
  } catch (error) {
    console.error(
      "OAuth Error:",
      error.response?.data || error.message
    );
    res.status(500).send("OAuth authorization failed");
  }
});


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
