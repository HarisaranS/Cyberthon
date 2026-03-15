const mongoose = require('mongoose');

const consentRecordSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  principalEmail: String,
  principalName: String,
  dataTypes: [String],
  purposeDescription: String,
  legalBasis: { type: String, enum: ['consent', 'legitimate_interest', 'legal_obligation', 'vital_interest'], default: 'consent' },
  status: { type: String, enum: ['active', 'expired', 'withdrawn'], default: 'active' },
  grantedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  withdrawnAt: Date,
  consentMethod: String,
  ipAddress: String,
  collectionPoint: String
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
consentRecordSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ConsentRecord', consentRecordSchema);
