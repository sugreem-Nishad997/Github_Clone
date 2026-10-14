import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a 6-digit OTP verification email to the user
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit OTP string
 * @param {string} username - Optional username for personalization
 */
export const sendOtpEmail = async (email, otp, username = "") => {
  const mailOptions = {
    from: `"ApnaGit Security" <${process.env.EMAIL_USER || "no-reply@apnagit.com"}>`,
    to: email,
    subject: `🔐 Your ApnaGit Verification Code: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; background-color: #0d1117; color: #c9d1d9; border: 1px solid #30363d; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #58a6ff; font-size: 24px; margin: 0; display: inline-block;">ApnaGit</h1>
          <p style="color: #8b949e; font-size: 13px; margin-top: 4px;">Git Version Control & Repository Platform</p>
        </div>

        <div style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; text-align: center;">
          <h2 style="color: #f0f6fc; font-size: 18px; margin-top: 0;">Email Verification</h2>
          <p style="color: #8b949e; font-size: 14px; line-height: 1.5;">
            ${username ? `Hi <strong>${username}</strong>,<br/>` : ""}
            Please use the following 6-digit verification code to complete your ApnaGit account registration:
          </p>
          
          <div style="margin: 24px auto; padding: 14px 28px; background-color: #0d1117; border: 2px dashed #58a6ff; border-radius: 8px; display: inline-block;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #58a6ff;">
              ${otp}
            </span>
          </div>

          <p style="color: #8b949e; font-size: 12px; margin-bottom: 0;">
            ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #8b949e;">
          If you did not request this verification code, you can safely ignore this email.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent successfully to ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    console.log(`🔑 [OTP FALLBACK] Verification OTP for ${email} is: ${otp}`);
    throw error;
  }
};

export default transporter;
