const db = require("../config/db");

// =====================================================
// PROMISE DB
// =====================================================

const promiseDb =
  typeof db.promise === "function"
    ? db.promise()
    : db;

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (
  connection,
  {
    orderNumber,
    userId,
    status = "Order Placed",
    expectedDeliveryDate = null,
    subtotal = 0,
    deliveryCharge = 0,
    totalAmount = 0,
    paymentMethod,
    addressId,
  }
) => {
  const conn =
    connection &&
    typeof connection.execute === "function"
      ? connection
      : promiseDb;

  const [result] = await conn.execute(
    `
      INSERT INTO orders
      (
        order_number,
        user_id,
        status,
        expected_delivery_date,
        subtotal,
        delivery_charge,
        total_amount,
        payment_method,
        address_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      orderNumber,
      userId,
      status,
      expectedDeliveryDate || null,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod || null,
      addressId || null,
    ]
  );

  return result.insertId;
};

// =====================================================
// CREATE ORDER ITEM
// =====================================================

const createOrderItem = async (
  connection,
  {
    orderId,
    productId,
    productName,
    productImage,
    price,
    quantity = 1,
    size,
    color,
  }
) => {
  const conn =
    connection &&
    typeof connection.execute === "function"
      ? connection
      : promiseDb;

  const [result] = await conn.execute(
    `
      INSERT INTO order_items
      (
        order_id,
        product_id,
        product_name,
        product_image,
        price,
        quantity,
        size,
        color,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      orderId,
      productId,
      productName,
      productImage || null,
      price,
      quantity,
      size || null,
      color || null,
      "Order Placed",
    ]
  );

  return result.insertId;
};

// =====================================================
// CREATE STATUS HISTORY
// =====================================================

const createStatusHistory = async (
  connection,
  {
    orderId,
    status,
    message,
  }
) => {
  const conn =
    connection &&
    typeof connection.execute === "function"
      ? connection
      : promiseDb;

  await conn.execute(
    `
      INSERT INTO order_status_history
      (
        order_id,
        status,
        message
      )
      VALUES (?, ?, ?)
    `,
    [
      orderId,
      status,
      message || null,
    ]
  );
};

// =====================================================
// GET USER ORDERS
// =====================================================

