const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const {
  createUser,
  findUserByEmail,
  saveResetToken,
  findUserByResetToken,
  updatePassword,
} = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// =========================
// REGISTER
// =========================

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required.",
    });
  }

  findUserByEmail(email, async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error.",
        error: err,
      });
    }

    if (results && results.length > 0) {
      return res.status(409).json({
        message: "Email is already registered.",
      });
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
            return res.status(500).json({
              message: "Unable to create user.",
              error: insertErr,
            });
          }

          const token = jwt.sign(
            {
              id: insertResult.insertId,
              name,
              email,
              role: "user",
            },
            JWT_SECRET,
            {
              expiresIn: JWT_EXPIRES_IN,
            }
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
        }
      );
    } catch (hashErr) {
      return res.status(500).json({
        message: "Error hashing password.",
        error: hashErr,
      });
    }
  });
};

// =========================
// LOGIN
// =========================

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  findUserByEmail(email, async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error.",
        error: err,
      });
    }

    const user = results && results[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      }
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

// =========================
// FORGOT PASSWORD
// =========================

exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required.",
    });
  }
  
  findUserByEmail(email, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error.",
      });
    }

    const user = results && results[0];

    if (!user) {
      return res.status(404).json({
        message: "Email is not registered.",
      });
    }

    // Generate reset token
    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Token expires after 15 minutes
    const expiry = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Save token in MySQL
    saveResetToken(
      email,
      resetToken,
      expiry,
      async (saveErr) => {
        if (saveErr) {
          return res.status(500).json({
            message: "Unable to create reset token.",
          });
        }

        // Create reset password link
        const resetLink =
          `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        try {
          // Send email
          await sendEmail(
            email,
            "Reset Your Password",
            `
              <h2>Password Reset</h2>

              <p>Hello ${user.name},</p>

              <p>
                You requested to reset your password.
              </p>

              <p>
                Click the button below to reset your password:
              </p>

              <a
                href="${resetLink}"
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background:#2563eb;
                  color:white;
                  text-decoration:none;
                  border-radius:8px;
                "
              >
                Reset Password
              </a>

              <p>
                This link will expire in 15 minutes.
              </p>

              <p>
                If you did not request this password reset,
                you can ignore this email.
              </p>
            `
          );

          return res.status(200).json({
            message:
              "Password reset link sent to your email.",
          });

        } catch (emailError) {
          console.log("EMAIL ERROR:", emailError);

          return res.status(500).json({
            message: "Unable to send reset email.",
          });
        }
      }
    );
  });
};

// =========================
// RESET PASSWORD
// =========================

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Reset token is required.",
    });
  }

  if (!password) {
    return res.status(400).json({
      message: "New password is required.",
    });
  }

  findUserByResetToken(token, async (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Database error.",
        error: err,
      });
    }

    const user = results && results[0];

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    try {
      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and remove reset token
      updatePassword(
        user.id,
        hashedPassword,
        (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).json({
              message: "Unable to reset password.",
              error: updateErr,
            });
          }

          return res.json({
            message: "Password reset successfully.",
          });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({
        message: "Error hashing password.",
        error: hashErr,
      });
    }
  });
};