const db = require("../config/db");

const {
  createOrder,
  createOrderItem,
  createStatusHistory,
  getUserOrders,
  getUserOrderById,
  requestReturn,
} = require("../models/orderModel");
// =====================================================
// HELPER: GET USER ID
// =====================================================

const getUserId = (req) => {
  return req.user?.id || req.user?.user_id || null;
};

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

exports.placeOrder = async (req, res) => {
  let connection;

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const {
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      total,
      paymentMethod,
      addressId,
      address_id,
    } = req.body;

    // ===================================================
    // VALIDATE ITEMS
    // ===================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // ===================================================
    // ADDRESS
    // ===================================================

    const finalAddressId =
      addressId || address_id || null;

    // ===================================================
    // AMOUNTS
    // ===================================================

    const finalSubtotal = Number(subtotal || 0);

    const finalDeliveryCharge =
      Number(deliveryCharge || 0);

    const finalTotalAmount =
      Number(
        totalAmount ??
          total ??
          finalSubtotal + finalDeliveryCharge
      );

    // ===================================================
    // PAYMENT
    // ===================================================

    const finalPaymentMethod =
      paymentMethod || "COD";

    // ===================================================
    // ORDER NUMBER
    // ===================================================

    const orderNumber =
      `AB-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    // ===================================================
    // GET CONNECTION
    // ===================================================

    connection = await new Promise(
      (resolve, reject) => {
        db.getConnection(
          (error, conn) => {
            if (error) {
              reject(error);
            } else {
              resolve(conn);
            }
          }
        );
      }
    );

    // ===================================================
    // START TRANSACTION
    // ===================================================

    await connection.beginTransaction();

    // ===================================================
    // CREATE ORDER
    // ===================================================

    const orderId = await createOrder(
      connection,
      {
        orderNumber,
        userId,
        status: "Order Placed",
        subtotal: finalSubtotal,
        deliveryCharge:
          finalDeliveryCharge,
        totalAmount:
          finalTotalAmount,
        paymentMethod:
          finalPaymentMethod,
        addressId:
          finalAddressId,
      }
    );

    // ===================================================
    // CREATE ORDER ITEMS
    // ===================================================

    for (const item of items) {
      const productId =
        item.productId ||
        item.product_id ||
        item.id ||
        null;

      const productName =
        item.productName ||
        item.product_name ||
        item.name ||
        item.title ||
        "Product";

      const productImage =
        item.productImage ||
        item.product_image ||
        item.image ||
        item.imageUrl ||
        item.image_url ||
        null;

      const price = Number(
        item.price ||
          item.currentPrice ||
          item.current_price ||
          item.amount ||
          0
      );

      const quantity = Number(
        item.quantity ||
          item.qty ||
          1
      );

      const size =
        item.size || null;

      const color =
        item.color || null;

      await createOrderItem(
        connection,
        {
          orderId,
          productId,
          productName,
          productImage,
          price,
          quantity,
          size,
          color,
        }
      );
    }

    // ===================================================
    // CREATE STATUS HISTORY
    // ===================================================

    await createStatusHistory(
      connection,
      {
        orderId,
        status: "Order Placed",
        message:
          "Your order has been successfully placed.",
      }
    );

    // ===================================================
    // COMMIT
    // ===================================================

    await connection.commit();

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully",
      order: {
        id: orderId,
        orderNumber,
        order_number: orderNumber,
        userId,
        user_id: userId,
        status: "Order Placed",
        subtotal: finalSubtotal,
        deliveryCharge:
          finalDeliveryCharge,
        total:
          finalTotalAmount,
        totalAmount:
          finalTotalAmount,
        paymentMethod:
          finalPaymentMethod,
        addressId:
          finalAddressId,
      },
    });
  } catch (error) {
    // ===================================================
    // ROLLBACK
    // ===================================================

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "PLACE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// GET MY ORDERS
// GET /api/orders/my-orders
// =====================================================
 

exports.getMyOrders = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id;

    console.log(
      "================================="
    );

    console.log(
      "GET MY ORDERS USER ID:",
      userId
    );

    console.log(
      "================================="
    );

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const orders =
      await getUserOrders(userId);

    console.log(
      "ORDERS RETURNED TO CONTROLLER:",
      orders.length
    );

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "GET MY ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load orders",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

exports.getOrder = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id;

    const orderId = Number(
      req.params.id
    );

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order =
      await getUserOrderById(
        userId,
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET SINGLE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load order",
      error: error.message,
    });
  }
};
// =====================================================
// CANCEL ORDER
// POST /api/orders/:id/cancel
// =====================================================

exports.cancelOrder = async (
  req,
  res
) => {
  let connection;

  try {
    const userId = getUserId(req);

    const orderId = Number(
      req.params.id
    );

    const reason =
      req.body?.reason ||
      req.body?.cancellationReason ||
      "Changed my mind";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // ===================================================
    // GET ORDER
    // ===================================================

    const order =
      await getUserOrderById(
        userId,
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ===================================================
    // CHECK STATUS
    // ===================================================

    const nonCancelableStatuses = [
      "Cancelled",
      "Delivered",
      "Shipped",
      "Out for Delivery",
      "Return Requested",
    ];

    if (
      nonCancelableStatuses.includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Order cannot be cancelled when status is "${order.status}"`,
      });
    }

    // ===================================================
    // CONNECTION
    // ===================================================

    connection = await new Promise(
      (resolve, reject) => {
        db.getConnection(
          (error, conn) => {
            if (error) {
              reject(error);
            } else {
              resolve(conn);
            }
          }
        );
      }
    );

    await connection.beginTransaction();

    // ===================================================
    // UPDATE ORDER
    // ===================================================

    await connection.execute(
      `
        UPDATE orders
        SET
          status = 'Cancelled',
          cancellation_reason = ?,
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
        AND user_id = ?
      `,
      [
        reason,
        orderId,
        userId,
      ]
    );

    // ===================================================
    // UPDATE ITEMS
    // ===================================================

    await connection.execute(
      `
        UPDATE order_items
        SET status = 'Cancelled'
        WHERE order_id = ?
      `,
      [orderId]
    );

    // ===================================================
    // HISTORY
    // ===================================================

    await createStatusHistory(
      connection,
      {
        orderId,
        status: "Cancelled",
        message:
          `Order cancelled by customer. Reason: ${reason}`,
      }
    );

    await connection.commit();

    return res.json({
      success: true,
      message:
        "Order cancelled successfully",
      orderId,
      status: "Cancelled",
      cancellationReason:
        reason,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "CANCEL ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to cancel order",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// RETURN ORDER ITEM
// POST /api/orders/:orderId/items/:itemId/return
// =====================================================

exports.returnOrderItem = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id;

    const orderId = Number(
      req.params.orderId
    );

    const itemId = Number(
      req.params.itemId
    );

    const {
      reason,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    if (!orderId || !itemId) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order or item ID",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Return reason is required",
      });
    }

    const result =
      await requestReturn(null, {
        userId,
        orderId,
        itemId,
        reason,
      });

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully",
      returnRequest: result,
    });
  } catch (error) {
    console.error(
      "RETURN ORDER ITEM ERROR:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to request return",
    });
  }
};