const db = require("../config/db");
const mysql2 = require("mysql2");

// ==========================================
// Find user by email
// ==========================================
const findUserByEmail = (email, callback) => {
  const sql = "SELECT * FROM users WHERE email = ?";

  console.log("SQL:", sql);

  db.query(sql, [email], (err, results) => {
    console.log(
      "Final Query:",
      mysql2.format(sql, [email])
    );

    if (err) {
      console.log("❌ FIND USER ERROR:", err);
    }

    callback(err, results);
  });
};


// ==========================================
// Create new user
// ==========================================
const createUser = (userData, callback) => {
  const sql =
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

  db.query(
    sql,
    [
      userData.name,
      userData.email,
      userData.password,
      userData.role || "user",
    ],
    (err, result) => {
      if (err) {
        console.log("❌ MYSQL ERROR:", err);
      } else {
        console.log("✅ USER INSERTED:", result.insertId);
      }

      callback(err, result);
    }
  );
};


// ==========================================
// Save password reset token
// ==========================================
const saveResetToken = (email, token, expiry, callback) => {
  const sql = `
    UPDATE users
    SET reset_password_token = ?,
       reset_password_expires = ?
    WHERE email = ?
  `;

  console.log(
    "Final Query:",
    mysql2.format(sql, [token, expiry, email])
  );

  db.query(
    sql,
    [token, expiry, email],
    (err, result) => {

      if (err) {
        console.log("SAVE RESET TOKEN ERROR:", err);
      } else {
        console.log(
          "RESET TOKEN SAVED:",
          result.affectedRows
        );
      }

      callback(err, result);
    }
  );
};


// ==========================================
// Find user by valid reset token
// ==========================================
const findUserByResetToken = (token, callback) => {
  const sql = `
    SELECT *
    FROM users
    WHERE reset_password_token = ?
    AND reset_password_expires > NOW()
  `;

  console.log(
    "Final Query:",
    mysql2.format(sql, [token])
  );

  db.query(sql, [token], (err, results) => {

    if (err) {
      console.log("❌ FIND RESET TOKEN ERROR:", err);
    }

    callback(err, results);
  });
};


// ==========================================
// Update user password
// ==========================================
const updatePassword = (userId, hashedPassword, callback) => {
  const sql = `
    UPDATE users
    SET password = ?,
       reset_password_token = NULL,
       reset_password_expires = NULL
    WHERE id = ?
  `;

  console.log(
    "Final Query:",
    mysql2.format(sql, [hashedPassword, userId])
  );

  db.query(
    sql,
    [hashedPassword, userId],
    (err, result) => {

      if (err) {
        console.log("UPDATE PASSWORD ERROR:", err);
      } else {
        console.log("PASSWORD UPDATED");
      }

      callback(err, result);
    }
  );
};


// ==========================================
// Export
// ==========================================
module.exports = {
  createUser,
  findUserByEmail,
  saveResetToken,
  findUserByResetToken,
  updatePassword,
};