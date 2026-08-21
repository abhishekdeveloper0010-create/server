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

const JWT_SECRET =
  process.env.JWT_SECRET || "defaultsecret";

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "1h";

// =====================================================
// REGISTER
// =====================================================

exports.register = (req, res) => {
  const {
    name,
    email,
    password,
  } = req.body;

  // Validation
  if (
    !name ||
    !email ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email and password are required.",
    });
  }

  const cleanName = name.trim();

  const cleanEmail =
    email.trim().toLowerCase();

  if (!cleanName) {
    return res.status(400).json({
      success: false,
      message: "Name is required.",
    });
  }

  if (!cleanEmail) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 6 characters.",
    });
  }

  // ===================================================
  // CHECK EXISTING USER
  // ===================================================

  findUserByEmail(
    cleanEmail,
    async (err, results) => {

      if (err) {
        console.error(
          "REGISTER DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error.",
        });
      }

      // =================================================
      // ALREADY REGISTERED
      // =================================================

      if (
        results &&
        results.length > 0
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Email is already registered. Please login.",
        });
      }

      try {

        // ===============================================
        // HASH PASSWORD
        // ===============================================

        const hashedPassword =
          await bcrypt.hash(
            password,
            10
          );

        // ===============================================
        // CREATE USER
        // ===============================================

        createUser(
          {
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: "user",
          },

          (insertErr, insertResult) => {

            if (insertErr) {
              console.error(
                "CREATE USER ERROR:",
                insertErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Unable to create user.",
              });
            }

            const userId =
              insertResult.insertId;

            // =========================================
            // CREATE JWT
            // =========================================

            const token = jwt.sign(
              {
                id: userId,
                name: cleanName,
                email: cleanEmail,
                role: "user",
              },
              JWT_SECRET,
              {
                expiresIn:
                  JWT_EXPIRES_IN,
              }
            );

            // =========================================
            // RESPONSE
            // =========================================

            return res.status(201).json({
              success: true,

              message:
                "User registered successfully.",

              token,

              user: {
                id: userId,
                name: cleanName,
                email: cleanEmail,
                role: "user",
              },
            });
          }
        );

      } catch (hashErr) {

        console.error(
          "PASSWORD HASH ERROR:",
          hashErr
        );

        return res.status(500).json({
          success: false,
          message:
            "Error hashing password.",
        });
      }
    }
  );
};

// =====================================================
// LOGIN
// =====================================================

exports.login = (req, res) => {
  const {
    email,
    password,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message:
        "Email and password are required.",
    });
  }

  const cleanEmail =
    email.trim().toLowerCase();

  findUserByEmail(
    cleanEmail,
    async (err, results) => {

      if (err) {
        console.error(
          "LOGIN DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message: "Database error.",
        });
      }

      const user =
        results && results[0];

      // ===============================================
      // USER NOT FOUND
      // ===============================================

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      try {

        // =============================================
        // PASSWORD CHECK
        // =============================================

        const passwordMatches =
          await bcrypt.compare(
            password,
            user.password
          );

        if (!passwordMatches) {
          return res.status(401).json({
            success: false,
            message:
              "Invalid email or password.",
          });
        }

        // =============================================
        // JWT
        // =============================================

        const token = jwt.sign(
          {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || "user",
          },
          JWT_SECRET,
          {
            expiresIn:
              JWT_EXPIRES_IN,
          }
        );

        // =============================================
        // RESPONSE
        // =============================================

        return res.status(200).json({
          success: true,

          message:
            "Login successful.",

          token,

          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role:
              user.role || "user",
          },
        });

      } catch (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to login.",
        });
      }
    }
  );
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

exports.forgotPassword = (
  req,
  res
) => {

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message:
        "Email is required.",
    });
  }

  const cleanEmail =
    email.trim().toLowerCase();

  findUserByEmail(
    cleanEmail,
    (err, results) => {

      if (err) {
        console.error(
          "FORGOT PASSWORD DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Database error.",
        });
      }

      const user =
        results && results[0];

      // =============================================
      // EMAIL NOT REGISTERED
      // =============================================

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "Email is not registered.",
        });
      }

      // =============================================
      // RESET TOKEN
      // =============================================

      const resetToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      // 15 minutes
      const expiry = new Date(
        Date.now() +
          15 * 60 * 1000
      );

      // =============================================
      // SAVE RESET TOKEN
      // =============================================

      saveResetToken(
        cleanEmail,
        resetToken,
        expiry,
        async (saveErr) => {

          if (saveErr) {
            console.error(
              "SAVE RESET TOKEN ERROR:",
              saveErr
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to create reset token.",
            });
          }

          // =========================================
          // RESET LINK
          // =========================================

          const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

          const resetLink =
            `${frontendUrl}/reset-password/${resetToken}`;

          try {

            // =======================================
            // SEND EMAIL
            // =======================================

            await sendEmail(
              cleanEmail,

              "Reset Your Password",

              `
                <h2>Password Reset</h2>

                <p>Hello ${user.name},</p>

                <p>
                  You requested to reset your password.
                </p>

                <p>
                  Click the button below to reset
                  your password:
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
                  If you did not request this
                  password reset, you can ignore
                  this email.
                </p>
              `
            );

            return res.status(200).json({
              success: true,
              message:
                "Password reset link sent to your email.",
            });

          } catch (emailError) {

            console.error(
              "EMAIL ERROR:",
              emailError
            );

            return res.status(500).json({
              success: false,
              message:
                "Unable to send reset email.",
            });
          }
        }
      );
    }
  );
};

// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword = async (
  req,
  res
) => {

  const { token } =
    req.params;

  const { password } =
    req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message:
        "Reset token is required.",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message:
        "New password is required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 6 characters.",
    });
  }

  findUserByResetToken(
    token,
    async (err, results) => {

      if (err) {
        console.error(
          "RESET TOKEN DB ERROR:",
          err
        );

        return res.status(500).json({
          success: false,
          message:
            "Database error.",
        });
      }

      const user =
        results && results[0];

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or expired reset token.",
        });
      }

      try {

        const hashedPassword =
          await bcrypt.hash(
            password,
            10
          );

        updatePassword(
          user.id,
          hashedPassword,
          (
            updateErr,
            updateResult
          ) => {

            if (updateErr) {
              console.error(
                "UPDATE PASSWORD ERROR:",
                updateErr
              );

              return res.status(500).json({
                success: false,
                message:
                  "Unable to reset password.",
              });
            }

            return res.status(200).json({
              success: true,
              message:
                "Password reset successfully.",
            });
          }
        );

      } catch (hashErr) {

        console.error(
          "RESET PASSWORD HASH ERROR:",
          hashErr
        );

        return res.status(500).json({
          success: false,
          message:
            "Error hashing password.",
        });
      }
    }
  );
};