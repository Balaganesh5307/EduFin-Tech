import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '2525');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
};

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  const verifyUrl = `http://localhost:3000/verify-email?token=${token}`;
  const transporter = getTransporter();

  if (transporter) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@edufin.edu',
      to: email,
      subject: 'EduFin - Verify Your Campus Email',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Welcome to EduFin, ${name}!</h2>
          <p>Please confirm your account email address by entering the verification code below on the signup page:</p>
          <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
            ${token}
          </div>
          <p>Alternatively, click the link below to verify directly:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email Address</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This link and code will expire in 24 hours.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent successfully to: ${email}`);
      return;
    } catch (err) {
      console.error('SMTP email dispatch failed:', err);
    }
  }

  // Development Fallback Log
  console.log('\n==================================================');
  console.log('🤖 DEVELOPMENT EMAIL MOCK LOG (NO SMTP SETUP)');
  console.log(`To: ${name} <${email}>`);
  console.log('Subject: EduFin - Verify Your Campus Email');
  console.log(`Verification Code: ${token}`);
  console.log(`Verification URL: ${verifyUrl}`);
  console.log('==================================================\n');
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  const transporter = getTransporter();

  if (transporter) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@edufin.edu',
      to: email,
      subject: 'EduFin - Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">EduFin Password Recovery</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Use the verification token below to recover your account:</p>
          <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
            ${token}
          </div>
          <p>Or click this link to reset it directly:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #64748b;">If you did not request this, please ignore this email. This token expires in 1 hour.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
      return;
    } catch (err) {
      console.error('SMTP password reset dispatch failed:', err);
    }
  }

  // Development Fallback Log
  console.log('\n==================================================');
  console.log('🤖 DEVELOPMENT EMAIL MOCK LOG (NO SMTP SETUP)');
  console.log(`To: ${name} <${email}>`);
  console.log('Subject: EduFin - Password Reset Request');
  console.log(`Reset Token: ${token}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('==================================================\n');
};
