const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'admin', 'dpo', 'analyst', 'viewer'], default: 'analyst' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  passwordResetToken: String,
  passwordResetExpiry: Date,
  isMfaEnabled: { type: Boolean, default: false },
  mfaSecret: String,
  lastLogin: Date,
  lastLoginIP: String,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  ssoProvider: String,
  ssoId: String,
  refreshTokens: [{ token: String, createdAt: Date }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash') || this.passwordHash === 'sso-user-no-password') return next();
  if (!this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpiry = Date.now() + 60 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);
