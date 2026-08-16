const Product = require("../models/productModel");

// =====================================================
// GET PRODUCTS
// =====================================================

exports.getAllProducts = (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const limit = Math.max(1, parseInt(req.query.limit, 10) || 8);

  const search = String(req.query.search || "").trim();

  const category = String(req.query.category || "").trim();

  Product.getProductsPaginated(page, limit, search, category, (err, data) => {
    if (err) {
      console.error("Get Products Error:", err);

      return res.status(500).json({
        error: err,
      });
    }

    const { results, total } = data;

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: results,
      page,
      limit,
      total,
      totalPages,
      search,
      category,
    });
  });
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

exports.getProductById = (req, res) => {
  const { id } = req.params;

  Product.getProductById(id, (err, results) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json(results[0]);
  });
};

// =====================================================
// CREATE PRODUCT
// =====================================================

exports.createProduct = (req, res) => {
  const productData = req.body;

  Product.createProduct(productData, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    }

    res.status(201).json({
      message: "Product created successfully.",
      productId: result.insertId,
    });
  });
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

exports.updateProduct = (req, res) => {
  const { id } = req.params;

  const productData = req.body;

  Product.updateProduct(id, productData, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({
      message: "Product updated successfully.",
    });
  });
};

// =====================================================
// DELETE PRODUCT
// =====================================================

exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  Product.deleteProduct(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.json({
      message: "Product deleted successfully.",
    });
  });
};
