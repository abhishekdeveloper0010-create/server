const express = require("express");
const cors = require("cors");
const path =  require("path");

require("dotenv").config();

require("./config/db");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const { createUsersTable } = require("./models/userModel");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/images",express.static(path.join(__dirname, "uploads/products")));

createUsersTable();

app.get("/", (req, res) => {
    res.send("Apple Blossom Server Running");
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});