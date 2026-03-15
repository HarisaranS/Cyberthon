/**
 * Enterprise Scheduler
 * Manages all automated discovery, scanning, and maintenance tasks.
 * 
 * Schedule:
 *  - Hourly:           Health pings (alive check) of all known assets
 *  - Every 6 hours:    Credential auth test on unverified assets + cloud discovery
 *  - Daily at midnight: Full enterprise network asset discovery (port scan)
 *  - Daily at 2 AM:    Deep PII scans for all data sources
 *  - Every 2 hours:    Auto PII scans for all sources (quick)
 *  - Sunday 3 AM:      Cleanup old scan jobs
 */

const cron = require('node-cron');
const ScanJob = require('../models/ScanJob');
const DataSource = require('../models/DataSource');
const AssetInventory = require('../models/AssetInventory');
const Organisation = require('../models/Organization');
const User = require('../models/User');
const { runScan } = require('./scanService');
const { runEnterpriseDiscovery, discoverNetworkAssets } = require('./networkDiscoveryService');
const { testAssetCredentials } = require('./credentialAuthService');
const { runCloudDiscovery } = require('./cloudScanService');
const logger = require('../config/logger');

// ─── Helper: get org admin user ───────────────────────────────────────────────

async function getOrgAdmin(orgId) {
  try {
    const admin = await User.findOne({ orgId, role: { $in: ['super_admin', 'admin'] } }).select('_id');
    return admin?._id || orgId;
  } catch {
    return orgId;
  }
}

// ─── Task: Hourly Asset Health Ping ──────────────────────────────────────────

cron.schedule('0 * * * *', async () => {
  logger.info('[Scheduler] Running hourly asset health ping...');
  try {
    const net = require('net');
    const assets = await AssetInventory.find({ isAlive: true }).select('ip openPorts _id orgId');
    let updated = 0;
    for (const asset of assets) {
      // Quick check - ping first open port
      const firstPort = asset.openPorts?.[0]?.port;
      if (!firstPort) continue;
      const alive = await new Promise(resolve => {
        const s = new net.Socket();
        s.setTimeout(1200);
        s.on('connect', () => { s.destroy(); resolve(true); });
        s.on('error', () => resolve(false));
        s.on('timeout', () => { s.destroy(); resolve(false); });
        s.connect(firstPort, asset.ip);
      });
      if (!alive) {
        await AssetInventory.findByIdAndUpdate(asset._id, { isAlive: false });
        updated++;
      } else {
        await AssetInventory.findByIdAndUpdate(asset._id, { lastSeen: new Date() });
      }
    }
    logger.info(`[Scheduler] Health ping complete. ${updated} assets marked offline.`);
  } catch (err) {
    logger.error('[Scheduler] Health ping failed:', err);
  }
});

// ─── Task: Full Network Asset Discovery (Daily at midnight) ──────────────────

cron.schedule('0 0 * * *', async () => {
  logger.info('[Scheduler] Running daily full enterprise network discovery...');
  try {
    const orgs = await Organisation.find({ isActive: true });
    for (const org of orgs) {
      const adminId = await getOrgAdmin(org._id);
      const result = await runEnterpriseDiscovery(org._id, adminId);
      logger.info(`[Scheduler][${org.name}] Discovery: ${result.assetsDiscovered} assets, ${result.totalSourcesRegistered} new sources`);
    }
  } catch (err) {
    logger.error('[Scheduler] Daily discovery failed:', err);
  }
});

// ─── Task: Credential Auth Testing (Every 6 hours) ───────────────────────────

