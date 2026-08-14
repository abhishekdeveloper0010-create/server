const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "appleblossom",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;