const getUserOrders = async (userId) => {
  // ===================================================
  // ORDERS
  // ===================================================

  const [orders] = await promiseDb.execute(
    `
      SELECT
        o.id,
        o.order_number,
        o.user_id,
        o.status,
        o.expected_delivery_date,
        o.subtotal,
        o.delivery_charge,
        o.total_amount,
        o.payment_method,
        o.address_id,
        o.cancellation_reason,
        o.cancelled_at,
        o.created_at,
        o.updated_at,

        a.id AS saved_address_id,
        a.full_name,
        a.email,
        a.phone,
        a.address_line,
        a.city,
        a.state,
        a.pincode,
        a.country

      FROM orders o

      LEFT JOIN addresses a
        ON o.address_id = a.id

      WHERE o.user_id = ?

      ORDER BY
        o.created_at DESC
    `,
    [userId]
  );

  // ===================================================
  // NO ORDERS
  // ===================================================

  if (!orders || orders.length === 0) {
    return [];
  }

  // ===================================================
  // ORDER IDS
  // ===================================================

  const orderIds = orders.map(
    (order) => order.id
  );

  const placeholders = orderIds
    .map(() => "?")
    .join(",");

  // ===================================================
  // ITEMS
  // ===================================================

  const [items] = await promiseDb.execute(
    `
      SELECT
        id,
        order_id,
        product_id,
        product_name,
        product_image,
        price,
        quantity,
        size,
        color,
        status,
        rma_requested,
        rma_reason,
        rma_status,
        rma_requested_at,
        return_pickup_date,
        returned_at,
        refund_amount,
        created_at

      FROM order_items

      WHERE order_id IN (${placeholders})

      ORDER BY id ASC
    `,
    orderIds
  );

  // ===================================================
  // STATUS HISTORY
  // ===================================================

  const [history] = await promiseDb.execute(
    `
      SELECT
        id,
        order_id,
        status,
        message,
        created_at

      FROM order_status_history

      WHERE order_id IN (${placeholders})

      ORDER BY
        created_at ASC,
        id ASC
    `,
    orderIds
  );

  // ===================================================
  // FORMAT ORDERS
  // ===================================================

  const formattedOrders = orders.map(
    (order) => {
      // =================================================
      // ORDER ITEMS
      // =================================================

      const orderItems = items
        .filter(
          (item) =>
            Number(item.order_id) ===
            Number(order.id)
        )
        .map(
          (item) => ({
            id: item.id,

            orderId:
              item.order_id,

            order_id:
              item.order_id,

            productId:
              item.product_id,

            product_id:
              item.product_id,

            name:
              item.product_name,

            productName:
              item.product_name,

            product_name:
              item.product_name,

            image:
              item.product_image,

            productImage:
              item.product_image,

            product_image:
              item.product_image,

            price:
              Number(item.price || 0),

            quantity:
              Number(item.quantity || 1),

            size:
              item.size || "",

            color:
              item.color || "",

            status:
              item.status ||
              order.status ||
              "Order Placed",

            rmaRequested:
              Boolean(
                item.rma_requested
              ),

            rmaReason:
              item.rma_reason || "",

            rmaStatus:
              item.rma_status || "",

            rmaRequestedAt:
              item.rma_requested_at || "",

            returnPickupDate:
              item.return_pickup_date || "",

            returnedAt:
              item.returned_at || "",

            refundAmount:
              item.refund_amount !== null
                ? Number(
                    item.refund_amount
                  )
                : null,

            createdAt:
              item.created_at,

            created_at:
              item.created_at,
          })
        );

      // =================================================
      // ORDER HISTORY
      // =================================================

      const orderHistory = history
        .filter(
          (entry) =>
            Number(entry.order_id) ===
            Number(order.id)
        )
        .map(
          (entry) => ({
            id:
              entry.id,

            orderId:
              entry.order_id,

            order_id:
              entry.order_id,

            status:
              entry.status,

            message:
              entry.message || "",

            createdAt:
              entry.created_at,

            created_at:
              entry.created_at,

            // Frontend can format this as:
            // 28 August
            date:
              entry.created_at,
          })
        );

      // =================================================
      // RETURN ORDER
      // =================================================

      return {
        id:
          order.id,

        orderNumber:
          order.order_number,

        order_number:
          order.order_number,

        userId:
          order.user_id,

        user_id:
          order.user_id,

        // =================================================
        // STATUS
        // =================================================

        status:
          order.status ||
          "Order Placed",

        // =================================================
        // EXPECTED DELIVERY
        // =================================================

        expectedDeliveryDate:
          order.expected_delivery_date || null,

        expected_delivery_date:
          order.expected_delivery_date || null,

        // =================================================
        // AMOUNTS
        // =================================================

        subtotal:
          Number(
            order.subtotal || 0
          ),

        deliveryCharge:
          Number(
            order.delivery_charge || 0
          ),

        delivery_charge:
          Number(
            order.delivery_charge || 0
          ),

        total:
          Number(
            order.total_amount || 0
          ),

        totalAmount:
          Number(
            order.total_amount || 0
          ),

        total_amount:
          Number(
            order.total_amount || 0
          ),

        // =================================================
        // PAYMENT
        // =================================================

        paymentMethod:
          order.payment_method ||
          "Not specified",

        payment_method:
          order.payment_method ||
          "Not specified",

        // =================================================
        // ADDRESS ID
        // =================================================

        addressId:
          order.address_id,

        address_id:
          order.address_id,

        // =================================================
        // DATES
        // =================================================

        placedAt:
          order.created_at,

        createdAt:
          order.created_at,

        created_at:
          order.created_at,

        updatedAt:
          order.updated_at,

        updated_at:
          order.updated_at,

        // =================================================
        // CANCEL
        // =================================================

        cancelledAt:
          order.cancelled_at || "",

        cancellationReason:
          order.cancellation_reason || "",

        // =================================================
        // ADDRESS
        // =================================================

        address:
          order.address_line || "",

        address_line:
          order.address_line || "",

        fullName:
          order.full_name || "",

        full_name:
          order.full_name || "",

        email:
          order.email || "",

        phone:
          order.phone || "",

        city:
          order.city || "",

        state:
          order.state || "",

        pincode:
          order.pincode || "",

        pin:
          order.pincode || "",

        country:
          order.country || "",

        // =================================================
        // ADDRESS DETAILS
        // =================================================

        addressDetails:
          order.saved_address_id
            ? {
                id:
                  order.saved_address_id,

                full_name:
                  order.full_name,

                email:
                  order.email,

                phone:
                  order.phone,

                address_line:
                  order.address_line,

                city:
                  order.city,

                state:
                  order.state,

                pincode:
                  order.pincode,

                country:
                  order.country,
              }
            : null,

        // =================================================
        // ITEMS
        // =================================================

        items:
          orderItems,

        // =================================================
        // STATUS HISTORY
        // =================================================

        history:
          orderHistory,
      };
    }
  );

  return formattedOrders;
};

