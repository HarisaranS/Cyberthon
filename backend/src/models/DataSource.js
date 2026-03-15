const mongoose = require('mongoose');

const dataSourceSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['mysql', 'postgresql', 'mongodb', 'mssql', 's3', 'azure_blob', 'google_drive',
           'onedrive', 'sharepoint', 'gmail', 'exchange', 'slack', 'teams', 'sftp', 'rest_api', 'local', 'redis', 'imap', 'ssh'],
    required: true
  },
  infrastructure: {
    type: String,
    enum: ['on-premises', 'cloud'],
    default: 'on-premises'
  },
  credentials: { type: String }, // AES encrypted JSON string
  healthStatus: { type: String, enum: ['healthy', 'error', 'unknown', 'scanning'], default: 'unknown' },
  lastHealthCheck: Date,
  lastScannedAt: Date,
  nextScheduledScan: Date,
  schedule: String,
  totalFilesScanned: { type: Number, default: 0 },
  totalPIIFound: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  tags: [String],
  isActive: { type: Boolean, default: true },
  autoDiscovered: { type: Boolean, default: false },
  sampleData: { type: String }, // Sample data for demo scans
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-set infrastructure based on type
dataSourceSchema.pre('save', function(next) {
  const cloudTypes = ['s3', 'azure_blob', 'google_drive', 'onedrive', 'sharepoint', 'gmail', 'exchange', 'slack', 'teams'];
  if (!this.infrastructure) {
    this.infrastructure = cloudTypes.includes(this.type) ? 'cloud' : 'on-premises';
  }
  next();
});

const mongoosePaginate = require('mongoose-paginate-v2');
dataSourceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('DataSource', dataSourceSchema);