cron.schedule('0 */6 * * *', async () => {
  logger.info('[Scheduler] Running credential auth tests on unverified assets...');
  try {
    const orgs = await Organisation.find({ isActive: true });
    for (const org of orgs) {
      const adminId = await getOrgAdmin(org._id);
      // Test assets that haven't been authenticated yet
      const unverifiedAssets = await AssetInventory.find({
        orgId: org._id,
        authStatus: 'unknown',
        isAlive: true
      }).limit(50);

      for (const asset of unverifiedAssets) {
        await testAssetCredentials(asset, org._id, adminId).catch(e => 
          logger.warn(`[Scheduler] Auth test failed for ${asset.ip}: ${e.message}`)
        );
      }

      // Also run cloud discovery
      await runCloudDiscovery(org._id, adminId).catch(e =>
        logger.warn(`[Scheduler] Cloud discovery failed for org ${org.name}: ${e.message}`)
      );

      logger.info(`[Scheduler][${org.name}] Tested ${unverifiedAssets.length} assets`);
    }
  } catch (err) {
    logger.error('[Scheduler] Credential auth failed:', err);
  }
});

// ─── Task: Auto PII Scans (Every 2 hours) ────────────────────────────────────

cron.schedule('0 */2 * * *', async () => {
  logger.info('[Scheduler] Running automated PII scans...');
  try {
    const sources = await DataSource.find({ healthStatus: { $ne: 'error' }, isActive: true });
    for (const source of sources) {
      const existingScan = await ScanJob.findOne({
        connectorId: source._id, status: { $in: ['queued', 'running'] }
      });
      if (existingScan) continue;

      const job = await ScanJob.create({
        orgId: source.orgId, connectorId: source._id,
        name: `Auto-Scan: ${source.name}`,
        scanType: 'full', status: 'queued', progress: 0,
        totalFilesScanned: 0, totalPIIFound: 0,
        criticalFindings: 0, highFindings: 0, mediumFindings: 0, lowFindings: 0,
        scheduledScan: true
      });

      runScan(job._id.toString()).catch(err => {
        logger.error(`[Scheduler] PII scan failed for ${source.name}:`, err);
      });
      await new Promise(r => setTimeout(r, 5000)); // stagger
    }
  } catch (err) {
    logger.error('[Scheduler] Auto PII scan failed:', err);
  }
});

// ─── Task: Deep PII Scan (Daily at 2 AM) ─────────────────────────────────────

cron.schedule('0 2 * * *', async () => {
  logger.info('[Scheduler] Running daily deep PII scan...');
  try {
    const sources = await DataSource.find({ healthStatus: { $ne: 'error' }, isActive: true });
    for (const source of sources) {
      const job = await ScanJob.create({
        orgId: source.orgId, connectorId: source._id,
        name: `Deep Scan: ${source.name}`,
        scanType: 'deep', status: 'queued', progress: 0,
        totalFilesScanned: 0, totalPIIFound: 0,
        criticalFindings: 0, highFindings: 0, mediumFindings: 0, lowFindings: 0,
        scheduledScan: true
      });
      runScan(job._id.toString()).catch(err => {
        logger.error(`[Scheduler] Deep scan failed for ${source.name}:`, err);
      });
      await new Promise(r => setTimeout(r, 10000));
    }
  } catch (err) {
    logger.error('[Scheduler] Deep scan failed:', err);
  }
});

// ─── Task: Cleanup Old Scans (Sunday 3 AM) ───────────────────────────────────

cron.schedule('0 3 * * 0', async () => {
  logger.info('[Scheduler] Cleaning up old scan jobs...');
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await ScanJob.deleteMany({
      status: { $in: ['completed', 'failed'] }, completedAt: { $lt: thirtyDaysAgo }
    });
    logger.info(`[Scheduler] Deleted ${result.deletedCount} old scan jobs`);
  } catch (err) {
    logger.error('[Scheduler] Cleanup failed:', err);
  }
});

logger.info('[Scheduler] Enterprise automated tasks initialized:');
logger.info('  - Asset health pings:     Hourly');
logger.info('  - Network discovery:      Daily at midnight');
logger.info('  - Credential auth tests:  Every 6 hours');
logger.info('  - Auto PII scans:         Every 2 hours');
logger.info('  - Deep PII scans:         Daily at 2 AM');
logger.info('  - Cleanup:                Sunday at 3 AM');

module.exports = {};
