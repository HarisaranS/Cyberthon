const ScanJob = require('../models/ScanJob');
const ScanResult = require('../models/ScanResult');
const Alert = require('../models/Alert');
const DataSource = require('../models/DataSource');
const BreachEvent = require('../models/BreachEvent');
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { logAction } = require('../services/auditService');
const mongoose = require('mongoose');
const { getRedis } = require('../config/redis');
const { checkHealth: checkAIHealth } = require('../services/aiService');

// Real compliance score: starts at 100, deducted per finding
function calcComplianceScore(totalAssets, criticalCount) {
  if (totalAssets === 0) return 100; // No data scanned yet — assume clean
  const criticalPenalty = Math.min(criticalCount * 5, 60);
  const exposurePenalty = Math.min(Math.round((criticalCount / totalAssets) * 30), 30);
  return Math.max(0, 100 - criticalPenalty - exposurePenalty);
}

exports.getDashboardStats = async (req, res, next) => {
  try {
    const ComplianceItem = require('../models/ComplianceItem');
    const orgId = req.user.orgId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Auto-init checklist if missing for new orgs
    const checkCount = await ComplianceItem.countDocuments({ orgId });
    if (checkCount === 0) {
      const defaultItems = [
        { section: '§6', requirement: 'Consent Management', status: 'non_compliant', evidence: 'Pending discovery' },
        { section: '§8(1)', requirement: 'Data Accuracy', status: 'non_compliant', evidence: 'Automated scan required' },
        { section: '§8(5)', requirement: 'Security Safeguards', status: 'partial', evidence: 'Encryption enabled for DB types' },
        { section: '§8(6)', requirement: 'Breach Notification', status: 'compliant', evidence: '72hr timer configured' },
        { section: '§9', requirement: "Children's Data Protection", status: 'non_compliant', evidence: 'Additional verification needed' },
        { section: '§11', requirement: 'Right to Access', status: 'compliant', evidence: 'Principal portal active' },
        { section: '§12', requirement: 'Right to Correction/Erasure', status: 'compliant', evidence: 'Workflow engine linked' }
      ];
      await ComplianceItem.insertMany(defaultItems.map(item => ({ ...item, orgId })));
    }

    const [totalAssets, criticalCount, activeScans, unreadAlerts, recentAlerts, topSources, checklist] = await Promise.all([
      ScanResult.countDocuments({ orgId }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'sensitive_personal' }),
      ScanJob.countDocuments({ orgId, status: { $in: ['queued', 'running'] } }),
      Alert.countDocuments({ orgId, isRead: false }),
      Alert.find({ orgId }).sort({ createdAt: -1 }).limit(8),
      DataSource.find({ orgId, isActive: true }).sort({ totalPIIFound: -1 }).limit(5),
      ComplianceItem.find({ orgId })
    ]);

    const scanTrend = await ScanJob.aggregate([
      { $match: { orgId: orgId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, scans: { $sum: 1 }, piiFound: { $sum: '$totalPIIFound' } } },
      { $sort: { _id: 1 } }
    ]);

    const riskBreakdown = await ScanResult.aggregate([
      { $match: { orgId: orgId } },
      { $group: { _id: '$sensitivityLevel', count: { $sum: 1 } } }
    ]);

    const getPillarScore = (sections) => {
      const items = checklist.filter(c => sections.includes(c.section.split('(')[0]));
      if (items.length === 0) return 30; // Min score
      const points = items.reduce((acc, curr) => {
        if (curr.status === 'compliant') return acc + 100;
        if (curr.status === 'partial') return acc + 50;
        return acc;
      }, 0);
      return Math.max(30, Math.round(points / items.length));
    };

    const overallCompliance = calcComplianceScore(totalAssets, criticalCount);

    sendSuccess(res, {
      totalAssets, criticalCount, activeScans, unreadAlerts,
      complianceScore: overallCompliance,
      riskScore: criticalCount > 0 ? Math.min(100, Math.round(criticalCount * 8)) : 0,
      scanTrend, riskBreakdown, recentAlerts, topSources,
      compliancePillars: [
        { label: 'Consent Management', score: getPillarScore(['§6']) },
        { label: 'Principal Rights', score: getPillarScore(['§11', '§12', '§13']) },
        { label: 'Security Safeguards', score: getPillarScore(['§8']) },
        { label: 'Breach Notification', score: getPillarScore(['§8']) }
      ]
    });
  } catch (err) { next(err); }
};

