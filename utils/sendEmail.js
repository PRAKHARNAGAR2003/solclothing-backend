const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // SSL

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },

      tls: {
        rejectUnauthorized: false, // prevent Render/Gmail handshake errors
      },

      connectionTimeout: 20000, // increased timeout to fix ETIMEDOUT
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });

    const mailOptions = {
      from: `"SolClothing" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log("📨 Email Sent Successfully to:", email);
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
