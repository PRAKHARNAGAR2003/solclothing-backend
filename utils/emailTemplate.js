function passwordResetTemplate(name, resetUrl) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; background: #f7f7f7;">
    <div style="background: white; padding: 20px; border-radius: 10px;">
    
      <h2 style="color: #d4af37; text-align: center;">🔐 Reset Your Password</h2>

      <p style="font-size: 16px; color: #333;">
        Hi ${name || "there"},  
        <br><br>
        We received a request to reset your password for your <strong>SolClothing</strong> account.
      </p>

      <p style="font-size: 16px; color: #333;">
        Click the button below to reset your password:
      </p>

      <div style="text-align: center; margin: 25px 0;">
        <a href="${resetUrl}" style="
          padding: 12px 25px;
          background: linear-gradient(90deg, #ffd66b, #d4af37);
          color: black;
          text-decoration: none;
          font-weight: bold;
          border-radius: 30px;
        ">
          Reset Password
        </a>
      </div>

      <p style="font-size: 14px; color: #777;">
        If the button above doesn’t work, copy and paste the link below into your browser:
      </p>

      <p style="word-break: break-all; font-size: 14px; color: #555;">
        ${resetUrl}
      </p>

      <p style="font-size: 14px; color: #999; margin-top: 30px;">
        If you didn't request a password reset, feel free to ignore this email.
        <br><br>
        — <strong>SolClothing Team</strong>
      </p>

    </div>
  </div>
  `;
}
module.exports = passwordResetTemplate;
