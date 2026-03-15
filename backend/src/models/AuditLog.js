const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  userRole: String,
  action: { type: String, required: true },
  resourceType: String,
  resourceId: String,
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String,
  userAgent: String,
  outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
  prevHash: String,
  entryHash: String,
  timestamp: { type: Date, default: Date.now, immutable: true }
}, { timestamps: false });

const mongoosePaginate = require('mongoose-paginate-v2');
auditLogSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AuditLog', auditLogSchema);
