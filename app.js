const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.send("Apple Blossom Server Running");
});

app.listen(process.env.PORT, ()=>{
    console.log(`Server running on ${process.env.PORT}`);
});


const productRoutes = require("./routes/productRoutes");

app.use("/api/products", productRoutes);