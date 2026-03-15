const mongoose = require('mongoose');

const scanJobSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  connectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataSource', required: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued' },
  triggerType: { type: String, enum: ['manual', 'scheduled'], default: 'manual' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  currentFile: String,
  totalFilesScanned: { type: Number, default: 0 },
  totalPIIFound: { type: Number, default: 0 },
  criticalFindings: { type: Number, default: 0 },
  highFindings: { type: Number, default: 0 },
  mediumFindings: { type: Number, default: 0 },
  lowFindings: { type: Number, default: 0 },
  insightSummary: String,
  startedAt: Date,
  completedAt: Date,
  errorMessage: String,
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
scanJobSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('ScanJob', scanJobSchema);
