const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: { type: String, default: 'Technology' },
  size: { type: String, enum: ['1-50', '51-200', '201-1000', '1001-5000', '5000+'], default: '1-50' },
  gstin: String,
  registeredAddress: String,
  dataProtectionOfficer: {
    name: String,
    email: String,
    phone: String
  },
  subscriptionPlan: { type: String, enum: ['starter', 'professional', 'enterprise'], default: 'starter' },
  subscriptionStatus: { type: String, enum: ['active', 'expired', 'trial'], default: 'trial' },
  subscriptionExpiry: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  complianceScore: { type: Number, default: 0, min: 0, max: 100 },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  totalPIIAssets: { type: Number, default: 0 },
  criticalCount: { type: Number, default: 0 },
  isSDF: { type: Boolean, default: false },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  branding: {
    logo: String,
    primaryColor: { type: String, default: '#00E5FF' }
  },
  onboardingCompleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
