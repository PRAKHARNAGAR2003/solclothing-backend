const nodemailer = require("nodemailer");

const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // Gmail requires SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // MUST be Gmail App Password
      },
    });

    const mailOptions = {
      from: "SolClothing" <${process.env.SMTP_USER}>,
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
