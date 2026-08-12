const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: "Shirts",
        image: "shirts.png",
      },
      {
        id: 2,
        name: "Dresses",
        image: "dresses.png",
      },
      {
        id: 3,
        name: "Beauty",
        image: "beauty.png",
      },
      {
        id: 4,
        name: "Bangles",
        image: "bangles.png",
      },
      {
        id: 5,
        name: "Shoes",
        image: "shoes.png",
      },
      {
        id: 6,
        name: "Slippers",
        image: "slippers.png",
      },
    ],
  });
});

module.exports = router;