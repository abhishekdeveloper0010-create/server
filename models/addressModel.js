const db = require("../config/db");

// ==============================
// CREATE ADDRESS
// ==============================

const createAddress = (addressData, callback) => {
  const {
    user_id,
    full_name,
    phone,
    email,
    address_line,
    city,
    state,
    pincode,
    country,
    is_default,
  } = addressData;

  const sql = `
    INSERT INTO addresses
    (
      user_id,
      full_name,
      phone,
      email,
      address_line,
      city,
      state,
      pincode,
      country,
      is_default
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      user_id,
      full_name,
      phone,
      email,
      address_line,
      city,
      state,
      pincode,
      country || "India",
      is_default || false,
    ],
    callback
  );
};

// ==============================
// GET USER ADDRESSES
// ==============================

const getAddressesByUserId = (userId, callback) => {
  const sql = `
    SELECT *
    FROM addresses
    WHERE user_id = ?
    ORDER BY is_default DESC, created_at DESC
  `;

  db.query(sql, [userId], callback);
};

// ==============================
// GET SINGLE ADDRESS
// ==============================

const getAddressById = (addressId, userId, callback) => {
  const sql = `
    SELECT *
    FROM addresses
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `;

  db.query(sql, [addressId, userId], callback);
};

// ==============================
// UPDATE ADDRESS
// ==============================

const updateAddress = (addressId, userId, addressData, callback) => {
  const {
    full_name,
    phone,
    email,
    address_line,
    city,
    state,
    pincode,
    country,
    is_default,
  } = addressData;

  const sql = `
    UPDATE addresses
    SET
      full_name = ?,
      phone = ?,
      email = ?,
      address_line = ?,
      city = ?,
      state = ?,
      pincode = ?,
      country = ?,
      is_default = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(
    sql,
    [
      full_name,
      phone,
      email,
      address_line,
      city,
      state,
      pincode,
      country || "India",
      is_default || false,
      addressId,
      userId,
    ],
    callback
  );
};

// ==============================
// DELETE ADDRESS
// ==============================

const deleteAddress = (addressId, userId, callback) => {
  const sql = `
    DELETE FROM addresses
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [addressId, userId], callback);
};

module.exports = {
  createAddress,
  getAddressesByUserId,
  getAddressById,
  updateAddress,
  deleteAddress,
};