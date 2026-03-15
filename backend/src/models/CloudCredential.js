const mongoose = require('mongoose');

const cloudCredentialSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  label: { type: String, required: true, trim: true }, // friendly name e.g. "Production AWS"
  provider: {
    type: String,
    enum: ['aws', 'gcp', 'azure'],
    required: true
  },

  // AES-256 encrypted JSON blob
  // AWS: { accessKeyId, secretAccessKey, region, accountId }
  // GCP: { serviceAccountJson, projectId }
  // Azure: { tenantId, clientId, clientSecret, subscriptionId }
  encryptedCredentials: { type: String, required: true },

  status: {
    type: String,
    enum: ['active', 'error', 'scanning', 'discovering'],
    default: 'active'
  },
  lastDiscoveredAt: Date,
  lastError: String,

  // Summary counts (updated after discovery)
  discoveredResources: { type: Number, default: 0 },
  totalPIIFound: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true }
}, { timestamps: true });

cloudCredentialSchema.index({ orgId: 1, provider: 1 });

module.exports = mongoose.model('CloudCredential', cloudCredentialSchema);
