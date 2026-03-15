const mongoose = require('mongoose');

const portDetailSchema = new mongoose.Schema({
  port: { type: Number, required: true },
  protocol: { type: String, default: 'tcp' },
  service: { type: String, default: 'unknown' },
  version: String,
  banner: String,
  state: { type: String, enum: ['open', 'closed', 'filtered'], default: 'open' }
}, { _id: false });

const assetInventorySchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

  // Network Identity
  ip: { type: String, required: true },
  hostname: String,
  macAddress: String,
  vendor: String, // MAC vendor lookup

  // Device Classification
  assetType: {
    type: String,
    enum: ['database', 'mail_server', 'file_server', 'web_server', 'ssh_host',
           'ldap_directory', 'cache_server', 'search_engine', 'laptop', 'workstation',
           'printer', 'switch', 'router', 'firewall', 'cloud', 'saas', 'unknown'],
    default: 'unknown'
  },
  os: String,
  osVersion: String,

  // Discovery Details
  openPorts: [portDetailSchema],
  isAlive: { type: Boolean, default: true },
  responseTimeMs: Number,
  ttl: Number,

  // Authentication Status
  authStatus: {
    type: String,
    enum: ['unknown', 'accessible_no_auth', 'accessible_credentials', 'requires_credentials', 'inaccessible'],
    default: 'unknown'
  },
  accessibleServices: [String], // list of service names we can get into
  dataSourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DataSource' }], // linked DataSource records

  // PII Summary (updated after each scan)
  totalPIIFound: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  lastScanAt: Date,

  // Metadata
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  autoDiscovered: { type: Boolean, default: true },
  notes: String,
  tags: [String]
}, { timestamps: true });

// Compound index for uniqueness per org
assetInventorySchema.index({ orgId: 1, ip: 1 }, { unique: true });
assetInventorySchema.index({ orgId: 1, assetType: 1 });
assetInventorySchema.index({ orgId: 1, authStatus: 1 });
assetInventorySchema.index({ orgId: 1, lastSeen: -1 });

const mongoosePaginate = require('mongoose-paginate-v2');
assetInventorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('AssetInventory', assetInventorySchema);
