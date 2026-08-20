require("dotenv").config();

const transporter = require("./config/email");

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "abhishekkumar97831@gmail.com",
      subject: "Apple Blossom Test Email",
      text: "Gmail OAuth2 is working successfully!",
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Email error:", error);
  }
}

sendTestEmail();