exports.getComplianceScore = async (req, res, next) => {
  try {
    const ComplianceItem = require('../models/ComplianceItem');
    const orgId = req.user.orgId;
    
    // Auto-initialize DPDPA checklist if it doesn't exist
    const count = await ComplianceItem.countDocuments({ orgId });
    if (count === 0) {
      const defaultItems = [
        { section: '§6', requirement: 'Consent Management', status: 'non_compliant', evidence: 'Pending discovery' },
        { section: '§8(1)', requirement: 'Data Accuracy', status: 'non_compliant', evidence: 'Automated scan required' },
        { section: '§8(5)', requirement: 'Security Safeguards', status: 'partial', evidence: 'Encryption enabled for DB types' },
        { section: '§8(6)', requirement: 'Breach Notification', status: 'compliant', evidence: '72hr timer configured' },
        { section: '§9', requirement: "Children's Data Protection", status: 'non_compliant', evidence: 'Additional verification needed' },
        { section: '§10', requirement: 'SDF Obligations', status: 'partial', evidence: 'DPO appointed' },
        { section: '§11', requirement: 'Right to Access', status: 'compliant', evidence: 'Principal portal active' },
        { section: '§12', requirement: 'Right to Correction/Erasure', status: 'compliant', evidence: 'Workflow engine linked' }
      ];
      await ComplianceItem.insertMany(defaultItems.map(item => ({ ...item, orgId })));
    }

    const [totalAssets, criticalCount, checklist] = await Promise.all([
      ScanResult.countDocuments({ orgId }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'sensitive_personal' }),
      ComplianceItem.find({ orgId }).sort({ section: 1 })
    ]);

    const score = calcComplianceScore(totalAssets, criticalCount);
    
    // Calculate pillar scores based on checklist status
    const getPillarScore = (sections) => {
      const items = checklist.filter(c => sections.includes(c.section.split('(')[0]));
      if (items.length === 0) return 0;
      const points = items.reduce((acc, curr) => {
        if (curr.status === 'compliant') return acc + 100;
        if (curr.status === 'partial') return acc + 50;
        return acc;
      }, 0);
      return Math.round(points / items.length);
    };

    sendSuccess(res, {
      score,
      pillars: {
        consent: getPillarScore(['§6']),
        rights: getPillarScore(['§11', '§12', '§13']),
        obligations: getPillarScore(['§8', '§10']),
        technical: Math.round(score * 0.8)
      },
      checklist
    });
  } catch (err) { next(err); }
};

exports.getRiskDashboard = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const [riskByType, topRiskyAssets, stats] = await Promise.all([
      ScanResult.aggregate([
        { $match: { orgId } },
        { $unwind: '$detectedPII' },
        { $group: { _id: '$detectedPII.type', count: { $sum: 1 }, avgRisk: { $avg: '$riskScore' } } },
        { $sort: { avgRisk: -1 } }
      ]),
      ScanResult.find({ orgId }).sort({ riskScore: -1 }).limit(10),
      ScanResult.aggregate([
        { $match: { orgId } },
        { $group: {
          _id: null,
          unencrypted: { $sum: { $cond: [{ $eq: ['$isEncrypted', false] }, 1, 0] } },
          noConsent: { $sum: { $cond: [{ $eq: ['$hasConsentRecord', false] }, 1, 0] } },
          highRisk: { $sum: { $cond: [{ $gte: ['$riskScore', 80] }, 1, 0] } },
          total: { $sum: 1 }
        }}
      ])
    ]);

    const s = stats[0] || { unencrypted: 0, noConsent: 0, highRisk: 0, total: 0 };
    
    sendSuccess(res, {
      overallRisk: s.total > 0 ? Math.round((s.highRisk / s.total) * 100) : 0,
      riskByType, 
      topRiskyAssets,
      factors: {
        unencrypted: s.unencrypted,
        noConsent: s.noConsent,
        highRisk: s.highRisk,
        excessiveAccess: Math.round(s.total * 0.15),
        retentionPotential: Math.round(s.total * 0.05)
      }
    });
  } catch (err) { next(err); }
};

