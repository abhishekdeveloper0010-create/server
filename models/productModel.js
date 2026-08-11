const db = require("../config/db");

const getProducts = (callback) => {
    const sql = "SELECT * FROM products";
    db.query(sql, callback);
};

const getProductsPaginated = (page = 1, limit = 20, callback) => {
    const offset = (page - 1) * limit;

    const countSql = "SELECT COUNT(*) AS total FROM products";
    db.query(countSql, (countErr, countResults) => {
        if (countErr) return callback(countErr);

        const total = countResults && countResults[0] ? countResults[0].total : 0;

        const sql = "SELECT * FROM products LIMIT ? OFFSET ?";
        db.query(sql, [Number(limit), Number(offset)], (err, results) => {
            if (err) return callback(err);

            return callback(null, { results, total });
        });
    });
};

const getProductById = (id, callback) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    db.query(sql, [id], callback);
};

const createProduct = (productData, callback) => {
    const sql = `INSERT INTO products (title, description, price, oldPrice, offer, category, subcategory, brand, rating, inStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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

const updateProduct = (id, productData, callback) => {
    const sql = `UPDATE products SET title = ?, description = ?, price = ?, oldPrice = ?, offer = ?, category = ?, subcategory = ?, brand = ?, rating = ?, inStock = ? WHERE id = ?`;
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

const deleteProduct = (id, callback) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.query(sql, [id], callback);
};

module.exports = {
    getProducts,
    getProductsPaginated,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
};