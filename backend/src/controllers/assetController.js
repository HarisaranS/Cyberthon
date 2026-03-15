const mongoose = require('mongoose');
const AssetInventory = require('../models/AssetInventory');
const DataSource = require('../models/DataSource');
const ScanJob = require('../models/ScanJob');
const { discoverNetworkAssets, runEnterpriseDiscovery } = require('../services/networkDiscoveryService');
const { testAssetCredentials } = require('../services/credentialAuthService');
const { runScan } = require('../services/scanService');
const logger = require('../config/logger');

// @desc    Get all IT assets
// @route   GET /api/v1/assets
// @access  Private
exports.getAssets = async (req, res, next) => {
  try {
    const { orgId } = req.user;
    const { page = 1, limit = 50, assetType, authStatus, isAlive } = req.query;

    const filter = { orgId };
    if (assetType) filter.assetType = assetType;
    if (authStatus) filter.authStatus = authStatus;
    if (isAlive !== undefined) filter.isAlive = isAlive === 'true';

    const options = {
      page: parseInt(page), limit: parseInt(limit),
      sort: { lastSeen: -1 },
      populate: { path: 'dataSourceIds', select: 'name type totalPIIFound' }
    };

    const result = await AssetInventory.paginate(filter, options);

    res.status(200).json({
      success: true,
      count: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.page,
      data: result.docs
    });
  } catch (err) {
    logger.error('[Assets] getAssets error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single asset detail
// @route   GET /api/v1/assets/:id
// @access  Private
exports.getAsset = async (req, res, next) => {
  try {
    const asset = await AssetInventory.findOne({
      _id: req.params.id, orgId: req.user.orgId
    }).populate('dataSourceIds');

    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.status(200).json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get asset inventory stats
// @route   GET /api/v1/assets/stats
// @access  Private
exports.getAssetStats = async (req, res, next) => {
  try {
    const { orgId } = req.user;

    const [totalAssets, aliveAssets, accessibleAssets, byType] = await Promise.all([
      AssetInventory.countDocuments({ orgId }),
      AssetInventory.countDocuments({ orgId, isAlive: true }),
      AssetInventory.countDocuments({ orgId, authStatus: { $in: ['accessible_no_auth', 'accessible_credentials'] } }),
      AssetInventory.aggregate([
        { $match: { orgId: new mongoose.Types.ObjectId(orgId) } },
        { $group: { _id: '$assetType', count: { $sum: 1 }, piiFound: { $sum: '$totalPIIFound' } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const lastDiscovery = await AssetInventory.findOne({ orgId }).sort({ updatedAt: -1 }).select('updatedAt');

    res.status(200).json({
      success: true,
      data: {
        totalAssets,
        aliveAssets,
        accessibleAssets,
        accessRate: totalAssets > 0 ? Math.round((accessibleAssets / totalAssets) * 100) : 0,
        lastDiscovery: lastDiscovery?.updatedAt,
        byType
      }
    });
  } catch (err) {
    logger.error('[Assets] getAssetStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Trigger full enterprise network discovery
// @route   POST /api/v1/assets/discover
// @access  Private (admin only)
exports.triggerDiscovery = async (req, res, next) => {
  try {
    const { orgId } = req.user;
    const userId = req.user._id;

    logger.info(`[Assets] Discovery triggered by user ${userId}`);

    // Start discovery async but return immediately
    res.status(202).json({
      success: true,
      message: 'Network discovery started. Results will appear in the asset inventory as they are found. This may take 2-5 minutes for large networks.'
    });

    // Run in background
    runEnterpriseDiscovery(orgId, userId).catch(err => {
      logger.error('[Assets] Discovery failed:', err);
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Test credentials against a specific asset
// @route   POST /api/v1/assets/:id/authenticate
// @access  Private (admin only)
exports.authenticateAsset = async (req, res, next) => {
  try {
    const { orgId } = req.user;
    const asset = await AssetInventory.findOne({ _id: req.params.id, orgId });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const customCreds = req.body.credentials || [];
    const result = await testAssetCredentials(asset, orgId, req.user._id, customCreds);

    res.status(200).json({
      success: true,
      message: result.accessibleServices.length > 0
        ? `Successfully authenticated to ${result.accessibleServices.length} service(s)`
        : 'Could not authenticate with available credentials. Try adding custom credentials.',
      data: result
    });
  } catch (err) {
    logger.error('[Assets] authenticateAsset error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start a PII scan on an asset's linked data sources
// @route   POST /api/v1/assets/:id/scan
// @access  Private
exports.scanAsset = async (req, res, next) => {
  try {
    const { orgId } = req.user;
    const asset = await AssetInventory.findOne({ _id: req.params.id, orgId }).populate('dataSourceIds');
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    if (!asset.dataSourceIds || asset.dataSourceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No data sources linked to this asset. Run authentication first.' });
    }

    const jobs = [];
    for (const source of asset.dataSourceIds) {
      const existingScan = await ScanJob.findOne({ connectorId: source._id, status: { $in: ['queued', 'running'] } });
      if (existingScan) continue;

      const job = await ScanJob.create({
        orgId, connectorId: source._id,
        name: `Asset Scan: ${asset.ip} - ${source.name}`,
        scanType: 'full', status: 'queued', progress: 0,
        totalFilesScanned: 0, totalPIIFound: 0,
        criticalFindings: 0, highFindings: 0, mediumFindings: 0, lowFindings: 0,
        scheduledScan: false, createdBy: req.user._id
      });
      jobs.push(job);
      runScan(job._id.toString()).catch(err => logger.error(`[Assets] Scan failed for ${source.name}: ${err.message}`));
    }

    res.status(200).json({
      success: true,
      message: `Started ${jobs.length} scan job(s) for asset ${asset.ip}`,
      data: { assetId: asset._id, ip: asset.ip, jobsStarted: jobs.length }
    });
  } catch (err) {
    logger.error('[Assets] scanAsset error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
