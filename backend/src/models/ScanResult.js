const mongoose = require('mongoose');

const scanResultSchema = new mongoose.Schema({
  scanJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScanJob', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  dataSourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataSource' },
  assetPath: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  detectedPII: [{
    piiType: String,
    maskedValue: String,
    confidence: Number,
    contextSnippet: String
  }],
  sensitivityLevel: { type: String, enum: ['public', 'internal', 'personal', 'sensitive_personal'], default: 'internal' },
  riskScore: { type: Number, default: 0 },
  ownerEmail: String,
  isEncrypted: { type: Boolean, default: false },
  hasConsentRecord: { type: Boolean, default: false },
  remediationStatus: { type: String, enum: ['pending', 'in_progress', 'resolved', 'accepted_risk'], default: 'pending' }
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
scanResultSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ScanResult', scanResultSchema);
