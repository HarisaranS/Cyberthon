const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtUtils');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');
const { logAction } = require('../services/auditService');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, orgName, industry, size } = req.body;
    if (!name || !email || !password) return sendError(res, 'Name, email and password required', 400);
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return sendError(res, 'Email already registered', 409);

    const org = await Organization.create({ name: orgName || `${name}'s Organization`, industry: industry || 'Technology', size: size || '1-50' });
    const user = new User({ name, email: email.toLowerCase(), passwordHash: password, orgId: org._id, role: 'admin' });
    const verifyToken = user.generateEmailVerificationToken();
    await user.save();

    try { await sendVerificationEmail(user, verifyToken); } catch (e) {}
    try { await sendWelcomeEmail(user); } catch (e) {}

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await logAction({
      orgId: org._id, userId: user._id, userEmail: user.email, userRole: user.role,
      action: 'register', resourceType: 'user', resourceId: user._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { orgName: org.name }
    });

    sendSuccess(res, {
      accessToken, refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: org._id },
      org: { id: org._id, name: org.name }
    }, 'Registration successful', 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 'Email and password required', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return sendError(res, 'Invalid credentials', 401);
    if (!user.isActive) return sendError(res, 'Account deactivated', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid credentials', 401);

    user.lastLogin = new Date();
    user.lastLoginIP = req.ip;
    user.loginAttempts = 0;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const org = await Organization.findById(user.orgId);

    await logAction({
      orgId: user.orgId, userId: user._id, userEmail: user.email, userRole: user.role,
      action: 'login', resourceType: 'session',
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });

    sendSuccess(res, {
      accessToken, refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: user.orgId, isMfaEnabled: user.isMfaEnabled },
      org: org ? { id: org._id, name: org.name, plan: org.subscriptionPlan, complianceScore: org.complianceScore, riskScore: org.riskScore } : null
    }, 'Login successful');
  } catch (err) { next(err); }
};

exports.getMe = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.orgId);
    sendSuccess(res, { user: req.user, org });
  } catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashedToken, emailVerificationExpiry: { $gt: Date.now() } });
    if (!user) return sendError(res, 'Invalid or expired verification token', 400);
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();
    sendSuccess(res, {}, 'Email verified successfully');
  } catch (err) { next(err); }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (user) {
      const token = user.generatePasswordResetToken();
      await user.save();
      try { await sendPasswordResetEmail(user, token); } catch (e) {}
    }
    sendSuccess(res, {}, 'If email exists, reset link sent');
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpiry: { $gt: Date.now() } });
    if (!user) return sendError(res, 'Invalid or expired reset token', 400);
    user.passwordHash = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();
    sendSuccess(res, {}, 'Password reset successful');
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return sendError(res, 'Refresh token required', 401);
    const { verifyToken } = require('../utils/jwtUtils');
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user) return sendError(res, 'User not found', 401);
    const newAccessToken = generateAccessToken(user._id);
    sendSuccess(res, { accessToken: newAccessToken });
  } catch (err) { sendError(res, 'Invalid refresh token', 401); }
};
