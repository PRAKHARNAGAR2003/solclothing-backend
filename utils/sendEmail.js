const { Resend } = require("resend");

const sendEmail = async ({ email, subject, message }) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "SolClothing <onboarding@resend.dev>",
      to: email,
      subject,
      html: message,
    });

    console.log("📨 Email Sent Successfully to:", email);
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
