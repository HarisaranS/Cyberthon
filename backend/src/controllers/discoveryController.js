const { autoRegisterSources, scanLocalFileSystem } = require('../services/networkDiscoveryService');
const DataSource = require('../models/DataSource');
const ScanJob = require('../models/ScanJob');
const { runScan } = require('../services/scanService');
const logger = require('../config/logger');

// @desc    Trigger network discovery
// @route   POST /api/v1/discovery/scan
// @access  Private (admin only)
exports.discoverNetwork = async (req, res, next) => {
  try {
    const { orgId } = req.user;
    const userId = req.user._id;

    logger.info(`[Network Discovery] Manual trigger by user ${userId}`);

    // Discover network databases
    const sources = await autoRegisterSources(orgId, userId);
    
    // Discover local sensitive files
    const localSource = await scanLocalFileSystem(orgId, userId);

    const totalDiscovered = sources.length + (localSource ? 1 : 0);

    res.status(200).json({
      success: true,
      message: `Network discovery complete. Found ${totalDiscovered} new data sources.`,
      data: {
        databases: sources.length,
        localFiles: localSource ? 1 : 0,
        sources: sources.map(s => ({
          id: s._id,
          name: s.name,
          type: s.type
        }))
      }
    });
  } catch (err) {
    logger.error('[Network Discovery] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Network discovery failed',
      error: err.message
    });
  }
};

// @desc    Get all auto-discovered sources
// @route   GET /api/v1/discovery/sources
// @access  Private
exports.getDiscoveredSources = async (req, res, next) => {
  try {
    const { orgId } = req.user;

    const sources = await DataSource.find({
      orgId,
      autoDiscovered: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sources.length,
      data: sources
    });
  } catch (err) {
    logger.error('[Get Discovered Sources] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discovered sources',
      error: err.message
    });
  }
};

// @desc    Trigger scan for all discovered sources
// @route   POST /api/v1/discovery/scan-all
// @access  Private (admin only)
exports.scanAllDiscovered = async (req, res, next) => {
  try {
    const { orgId } = req.user;

    const sources = await DataSource.find({
      orgId,
      healthStatus: { $ne: 'error' }
    });

    const jobs = [];

    for (const source of sources) {
      // Check if there's already a running scan
      const existingScan = await ScanJob.findOne({
        connectorId: source._id,
        status: { $in: ['queued', 'running'] }
      });

      if (existingScan) {
        continue;
      }

      // Create scan job
      const job = await ScanJob.create({
        orgId,
        connectorId: source._id,
        name: `Manual Scan: ${source.name}`,
        scanType: 'full',
        status: 'queued',
        progress: 0,
        totalFilesScanned: 0,
        totalPIIFound: 0,
        criticalFindings: 0,
        highFindings: 0,
        mediumFindings: 0,
        lowFindings: 0,
        scheduledScan: false
      });

      jobs.push(job);

      // Run scan asynchronously
      runScan(job._id.toString()).catch(err => {
        logger.error(`[Scan All] Failed for ${source.name}:`, err);
      });
    }

    res.status(200).json({
      success: true,
      message: `Started ${jobs.length} scan jobs`,
      data: {
        totalSources: sources.length,
        scansStarted: jobs.length,
        jobs: jobs.map(j => ({
          id: j._id,
          name: j.name,
          status: j.status
        }))
      }
    });
  } catch (err) {
    logger.error('[Scan All] Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to start scans',
      error: err.message
    });
  }
};

module.exports = {
  discoverNetwork: exports.discoverNetwork,
  getDiscoveredSources: exports.getDiscoveredSources,
  scanAllDiscovered: exports.scanAllDiscovered
};