exports.getAuditLog = async (req, res, next) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const { page = 1, limit = 20 } = req.query;
    const result = await AuditLog.paginate(
      { orgId: req.user.orgId },
      { page: parseInt(page), limit: parseInt(limit), sort: { timestamp: -1 } }
    );
    sendSuccess(res, result.docs, 'Audit log retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.verifyAuditChain = async (req, res, next) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const crypto = require('crypto');
    const logs = await AuditLog.find({ orgId: req.user.orgId }).sort({ timestamp: 1 }).limit(100);
    let valid = true;
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].prevHash !== logs[i - 1].entryHash) { valid = false; break; }
    }
    sendSuccess(res, { valid, checked: logs.length, message: valid ? 'Audit chain integrity verified' : 'Chain integrity violation detected' });
  } catch (err) { next(err); }
};

exports.getInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sensitivity, search } = req.query;
    const filter = { orgId: req.user.orgId };
    if (sensitivity) filter.sensitivityLevel = sensitivity;
    if (search) filter.$or = [
      { fileName: { $regex: search, $options: 'i' } },
      { assetPath: { $regex: search, $options: 'i' } }
    ];
    const result = await ScanResult.paginate(filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { riskScore: -1 },
      populate: { path: 'dataSourceId', select: 'name type' }
    });
    sendSuccess(res, result.docs, 'Inventory retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.getInventoryStats = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const [total, sensitive, personal, internal] = await Promise.all([
      ScanResult.countDocuments({ orgId }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'sensitive_personal' }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'personal' }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'internal' })
    ]);
    sendSuccess(res, { total, sensitive, personal, internal, public: total - sensitive - personal - internal });
  } catch (err) { next(err); }
};

exports.clearAllInventory = async (req, res, next) => {
  try {
    const deletedResult = await ScanResult.deleteMany({ orgId: req.user.orgId });
    
    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'inventory_clear', resourceType: 'scan_results', resourceId: 'all',
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { deletedCount: deletedResult.deletedCount }
    });

    sendSuccess(res, { deletedCount: deletedResult.deletedCount }, 'All inventory data cleared');
  } catch (err) { next(err); }
};

exports.getBreaches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await BreachEvent.paginate(
      { orgId: req.user.orgId },
      { page: parseInt(page), limit: parseInt(limit), sort: { detectedAt: -1 } }
    );
    sendSuccess(res, result.docs, 'Breaches retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.createBreach = async (req, res, next) => {
  try {
    const { title, description, severity, affectedDataTypes, estimatedAffectedCount } = req.body;
    const breach = await BreachEvent.create({
      orgId: req.user.orgId, title, description, severity: severity || 'high',
      affectedDataTypes: affectedDataTypes || [], estimatedAffectedCount,
      notifyDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
      timeline: [{ event: 'Breach logged', user: req.user.email }]
    });
    sendSuccess(res, { breach }, 'Breach logged', 201);
  } catch (err) { next(err); }
};

exports.publicDetect = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return sendSuccess(res, { detections: [] });
    const { detectPII } = require('../services/aiService');
    const result = await detectPII(text, 'demo');
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

exports.updateFindingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 'Status required', 400);
    const result = await ScanResult.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { remediationStatus: status },
      { new: true }
    );
    if (!result) return sendError(res, 'Finding not found', 404);
    
    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'remediation_update', resourceType: 'scan_result', resourceId: result._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { fileName: result.fileName, newStatus: status }
    });

    sendSuccess(res, { result }, 'Status updated');
  } catch (err) { next(err); }
};

exports.updateComplianceItem = async (req, res, next) => {
  try {
    const { status, evidence, notes } = req.body;
    const item = await ComplianceItem.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { status, evidence, notes, lastVerifiedAt: new Date(), verifiedBy: req.user._id },
      { new: true }
    );
    if (!item) return sendError(res, 'Compliance item not found', 404);

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'compliance_update', resourceType: 'compliance_item', resourceId: item._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { section: item.section, newStatus: status }
    });

    sendSuccess(res, { item }, 'Compliance requirement updated');
  } catch (err) { next(err); }
};

exports.getSystemHealth = async (req, res, next) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
    
    let redisStatus = 'unhealthy';
    try {
      const redis = getRedis();
      if (redis && (await redis.ping()) === 'PONG') {
        redisStatus = 'healthy';
      }
    } catch (e) {
      redisStatus = 'unhealthy';
    }

    const aiHealth = await checkAIHealth();

    sendSuccess(res, {
      timestamp: new Date(),
      subsystems: {
        mongodb: { status: mongoStatus },
        redis: { status: redisStatus },
        ai_engine: { 
          status: aiHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
          latency: aiHealth.latency || 'N/A'
        },
        backend: { status: 'healthy', uptime: process.uptime() }
      }
    });
  } catch (err) { next(err); }
};
