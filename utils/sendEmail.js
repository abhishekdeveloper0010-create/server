const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

   auth: {
    type: "OAuth2",

    user: process.env.EMAIL_USER,

    clientId: process.env.GOOGLE_CLIENT_ID,

    clientSecret: process.env.GOOGLE_CLIENT_SECRET,

    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Apple Blossom" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
 
module.exports = sendEmail;