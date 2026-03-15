const mongoose = require('mongoose');

const complianceItemSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  section: {
    type: String,
    required: true
  },
  requirement: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['compliant', 'partial', 'non_compliant', 'not_applicable'],
    default: 'non_compliant'
  },
  evidence: {
    type: String,
    default: ''
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Ensure unique combination of org and section
complianceItemSchema.index({ orgId: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('ComplianceItem', complianceItemSchema);