// =====================================================
// GET SINGLE ORDER
// =====================================================

const getUserOrderById = async (
  userId,
  orderId
) => {
  // ===================================================
  // ORDER
  // ===================================================

  const [orders] =
    await promiseDb.execute(
      `
        SELECT
          o.id,
          o.order_number,
          o.user_id,
          o.status,
          o.expected_delivery_date,
          o.subtotal,
          o.delivery_charge,
          o.total_amount,
          o.payment_method,
          o.address_id,
          o.cancellation_reason,
          o.cancelled_at,
          o.created_at,
          o.updated_at,

          a.id AS saved_address_id,
          a.full_name,
          a.email,
          a.phone,
          a.address_line,
          a.city,
          a.state,
          a.pincode,
          a.country

        FROM orders o

        LEFT JOIN addresses a
          ON o.address_id = a.id

        WHERE
          o.id = ?
          AND o.user_id = ?

        LIMIT 1
      `,
      [
        orderId,
        userId,
      ]
    );

  // ===================================================
  // ORDER NOT FOUND
  // ===================================================

  if (
    !orders ||
    orders.length === 0
  ) {
    return null;
  }

  const order =
    orders[0];

  // ===================================================
  // ITEMS
  // ===================================================

  const [items] =
    await promiseDb.execute(
      `
        SELECT
          id,
          order_id,
          product_id,
          product_name,
          product_image,
          price,
          quantity,
          size,
          color,
          status,
          rma_requested,
          rma_reason,
          rma_status,
          rma_requested_at,
          return_pickup_date,
          returned_at,
          refund_amount,
          created_at

        FROM order_items

        WHERE order_id = ?

        ORDER BY id ASC
      `,
      [orderId]
    );

  // ===================================================
  // HISTORY
  // ===================================================

  const [history] =
    await promiseDb.execute(
      `
        SELECT
          id,
          order_id,
          status,
          message,
          created_at

        FROM order_status_history

        WHERE order_id = ?

        ORDER BY
          created_at ASC,
          id ASC
      `,
      [orderId]
    );

  // ===================================================
  // FORMAT ITEMS
  // ===================================================

  const formattedItems =
    items.map(
      (item) => ({
        id:
          item.id,

        orderId:
          item.order_id,

        order_id:
          item.order_id,

        productId:
          item.product_id,

        product_id:
          item.product_id,

        name:
          item.product_name,

        productName:
          item.product_name,

        product_name:
          item.product_name,

        image:
          item.product_image,

        productImage:
          item.product_image,

        product_image:
          item.product_image,

        price:
          Number(
            item.price || 0
          ),

        quantity:
          Number(
            item.quantity || 1
          ),

        size:
          item.size || "",

        color:
          item.color || "",

        status:
          item.status ||
          order.status ||
          "Order Placed",

        rmaRequested:
          Boolean(
            item.rma_requested
          ),

        rmaReason:
          item.rma_reason || "",

        rmaStatus:
          item.rma_status || "",

        rmaRequestedAt:
          item.rma_requested_at || "",

        returnPickupDate:
          item.return_pickup_date || "",

        returnedAt:
          item.returned_at || "",

        refundAmount:
          item.refund_amount !== null
            ? Number(
                item.refund_amount
              )
            : null,

        createdAt:
          item.created_at,

        created_at:
          item.created_at,
      })
    );

  // ===================================================
  // FORMAT HISTORY
  // ===================================================

  const formattedHistory =
    history.map(
      (entry) => ({
        id:
          entry.id,

        orderId:
          entry.order_id,

        order_id:
          entry.order_id,

        status:
          entry.status,

        message:
          entry.message || "",

        createdAt:
          entry.created_at,

        created_at:
          entry.created_at,

        // Raw date available
        // Frontend will show only:
        // 28 August
        date:
          entry.created_at,
      })
    );

  // ===================================================
  // RETURN ORDER
  // ===================================================

  return {
    id:
      order.id,

    orderNumber:
      order.order_number,

    order_number:
      order.order_number,

    userId:
      order.user_id,

    user_id:
      order.user_id,

    // =================================================
    // STATUS
    // =================================================

    status:
      order.status ||
      "Order Placed",

    // =================================================
    // EXPECTED DELIVERY
    // =================================================

    expectedDeliveryDate:
      order.expected_delivery_date || null,

    expected_delivery_date:
      order.expected_delivery_date || null,

    // =================================================
    // AMOUNTS
    // =================================================

    subtotal:
      Number(
        order.subtotal || 0
      ),

    deliveryCharge:
      Number(
        order.delivery_charge || 0
      ),

    delivery_charge:
      Number(
        order.delivery_charge || 0
      ),

    total:
      Number(
        order.total_amount || 0
      ),

    totalAmount:
      Number(
        order.total_amount || 0
      ),

    total_amount:
      Number(
        order.total_amount || 0
      ),

    // =================================================
    // PAYMENT
    // =================================================

    paymentMethod:
      order.payment_method ||
      "Not specified",

    payment_method:
      order.payment_method ||
      "Not specified",

    // =================================================
    // ADDRESS
    // =================================================

    addressId:
      order.address_id,

    address_id:
      order.address_id,

    address:
      order.saved_address_id
        ? {
            id:
              order.saved_address_id,

            full_name:
              order.full_name,

            email:
              order.email,

            phone:
              order.phone,

            address_line:
              order.address_line,

            city:
              order.city,

            state:
              order.state,

            pincode:
              order.pincode,

            country:
              order.country,
          }
        : null,

    // =================================================
    // DATES
    // =================================================

    placedAt:
      order.created_at,

    createdAt:
      order.created_at,

    created_at:
      order.created_at,

    updatedAt:
      order.updated_at,

    updated_at:
      order.updated_at,

    // =================================================
    // CANCEL
    // =================================================

    cancelledAt:
      order.cancelled_at || "",

    cancellationReason:
      order.cancellation_reason || "",

    // =================================================
    // ITEMS
    // =================================================

    items:
      formattedItems,

    // =================================================
    // STATUS HISTORY
    // =================================================

    history:
      formattedHistory,
  };
};

