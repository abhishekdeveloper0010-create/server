const Product = require("../models/productModel");

// =====================================================
// GET ALL PRODUCTS
// =====================================================

exports.getAllProducts = (req, res) => {
  const page = Math.max(
    1,
    parseInt(req.query.page, 10) || 1
  );

  const limit = Math.max(
    1,
    parseInt(req.query.limit, 10) || 8
  );

  const search = String(
    req.query.search || ""
  ).trim();

  const category = String(
    req.query.category || ""
  ).trim();

  console.log("GET PRODUCTS:", {
    page,
    limit,
    search,
    category,
  });

  Product.getProductsPaginated(
    page,
    limit,
    search,
    category,
    (err, data) => {
      if (err) {
        console.error(
          "Get Products Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to load products",
          error: err.message,
        });
      }

      const results =
        data?.results || [];

      const total =
        Number(data?.total || 0);

      const totalPages =
        total > 0
          ? Math.ceil(total / limit)
          : 1;

      return res.status(200).json({
        success: true,

        data: results,

        page,

        limit,

        total,

        totalPages,

        search,

        category,
      });
    }
  );
};

// =====================================================
// GET PRODUCT BY ID
// =====================================================

exports.getProductById = (req, res) => {
  const { id } = req.params;

  // ===================================================
  // Validate ID
  // ===================================================

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.getProductById(
    id,
    (err, results) => {
      if (err) {
        console.error(
          "Get Product By ID Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to load product",
          error: err.message,
        });
      }

      // =================================================
      // PRODUCT NOT FOUND
      // =================================================

      if (
        !results ||
        results.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // =================================================
      // SINGLE PRODUCT
      // =================================================

      const product = results[0];

      console.log(
        "GET PRODUCT BY ID:",
        product
      );

      return res.status(200).json({
        success: true,
        data: product,
      });
    }
  );
};

// =====================================================
// CREATE PRODUCT
// =====================================================

exports.createProduct = (
  req,
  res
) => {
  const productData = req.body;

  // ===================================================
  // BASIC VALIDATION
  // ===================================================

  if (
    !productData ||
    Object.keys(productData).length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Product data is required",
    });
  }

  Product.createProduct(
    productData,
    (err, result) => {
      if (err) {
        console.error(
          "Create Product Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Failed to create product",
          error: err.message,
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Product created successfully",
        productId: result.insertId,
      });
    }
  );
};

// =====================================================
// UPDATE PRODUCT
// =====================================================

exports.updateProduct = (
  req,
  res
) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.updateProduct(
    id,
    req.body,
    (err, result) => {
      if (err) {
        console.error(
          "Update Product Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to update product",
          error: err.message,
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Product updated successfully",
      });
    }
  );
};

// =====================================================
// DELETE PRODUCT
// =====================================================

exports.deleteProduct = (
  req,
  res
) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
    });
  }

  Product.deleteProduct(
    id,
    (err, result) => {
      if (err) {
        console.error(
          "Delete Product Error:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to delete product",
          error: err.message,
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Product deleted successfully",
      });
    }
  );
};