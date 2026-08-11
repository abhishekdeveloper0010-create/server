const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required." });
  }

  findUserByEmail(email, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error.", error: err });
    }

    if (results && results.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      createUser(
        {
          name,
          email,
          password: hashedPassword,
          role: "user",
        },
        (insertErr, insertResult) => {
          if (insertErr) {
            return res.status(500).json({ message: "Unable to create user.", error: insertErr });
          }

          const token = jwt.sign(
            {
              id: insertResult.insertId,
              name,
              email,
              role: "user",
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN },
          );

          return res.status(201).json({
            message: "User registered successfully.",
            token,
            user: {
              id: insertResult.insertId,
              name,
              email,
              role: "user",
            },
          });
        },
      );
    } catch (hashErr) {
      return res.status(500).json({ message: "Error hashing password.", error: hashErr });
    }
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  findUserByEmail(email, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error.", error: err });
    }

    const user = results && results[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
};
