const mongoose = require('mongoose');

const breachEventSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  description: String,
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'high' },
  status: { type: String, enum: ['detected', 'investigating', 'contained', 'notified', 'closed'], default: 'detected' },
  detectedAt: { type: Date, default: Date.now },
  notifyDeadline: Date,
  affectedDataTypes: [String],
  estimatedAffectedCount: Number,
  rootCause: String,
  containmentMeasures: String,
  dpbNotifiedAt: Date,
  principalNotificationSentAt: Date,
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    event: String,
    user: String
  }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closedAt: Date
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
breachEventSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('BreachEvent', breachEventSchema);
