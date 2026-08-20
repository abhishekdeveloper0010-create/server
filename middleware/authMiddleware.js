const jwt = require("jsonwebtoken");

// ==========================================
// AUTHENTICATE
// ==========================================

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not found",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "defaultsecret"
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ==========================================
// AUTHORIZE
// ==========================================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User authentication required",
        });
      }

      const userRole =
        req.user.role ||
        req.user.userRole ||
        req.user.user_role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      console.error("AUTHORIZE ERROR:", error);

      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
  };
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  authenticate,
  authorize,
};