const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: {
    type: String,
    enum: ['consent_management', 'nomination_registry', 'executive_summary', 'annual_audit'],
    required: true
  },
  title: { type: String, required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['queued', 'generating', 'ready', 'failed'], default: 'queued' },
  fileUrl: String,
  content: { type: mongoose.Schema.Types.Mixed },
  parameters: { type: mongoose.Schema.Types.Mixed },
  period: { start: Date, end: Date }
}, { timestamps: true });

const mongoosePaginate = require('mongoose-paginate-v2');
reportSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Report', reportSchema);
