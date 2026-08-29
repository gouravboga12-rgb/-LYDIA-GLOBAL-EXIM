/**
 * Lydia Global Exim - OTP Verification Email Setup
 * For Account Sign Up & Forgot Password OTP Verification
 */

const nodemailer = require('nodemailer');

// 1. Create Nodemailer Transporter using Lydia Global Exim SMTP Settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || 'lydiaglobalexim@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'ihcyjxmdovruxtql',
  },
});

/**
 * Send Account Sign Up OTP Verification Email
 */
async function sendSignupOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Verify Your Email ✨ | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1ece1;">
          <h1 style="color: #060B19; margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; font-weight: 700;">
            LYDIA GLOBAL EXIM
          </h1>
          <p style="color: #c6a184; margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
            Premium Stainless Steel PVD Gold Plated Jewelry
          </p>
        </div>

        <!-- Body Content -->
        <h2 style="color: #060B19; text-align: center; font-size: 20px; margin: 0 0 16px 0;">Verify Your Email Address ✨</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          Thank you for creating an account with <strong>Lydia Global Exim</strong>. Please enter the verification code below to verify your email address and complete your registration:
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #060B19; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 8px 0;">
          ⏱️ This code will expire in <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 4px 0;">
          🔒 For your security, do not share this code with anyone.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 24px;">
          If you did not request this account registration, you can safely ignore this email.
        </p>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1ece1;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #060B19;">Team Lydia Global Exim</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
            <a href="mailto:lydiaglobalexim@gmail.com" style="color: #b38827; text-decoration: none; font-weight: 600;">lydiaglobalexim@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Lydia Global Exim. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

/**
 * Send Forgot Password Reset OTP Email
 */
async function sendForgotPasswordOTPEmail(email, otp, name = 'Customer') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Lydia Global Exim" <lydiaglobalexim@gmail.com>',
    to: email,
    subject: 'Password Reset Code 🔐 | Lydia Global Exim',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px 28px; border: 1px solid #e8dfcf; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f1ece1;">
          <h1 style="color: #060B19; margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; font-weight: 700;">
            LYDIA GLOBAL EXIM
          </h1>
          <p style="color: #c6a184; margin: 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
            Premium Stainless Steel PVD Gold Plated Jewelry
          </p>
        </div>

        <!-- Body Content -->
        <h2 style="color: #060B19; text-align: center; font-size: 20px; margin: 0 0 16px 0;">Reset Your Password 🔐</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi <strong>${name || 'Customer'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          We received a request to reset the password for your <strong>Lydia Global Exim</strong> account. Use the one-time verification code below to set a new password:
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; padding: 14px 32px; font-size: 32px; font-weight: 800; color: #060B19; background: #faf7f2; border: 2px dashed #d4af37; border-radius: 12px; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; text-align: center; margin: 8px 0;">
          ⏱️ This code is valid for <strong>10 minutes</strong>.
        </p>
        <p style="font-size: 13px; line-height: 1.5; color: #dc2626; text-align: center; font-weight: 600; margin: 4px 0;">
          ⚠️ Never share this OTP with anyone, including Lydia Global Exim staff.
        </p>
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center; margin-top: 24px;">
          If you did not request a password reset, please secure your account immediately or contact support.
        </p>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 36px; padding-top: 24px; border-top: 1px solid #f1ece1;">
          <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #060B19;">Team Lydia Global Exim</p>
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">
            <a href="mailto:lydiaglobalexim@gmail.com" style="color: #b38827; text-decoration: none; font-weight: 600;">lydiaglobalexim@gmail.com</a>
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} Lydia Global Exim. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
}

module.exports = {
  transporter,
  sendSignupOTPEmail,
  sendForgotPasswordOTPEmail,
};
