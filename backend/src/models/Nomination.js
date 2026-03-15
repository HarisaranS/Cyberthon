const mongoose = require('mongoose');

const nominationSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  principalName: { type: String, required: true },
  principalId: { type: String, required: true }, // Internal ID or hash
  nomineeName: { type: String, required: true },
  nomineeEmail: String,
  relation: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'revoked'], default: 'pending' },
  lodgedAt: { type: Date, default: Date.now },
  verifiedAt: Date,
  cryptographicHash: String,
  metadata: {
    documentRef: String,
    ipAddress: String
  }
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
nominationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Nomination', nominationSchema);
