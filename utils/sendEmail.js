const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,              // ← Gmail strongly recommends 587 (TLS)
      secure: false,          // ← must be false for port 587 STARTTLS

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Gmail App Password
      },

      tls: {
        rejectUnauthorized: false,   // prevent Render/Gmail handshake issues
        ciphers: "SSLv3",
      },

      connectionTimeout: 30000,      // 30 sec timeout
      greetingTimeout: 30000,
      socketTimeout: 30000,
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
