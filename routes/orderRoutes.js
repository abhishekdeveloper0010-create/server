const express = require("express");

const router = express.Router();

// =====================================================
// CONTROLLER
// =====================================================

const {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  returnOrderItem,
} = require("../controllers/orderController");

// =====================================================
// AUTH
// =====================================================

const {
  authenticate,
} = require("../middleware/authMiddleware");

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

router.post(
  "/",
  authenticate,
  placeOrder
);

// =====================================================
// GET MY ORDERS
// GET /api/orders/my-orders
// =====================================================

router.get(
  "/my-orders",
  authenticate,
  getMyOrders
);

// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

router.get(
  "/:id",
  authenticate,
  getOrder
);

// =====================================================
// CANCEL ORDER
// POST /api/orders/:id/cancel
// =====================================================

router.post(
  "/:id/cancel",
  authenticate,
  cancelOrder
);

// =====================================================
// RETURN ORDER ITEM
// POST /api/orders/:orderId/items/:itemId/return
// =====================================================

router.post(
  "/:orderId/items/:itemId/return",
  authenticate,
  returnOrderItem
);

module.exports = router;