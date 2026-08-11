const Product = require("../models/productModel");

exports.getAllProducts = (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    Product.getProductsPaginated(page, limit, (err, data) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        const { results, total } = data;
        const totalPages = Math.ceil(total / limit);

        res.json({
            data: results,
            page,
            limit,
            total,
            totalPages,
        });
    });
};

exports.getProductById = (req, res) => {
    const { id } = req.params;

    Product.getProductById(id, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json(results[0]);
    });
};

exports.createProduct = (req, res) => {
    const productData = req.body;

    Product.createProduct(productData, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        res.status(201).json({
            message: "Product created successfully.",
            productId: result.insertId,
        });
    });
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const productData = req.body;

    Product.updateProduct(id, productData, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json({ message: "Product updated successfully." });
    });
};

exports.deleteProduct = (req, res) => {
    const { id } = req.params;

    Product.deleteProduct(id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json({ message: "Product deleted successfully." });
    });
};