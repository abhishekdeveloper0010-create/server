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
  return (
    req.user?.id ||
    req.user?.user_id ||
    req.user?.userId ||
    null
  );
};

// =====================================================
// HELPER: EXPECTED DELIVERY DATE
// Default: 8 days from order date
// Example:
// Order Placed: 20 August
// Expected Delivery: 28 August
// =====================================================

const getExpectedDeliveryDate = () => {
  const date = new Date();

  date.setDate(date.getDate() + 8);

  return date.toISOString().split("T")[0];
};

// =====================================================
// HELPER: FORMAT DATE ONLY
// YYYY-MM-DD -> 28 August
// =====================================================

const formatDateOnly = (date) => {
  if (!date) return null;

  const d = new Date(date);

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
};

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

exports.placeOrder = async (req, res) => {
  let connection;

  try {
    // =================================================
    // USER
    // =================================================

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // =================================================
    // BODY
    // =================================================

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

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // =================================================
    // ADDRESS
    // =================================================

    const finalAddressId =
      addressId ||
      address_id ||
      null;

    // =================================================
    // AMOUNTS
    // =================================================

    const finalSubtotal =
      Number(subtotal || 0);

    const finalDeliveryCharge =
      Number(deliveryCharge || 0);

    const finalTotalAmount =
      Number(
        totalAmount ??
        total ??
        finalSubtotal + finalDeliveryCharge
      );

    // =================================================
    // PAYMENT
    // =================================================

    const finalPaymentMethod =
      paymentMethod || "COD";

    // =================================================
    // ORDER NUMBER
    // =================================================

    const orderNumber =
      `AB-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    // =================================================
    // EXPECTED DELIVERY DATE
    // =================================================

    const expectedDeliveryDate =
      getExpectedDeliveryDate();

    // =================================================
    // DATABASE CONNECTION
    // =================================================

    connection = db.promise();

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // CREATE ORDER
    // =================================================

    const orderId = await createOrder(
      connection,
      {
        orderNumber,
        userId,

        status: "Order Placed",

        expectedDeliveryDate,

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

    // =================================================
    // CREATE ORDER ITEMS
    // =================================================

    for (const item of items) {
      const productId =
        item.productId ??
        item.product_id ??
        item.id ??
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

      const price =
        Number(
          item.price ??
          item.currentPrice ??
          item.current_price ??
          item.amount ??
          0
        );

      const quantity =
        Number(
          item.quantity ??
          item.qty ??
          1
        );

      const size =
        item.size || null;

      const color =
        item.color || null;

      // -----------------------------------------------
      // BASIC VALIDATION
      // -----------------------------------------------

      if (!productId) {
        throw new Error(
          "Product ID is required"
        );
      }

      if (quantity <= 0) {
        throw new Error(
          "Product quantity must be greater than 0"
        );
      }

      if (price < 0) {
        throw new Error(
          "Product price cannot be negative"
        );
      }

      // -----------------------------------------------
      // CREATE ITEM
      // -----------------------------------------------

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

    // =================================================
    // STATUS HISTORY
    // =================================================

    await createStatusHistory(
      connection,
      {
        orderId,

        status:
          "Order Placed",

        message:
          "Your order has been successfully placed.",
      }
    );

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully",

      order: {
        id: orderId,

        orderNumber:
          orderNumber,

        order_number:
          orderNumber,

        userId:
          userId,

        user_id:
          userId,

        status:
          "Order Placed",

        subtotal:
          finalSubtotal,

        deliveryCharge:
          finalDeliveryCharge,

        delivery_charge:
          finalDeliveryCharge,

        total:
          finalTotalAmount,

        totalAmount:
          finalTotalAmount,

        total_amount:
          finalTotalAmount,

        paymentMethod:
          finalPaymentMethod,

        payment_method:
          finalPaymentMethod,

        addressId:
          finalAddressId,

        address_id:
          finalAddressId,

        // ---------------------------------------------
        // EXPECTED DELIVERY
        // ---------------------------------------------

        expectedDeliveryDate:
          expectedDeliveryDate,

        expected_delivery_date:
          expectedDeliveryDate,

        expectedDeliveryDateFormatted:
          formatDateOnly(
            expectedDeliveryDate
          ),
      },
    });
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

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

      message:
        "Failed to place order",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET MY ORDERS
// GET /api/orders/my-orders
// =====================================================

exports.getMyOrders = async (
  req,
  res
) => {
  try {
    // =================================================
    // USER
    // =================================================

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "User authentication required",
      });
    }

    // =================================================
    // GET ORDERS
    // =================================================

    const orders =
      await getUserOrders(
        userId
      );

    // =================================================
    // RESPONSE
    // =================================================

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

      message:
        "Failed to load orders",

      error:
        error.message,
    });
  }
};

// =====================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// =====================================================

exports.getOrder = async (
  req,
  res
) => {
  try {
    // =================================================
    // USER
    // =================================================

    const userId =
      getUserId(req);

    // =================================================
    // ORDER ID
    // =================================================

    const orderId =
      Number(req.params.id);

    // =================================================
    // VALIDATE USER
    // =================================================

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "User authentication required",
      });
    }

    // =================================================
    // VALIDATE ORDER
    // =================================================

    if (
      !orderId ||
      Number.isNaN(orderId)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid order ID",
      });
    }

    // =================================================
    // GET ORDER
    // =================================================

    const order =
      await getUserOrderById(
        userId,
        orderId
      );

    // =================================================
    // NOT FOUND
    // =================================================

    if (!order) {
      return res.status(404).json({
        success: false,

        message:
          "Order not found",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

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

      error:
        error.message,
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
    // =================================================
    // USER
    // =================================================

    const userId =
      getUserId(req);

    // =================================================
    // ORDER ID
    // =================================================

    const orderId =
      Number(req.params.id);

    // =================================================
    // REASON
    // =================================================

    const reason =
      req.body?.reason ||
      req.body?.cancellationReason ||
      "Changed my mind";

    // =================================================
    // VALIDATE USER
    // =================================================

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "User authentication required",
      });
    }

    // =================================================
    // VALIDATE ORDER
    // =================================================

    if (
      !orderId ||
      Number.isNaN(orderId)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid order ID",
      });
    }

    // =================================================
    // GET ORDER
    // =================================================

    const order =
      await getUserOrderById(
        userId,
        orderId
      );

    // =================================================
    // ORDER NOT FOUND
    // =================================================

    if (!order) {
      return res.status(404).json({
        success: false,

        message:
          "Order not found",
      });
    }

    // =================================================
    // CANCELABLE STATUSES
    // =================================================

    const cancelableStatuses = [
      "Order Placed",
      "Confirmed",
      "Packed",
    ];

    // =================================================
    // CANCEL RULE
    // =================================================

    if (
      !cancelableStatuses.includes(
        order.status
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          `Order cannot be cancelled when status is "${order.status}"`,
      });
    }

    // =================================================
    // DATABASE
    // =================================================

    connection =
      db.promise();

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // UPDATE ORDER
    // =================================================

    const [orderUpdate] =
      await connection.execute(
        `
          UPDATE orders
          SET
            status = 'Cancelled',
            cancellation_reason = ?,
            cancelled_at = NOW(),
            updated_at = NOW()
          WHERE
            id = ?
            AND user_id = ?
        `,
        [
          reason,
          orderId,
          userId,
        ]
      );

    // =================================================
    // VERIFY UPDATE
    // =================================================

    if (
      orderUpdate.affectedRows === 0
    ) {
      throw new Error(
        "Order could not be cancelled"
      );
    }

    // =================================================
    // UPDATE ITEMS
    // =================================================

    await connection.execute(
      `
        UPDATE order_items
        SET
          status = 'Cancelled'
        WHERE
          order_id = ?
      `,
      [orderId]
    );

    // =================================================
    // STATUS HISTORY
    // =================================================

    await createStatusHistory(
      connection,
      {
        orderId,

        status:
          "Cancelled",

        message:
          `Order cancelled by customer. Reason: ${reason}`,
      }
    );

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Order cancelled successfully",

      orderId,

      status:
        "Cancelled",

      cancellationReason:
        reason,
    });
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

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

      error:
        error.message,
    });
  }
};

// =====================================================
// RETURN ITEM
// POST /api/orders/:orderId/items/:itemId/return
// =====================================================

exports.returnOrderItem = async (
  req,
  res
) => {
  let connection;

  try {
    // =================================================
    // USER
    // =================================================

    const userId =
      getUserId(req);

    // =================================================
    // IDS
    // =================================================

    const orderId =
      Number(
        req.params.orderId
      );

    const itemId =
      Number(
        req.params.itemId
      );

    // =================================================
    // REASON
    // =================================================

    const reason =
      req.body?.reason?.trim();

    // =================================================
    // VALIDATE USER
    // =================================================

    if (!userId) {
      return res.status(401).json({
        success: false,

        message:
          "User authentication required",
      });
    }

    // =================================================
    // VALIDATE IDS
    // =================================================

    if (
      !orderId ||
      Number.isNaN(orderId) ||
      !itemId ||
      Number.isNaN(itemId)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid order or item ID",
      });
    }

    // =================================================
    // VALIDATE REASON
    // =================================================

    if (!reason) {
      return res.status(400).json({
        success: false,

        message:
          "Return reason is required",
      });
    }

    // =================================================
    // DATABASE CONNECTION
    // =================================================

    connection =
      db.promise();

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // REQUEST RETURN
    // =================================================

    const result =
      await requestReturn(
        connection,
        {
          userId,

          orderId,

          itemId,

          reason,
        }
      );

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      message:
        "Return request submitted successfully",

      returnRequest:
        result,
    });
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

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

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  placeOrder:
    exports.placeOrder,

  getMyOrders:
    exports.getMyOrders,

  getOrder:
    exports.getOrder,

  cancelOrder:
    exports.cancelOrder,

  returnOrderItem:
    exports.returnOrderItem,
};