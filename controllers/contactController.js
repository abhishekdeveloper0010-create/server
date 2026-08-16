const transporter = require("../config/email");

const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required.",
      });
    }

    // =========================
    // EMAIL TO APPLE BLOSSOM
    // =========================

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      // Apple Blossom ka email
      to: process.env.EMAIL_USER,

      // Customer ko reply karne ke liye
      replyTo: email,

      subject: `New Contact Message from ${name}`,

      text: `
New Contact Message

Name: ${name}
Email: ${email}

Message:
${message}
      `,
    });

    // =========================
    // CONFIRMATION EMAIL
    // CUSTOMER KO
    // =========================

    await transporter.sendMail({
      from: process.env.EMAIL_USER,

      // Customer ka email
      to: email,

      subject: "Thank You for Contacting Apple Blossom",

      text: `
Hello ${name},

Thank you for contacting Apple Blossom.

We have received your message successfully.

Your message:
${message}

Our team will get back to you soon.

Regards,
Apple Blossom Team
      `,
    });

    // =========================
    // SUCCESS RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message:
        "Message sent successfully. Confirmation email sent to your email.",
    });
  } catch (error) {
    console.error("CONTACT EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};

module.exports = {
  sendContactMessage,
};
