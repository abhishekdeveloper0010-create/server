const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// GET all products
router.get("/", productController.getAllProducts);

// GET single product
router.get("/:id", productController.getProductById);

// CREATE product (admin only)
router.post("/", authenticate, authorize("admin"), productController.createProduct);

// UPDATE product (admin only)
router.put("/:id", authenticate, authorize("admin"), productController.updateProduct);

// DELETE product (admin only)
router.delete("/:id", authenticate, authorize("admin"), productController.deleteProduct);

module.exports = router;