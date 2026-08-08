const db = require("../config/db");

const getProducts = (callback) => {
    const sql = "SELECT * FROM products";

    db.query(sql, callback);
};

module.exports = {
    getProducts
};