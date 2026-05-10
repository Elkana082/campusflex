const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (toEmail, username, code) => {
  try {
    await transporter.sendMail({
      from: `"CampusFlex" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Your CampusFlex Verification Code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5fa;border-radius:20px;">
          <h1 style="font-size:28px;font-weight:900;color:#7c3aed;margin-bottom:8px;">CampusFlex</h1>
          <p style="color:#3d3a5c;font-size:15px;margin-bottom:24px;">Hey <strong>${username}</strong> 👋 Welcome to the campus vibe!</p>
          <div style="background:#ffffff;border-radius:16px;padding:28px;text-align:center;border:1px solid #e4e4f0;">
            <p style="color:#9896b8;font-size:13px;margin-bottom:12px;">Your verification code is:</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#7c3aed;margin-bottom:12px;">${code}</div>
            <p style="color:#9896b8;font-size:12px;">Expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
          <p style="color:#9896b8;font-size:12px;margin-top:20px;text-align:center;">If you did not sign up for CampusFlex, ignore this email.</p>
        </div>
      `,
    });
    console.log(`📧 Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ Mailer error:", error.message);
    throw new Error("Failed to send verification email.");
  }
};

module.exports = { sendVerificationEmail };