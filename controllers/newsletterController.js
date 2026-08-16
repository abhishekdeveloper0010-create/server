const transporter = require("../config/email");

const {
  findSubscriberByEmail,
  createSubscriber,
} = require("../models/newsletterModel");

// ==============================
// SUBSCRIBE NEWSLETTER
// ==============================

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const subscriberEmail = email.trim().toLowerCase();

    // =========================
    // BASIC EMAIL VALIDATION
    // =========================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(subscriberEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // =========================
    // CHECK EXISTING SUBSCRIBER
    // =========================

    const existingSubscriber =
      await findSubscriberByEmail(subscriberEmail);

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: "This email is already subscribed.",
      });
    }

    // =========================
    // SAVE EMAIL IN MYSQL
    // =========================

    await createSubscriber(subscriberEmail);

    // =========================
    // SEND WELCOME EMAIL
    // TO SAME EMAIL
    // =========================

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      // Subscriber ki email
      to: subscriberEmail,

      subject: "Welcome to Apple Blossom Newsletter",

      text: `
Hello,

Thank you for subscribing to the Apple Blossom Newsletter!

You have successfully joined our newsletter.

You will receive updates about:

- New products
- Latest collections
- Special offers
- Exclusive updates

We are happy to have you with us.

Regards,
Apple Blossom Team
      `,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          background: #ffffff;
          border: 1px solid #eeeeee;
          border-radius: 12px;
        ">

          <h2 style="
            color: #222;
            margin-bottom: 20px;
          ">
            Welcome to Apple Blossom! 🌸
          </h2>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            Thank you for subscribing to the
            <strong>Apple Blossom Newsletter</strong>.
          </p>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            You have successfully joined our newsletter.
          </p>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            You will receive updates about:
          </p>

          <ul style="
            color: #555;
            line-height: 1.8;
          ">
            <li>New products</li>
            <li>Latest collections</li>
            <li>Special offers</li>
            <li>Exclusive updates</li>
          </ul>

          <p style="
            color: #555;
            font-size: 16px;
            line-height: 1.6;
          ">
            We are happy to have you with us. ❤️
          </p>

          <hr style="
            border: none;
            border-top: 1px solid #eeeeee;
            margin: 25px 0;
          ">

          <p style="
            color: #888;
            font-size: 14px;
          ">
            Regards,<br>
            <strong>Apple Blossom Team</strong>
          </p>

        </div>
      `,
    });

    // =========================
    // SUCCESS
    // =========================

    return res.status(201).json({
      success: true,
      message:
        "Successfully subscribed.",
    });

  } catch (error) {
    console.error(
      "NEWSLETTER SUBSCRIBE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to subscribe to newsletter.",
    });
  }
};

// ==============================
// EXPORT
// ==============================

module.exports = {
  subscribeNewsletter,
};