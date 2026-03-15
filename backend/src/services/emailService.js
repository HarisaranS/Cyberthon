const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const createTransporter = () => nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to, subject, html
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error('Email send error:', err.message);
  }
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your DataSentinel account',
    html: `<h2>Welcome to DataSentinel</h2><p>Click <a href="${verifyUrl}">here</a> to verify your email.</p><p>Link: ${verifyUrl}</p>`
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your DataSentinel password',
    html: `<h2>Password Reset</h2><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
  });
};

const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to DataSentinel!',
    html: `<h2>Welcome ${user.name}!</h2><p>Your DataSentinel account is ready. Start by connecting your first data source.</p>`
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
