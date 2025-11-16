// backend/utils/sendEmail.js

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, message }) => {
  try {
    await resend.emails.send({
      from: "SolClothing <onboarding@resend.dev>",  // ✔ works without domain setup
      to: email,
      subject: subject,
      html: message,
    });

    console.log("📨 Email Sent Successfully to:", email);
  } catch (error) {
    console.error("❌ Resend Email Error:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
