const db = require("../config/db");

// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getProducts = (callback) => {
  const sql = "SELECT * FROM products";

  db.query(sql, callback);
};

// =====================================================
// GET PRODUCTS PAGINATED + SEARCH + CATEGORY
// =====================================================

const getProductsPaginated = (
  page = 1,
  limit = 8,
  search = "",
  category = "",
  callback,
) => {
  const offset = (page - 1) * limit;

  let where = "";

  const values = [];

  // ===================================================
  // SEARCH
  // ===================================================

  if (search) {
    where += `
      WHERE
        title LIKE ?
        OR description LIKE ?
        OR category LIKE ?
        OR subcategory LIKE ?
        OR brand LIKE ?
    `;

    const searchValue = `%${search}%`;

    values.push(
      searchValue,
      searchValue,
      searchValue,
      searchValue,
      searchValue,
    );
  }

  // ===================================================
  // CATEGORY
  // ===================================================

  if (category) {
    if (where) {
      where += " AND category = ?";
    } else {
      where += " WHERE category = ?";
    }

    values.push(category);
  }

  // ===================================================
  // COUNT
  // ===================================================

  const countSql = `
    SELECT COUNT(*) AS total
    FROM products
    ${where}
  `;

  db.query(countSql, values, (countErr, countResults) => {
    if (countErr) {
      return callback(countErr);
    }

    const total =
      countResults && countResults[0] ? Number(countResults[0].total) : 0;

    // ================================================
    // PRODUCTS
    // ================================================

    const sql = `
        SELECT *
        FROM products
        ${where}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `;

    const productValues = [...values, Number(limit), Number(offset)];

    db.query(sql, productValues, (err, results) => {
      if (err) {
        return callback(err);
      }

      return callback(null, {
        results,
        total,
      });
    });
  });
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

const getProductById = (id, callback) => {
  const sql = "SELECT * FROM products WHERE id = ?";

  db.query(sql, [id], callback);
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = (productData, callback) => {
  const sql = `
    INSERT INTO products
    (
      title,
      description,
      price,
      oldPrice,
      offer,
      category,
      subcategory,
      brand,
      rating,
      inStock
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      productData.title,
      productData.description,
      productData.price,
      productData.oldPrice,
      productData.offer,
      productData.category,
      productData.subcategory,
      productData.brand,
      productData.rating,
      productData.inStock,
    ],
    callback,
  );
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

const updateProduct = (id, productData, callback) => {
  const sql = `
    UPDATE products
    SET
      title = ?,
      description = ?,
      price = ?,
      oldPrice = ?,
      offer = ?,
      category = ?,
      subcategory = ?,
      brand = ?,
      rating = ?,
      inStock = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      productData.title,
      productData.description,
      productData.price,
      productData.oldPrice,
      productData.offer,
      productData.category,
      productData.subcategory,
      productData.brand,
      productData.rating,
      productData.inStock,
      id,
    ],
    callback,
  );
};

// =====================================================
// DELETE PRODUCT
// =====================================================

const deleteProduct = (id, callback) => {
  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [id], callback);
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProducts,
  getProductsPaginated,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
