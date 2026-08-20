const express = require("express");

const router = express.Router();

const productController = require("../controllers/productController");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

// =====================================================
// GET ALL PRODUCTS
// =====================================================

router.get(
  "/",
  productController.getAllProducts
);

// =====================================================
// GET SINGLE PRODUCT
// IMPORTANT:
// This must come after "/" and before admin routes
// =====================================================

router.get(
  "/:id",
  productController.getProductById
);

// =====================================================
// CREATE PRODUCT
// ADMIN ONLY
// =====================================================

router.post(
  "/",
  authenticate,
  authorize("admin"),
  productController.createProduct
);

// =====================================================
// UPDATE PRODUCT
// ADMIN ONLY
// =====================================================

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.updateProduct
);

// =====================================================
// DELETE PRODUCT
// ADMIN ONLY
// =====================================================

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.deleteProduct
);

module.exports = router;