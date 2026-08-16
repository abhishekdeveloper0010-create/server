const db = require("../config/db");

// ==============================
// FIND SUBSCRIBER BY EMAIL
// ==============================

const findSubscriberByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM newsletter_subscribers
      WHERE email = ?
      LIMIT 1
    `;

    db.query(sql, [email], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(results[0] || null);
    });
  });
};

// ==============================
// CREATE SUBSCRIBER
// ==============================

const createSubscriber = (email) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO newsletter_subscribers (email)
      VALUES (?)
    `;

    db.query(sql, [email], (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};

// ==============================
// EXPORT
// ==============================

module.exports = {
  findSubscriberByEmail,
  createSubscriber,
};