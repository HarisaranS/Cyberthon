const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  dataSourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataSource' },
  scanJobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScanJob' },
  type: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], default: 'medium' },
  title: { type: String, required: true },
  description: String,
  affectedAsset: String,
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
alertSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Alert', alertSchema);
