const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");

// =====================================================
// REGISTER
// POST /api/auth/register
// =====================================================

router.post(
  "/register",
  authController.register
);

// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

router.post(
  "/login",
  authController.login
);

// =====================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// =====================================================

router.post(
  "/forgot-password",
  authController.forgotPassword
);

// =====================================================
// RESET PASSWORD
// POST /api/auth/reset-password/:token
// =====================================================

router.post(
  "/reset-password/:token",
  authController.resetPassword
);

module.exports = router;