// =====================================================
// REQUEST RETURN
// =====================================================

const requestReturn = async (
  connection,
  {
    userId,
    orderId,
    itemId,
    reason,
  }
) => {
  const conn =
    connection &&
    typeof connection.execute === "function"
      ? connection
      : promiseDb;

  // ===================================================
  // FIND ITEM
  // ===================================================

  const [items] =
    await conn.execute(
      `
        SELECT
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.product_name,
          oi.price,
          oi.quantity,
          oi.status,
          oi.rma_requested,
          oi.rma_status

        FROM order_items oi

        INNER JOIN orders o
          ON oi.order_id = o.id

        WHERE
          oi.id = ?
          AND oi.order_id = ?
          AND o.user_id = ?

        LIMIT 1
      `,
      [
        itemId,
        orderId,
        userId,
      ]
    );

  // ===================================================
  // ITEM NOT FOUND
  // ===================================================

  if (
    !items ||
    items.length === 0
  ) {
    throw new Error(
      "Order item not found"
    );
  }

  const item =
    items[0];

  // ===================================================
  // ONLY DELIVERED
  // ===================================================

  if (
    item.status !== "Delivered"
  ) {
    throw new Error(
      "Only delivered products can be returned"
    );
  }

  // ===================================================
  // ALREADY REQUESTED
  // ===================================================

  if (
    Number(
      item.rma_requested
    ) === 1 ||
    item.rma_status
  ) {
    throw new Error(
      "Return request already submitted for this product"
    );
  }

  // ===================================================
  // UPDATE ITEM
  // ===================================================

  await conn.execute(
    `
      UPDATE order_items

      SET
        rma_requested = 1,
        rma_reason = ?,
        rma_status = 'Requested',
        rma_requested_at = NOW()

      WHERE
        id = ?
        AND order_id = ?
    `,
    [
      reason,
      itemId,
      orderId,
    ]
  );

  // ===================================================
  // STATUS HISTORY
  // ===================================================

  await conn.execute(
    `
      INSERT INTO order_status_history
      (
        order_id,
        status,
        message
      )
      VALUES (?, ?, ?)
    `,
    [
      orderId,
      "Return Requested",
      `Return requested for ${item.product_name}. Reason: ${reason}`,
    ]
  );

  // ===================================================
  // RETURN RESULT
  // ===================================================

  return {
    itemId:
      item.id,

    orderId:
      item.order_id,

    productId:
      item.product_id,

    productName:
      item.product_name,

    rmaStatus:
      "Requested",
  };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  createOrder,
  createOrderItem,
  createStatusHistory,
  getUserOrders,
  getUserOrderById,
  requestReturn,
};