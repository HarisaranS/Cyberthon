const CloudCredential = require('../models/CloudCredential');
const DataSource = require('../models/DataSource');
const { runCloudDiscovery } = require('../services/cloudScanService');
const { encrypt } = require('../services/encryptionService');
const logger = require('../config/logger');

// @desc    Get all cloud credentials
// @route   GET /api/v1/cloud/credentials
// @access  Private
exports.getCredentials = async (req, res) => {
  try {
    const creds = await CloudCredential.find({ orgId: req.user.orgId, isActive: true })
      .select('-encryptedCredentials') // Never send credentials to frontend
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: creds.length, data: creds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add cloud IAM credentials
// @route   POST /api/v1/cloud/credentials
// @access  Private (admin only)
exports.addCredential = async (req, res) => {
  try {
    const { label, provider, credentials } = req.body;
    if (!label || !provider || !credentials) {
      return res.status(400).json({ success: false, message: 'label, provider, and credentials are required' });
    }
    const validProviders = ['aws', 'gcp', 'azure'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ success: false, message: `provider must be one of: ${validProviders.join(', ')}` });
    }

    const cred = await CloudCredential.create({
      orgId: req.user.orgId,
      createdBy: req.user._id,
      label,
      provider,
      encryptedCredentials: encrypt(JSON.stringify(credentials)),
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: `${provider.toUpperCase()} credentials added. Trigger discovery to find cloud resources.`,
      data: { ...cred.toObject(), encryptedCredentials: undefined }
    });
  } catch (err) {
    logger.error('[Cloud] addCredential error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete cloud credentials
// @route   DELETE /api/v1/cloud/credentials/:id
// @access  Private (admin only)
exports.deleteCredential = async (req, res) => {
  try {
    const cred = await CloudCredential.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!cred) return res.status(404).json({ success: false, message: 'Credential not found' });
    await cred.deleteOne();
    res.status(200).json({ success: true, message: 'Cloud credentials removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Trigger cloud resource discovery
// @route   POST /api/v1/cloud/discover
// @access  Private (admin only)
exports.triggerCloudDiscovery = async (req, res) => {
  try {
    const { orgId } = req.user;
    const { credentialId } = req.body; // optional: run for specific credential

    const credCount = await CloudCredential.countDocuments({ orgId, isActive: true });
    if (credCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No cloud credentials configured. Add AWS, GCP, or Azure credentials first.'
      });
    }

    // Return immediately, run discovery async
    res.status(202).json({
      success: true,
      message: 'Cloud discovery started. Resources will appear in your data sources and cloud dashboard.'
    });

    runCloudDiscovery(orgId, req.user._id, credentialId).catch(err => {
      logger.error('[Cloud] Discovery failed:', err);
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get discovered cloud resources
// @route   GET /api/v1/cloud/resources
// @access  Private
exports.getCloudResources = async (req, res) => {
  try {
    const { orgId } = req.user;
    const cloudTypes = ['s3', 'azure_blob', 'google_drive', 'onedrive', 'sharepoint', 'gmail', 'exchange', 'slack', 'teams'];
    
    const sources = await DataSource.find({
      orgId,
      $or: [
        { infrastructure: 'cloud' },
        { type: { $in: cloudTypes } }
      ]
    }).sort({ createdAt: -1 });

    // Group by provider
    const byProvider = { aws: [], gcp: [], azure: [], other: [] };
    for (const source of sources) {
      if (source.name.startsWith('AWS ')) byProvider.aws.push(source);
      else if (source.name.startsWith('GCP ')) byProvider.gcp.push(source);
      else if (source.name.startsWith('Azure ')) byProvider.azure.push(source);
      else byProvider.other.push(source);
    }

    res.status(200).json({
      success: true,
      count: sources.length,
      data: { sources, byProvider }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get cloud provider summary stats
// @route   GET /api/v1/cloud/stats
// @access  Private
exports.getCloudStats = async (req, res) => {
  try {
    const { orgId } = req.user;
    const [credentials, resources] = await Promise.all([
      CloudCredential.find({ orgId, isActive: true }).select('-encryptedCredentials'),
      DataSource.find({ orgId, infrastructure: 'cloud' }).select('name type totalPIIFound riskScore')
    ]);

    res.status(200).json({
      success: true,
      data: {
        credentialsConfigured: credentials.length,
        resourcesDiscovered: resources.length,
        totalPIIFound: resources.reduce((s, r) => s + (r.totalPIIFound || 0), 0),
        credentials: credentials.map(c => ({
          id: c._id, label: c.label, provider: c.provider, status: c.status,
          discoveredResources: c.discoveredResources, lastDiscoveredAt: c.lastDiscoveredAt, lastError: c.lastError
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
