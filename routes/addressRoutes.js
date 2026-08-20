const express = require("express");
const router = express.Router();

const addressController = require("../controllers/addressController");
const { authenticate } = require("../middleware/authMiddleware");

// ==============================
// CREATE ADDRESS
// POST /api/addresses
// ==============================

router.post(
  "/",
  authenticate,
  addressController.createAddress
);

// ==============================
// GET MY ADDRESSES
// GET /api/addresses
// ==============================

router.get(
  "/",
  authenticate,
  addressController.getMyAddresses
);

// ==============================
// GET SINGLE ADDRESS
// GET /api/addresses/:id
// ==============================

router.get(
  "/:id",
  authenticate,
  addressController.getSingleAddress
);

// ==============================
// UPDATE ADDRESS
// PUT /api/addresses/:id
// ==============================

router.put(
  "/:id",
  authenticate,
  addressController.updateMyAddress
);

// ==============================
// DELETE ADDRESS
// DELETE /api/addresses/:id
// ==============================

router.delete(
  "/:id",
  authenticate,
  addressController.deleteMyAddress
);

module.exports = router;