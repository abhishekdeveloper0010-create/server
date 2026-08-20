const {
  createAddress,
  getAddressesByUserId,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require("../models/addressModel");

// ==============================
// CREATE ADDRESS
// ==============================

exports.createAddress = (req, res) => {
  const userId = req.user.id;

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
  } = req.body;

  // Required fields
  if (
    !full_name ||
    !phone ||
    !address_line ||
    !city ||
    !state ||
    !pincode
  ) {
    return res.status(400).json({
      message:
        "Full name, phone, address, city, state and pincode are required.",
    });
  }

  const addressData = {
    user_id: userId,
    full_name,
    phone,
    email: email || null,
    address_line,
    city,
    state,
    pincode,
    country: country || "India",
    is_default: is_default || false,
  };

  createAddress(addressData, (err, result) => {
    if (err) {
      console.error("CREATE ADDRESS ERROR:", err);

      return res.status(500).json({
        message: "Unable to save address.",
        error: err.message,
      });
    }

    return res.status(201).json({
      message: "Address saved successfully.",
      addressId: result.insertId,
    });
  });
};

// ==============================
// GET MY ADDRESSES
// ==============================

exports.getMyAddresses = (req, res) => {
  const userId = req.user.id;

  getAddressesByUserId(userId, (err, results) => {
    if (err) {
      console.error("GET ADDRESSES ERROR:", err);

      return res.status(500).json({
        message: "Unable to fetch addresses.",
        error: err.message,
      });
    }

    return res.status(200).json({
      addresses: results,
    });
  });
};

// ==============================
// GET SINGLE ADDRESS
// ==============================

exports.getSingleAddress = (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;

  getAddressById(addressId, userId, (err, results) => {
    if (err) {
      console.error("GET ADDRESS ERROR:", err);

      return res.status(500).json({
        message: "Unable to fetch address.",
        error: err.message,
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      address: results[0],
    });
  });
};

// ==============================
// UPDATE ADDRESS
// ==============================

exports.updateMyAddress = (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;

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
  } = req.body;

  if (
    !full_name ||
    !phone ||
    !address_line ||
    !city ||
    !state ||
    !pincode
  ) {
    return res.status(400).json({
      message:
        "Full name, phone, address, city, state and pincode are required.",
    });
  }

  const addressData = {
    full_name,
    phone,
    email: email || null,
    address_line,
    city,
    state,
    pincode,
    country: country || "India",
    is_default: is_default || false,
  };

  updateAddress(addressId, userId, addressData, (err, result) => {
    if (err) {
      console.error("UPDATE ADDRESS ERROR:", err);

      return res.status(500).json({
        message: "Unable to update address.",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      message: "Address updated successfully.",
    });
  });
};

// ==============================
// DELETE ADDRESS
// ==============================

exports.deleteMyAddress = (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;

  deleteAddress(addressId, userId, (err, result) => {
    if (err) {
      console.error("DELETE ADDRESS ERROR:", err);

      return res.status(500).json({
        message: "Unable to delete address.",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      message: "Address deleted successfully.",
    });
  });
};