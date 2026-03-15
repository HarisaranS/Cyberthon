const ScanJob = require('../models/ScanJob');
const ScanResult = require('../models/ScanResult');
const DataSource = require('../models/DataSource');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { runScan } = require('../services/scanService');
const { logAction } = require('../services/auditService');

exports.startScan = async (req, res, next) => {
  try {
    const { connectorId, name } = req.body;
    const source = await DataSource.findOne({ _id: connectorId, orgId: req.user.orgId });
    if (!source) return sendError(res, 'Data source not found', 404);

    const job = await ScanJob.create({
      orgId: req.user.orgId, connectorId, name: name || `Scan of ${source.name}`,
      status: 'queued', triggerType: 'manual', createdBy: req.user._id
    });

    // Run scan asynchronously
    setTimeout(() => runScan(job._id).catch(console.error), 100);

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'scan_start', resourceType: 'scan_job', resourceId: job._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { name: job.name, sourceId: connectorId }
    });

    sendSuccess(res, { job }, 'Scan started', 201);
  } catch (err) { next(err); }
};

exports.getScans = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, infrastructure } = req.query;
    const filter = { orgId: req.user.orgId };
    if (status) filter.status = status;

    // If infrastructure filter is provided, get sources with that infrastructure
    if (infrastructure) {
      const sources = await DataSource.find({ orgId: req.user.orgId, infrastructure }).select('_id');
      const sourceIds = sources.map(s => s._id);
      filter.connectorId = { $in: sourceIds };
    }

    const result = await ScanJob.paginate(filter, {
      page: parseInt(page), limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'connectorId', select: 'name type infrastructure' }
    });

    sendSuccess(res, result.docs, 'Scans retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.getScan = async (req, res, next) => {
  try {
    const job = await ScanJob.findOne({ _id: req.params.id, orgId: req.user.orgId }).populate('connectorId', 'name type');
    if (!job) return sendError(res, 'Scan not found', 404);
    sendSuccess(res, { job });
  } catch (err) { next(err); }
};

exports.getScanResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await ScanResult.paginate(
      { scanJobId: req.params.id, orgId: req.user.orgId },
      { page: parseInt(page), limit: parseInt(limit), sort: { riskScore: -1 } }
    );
    sendSuccess(res, result.docs, 'Results retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.getActiveScans = async (req, res, next) => {
  try {
    const scans = await ScanJob.find({ orgId: req.user.orgId, status: { $in: ['queued', 'running'] } }).populate('connectorId', 'name type');
    sendSuccess(res, scans);
  } catch (err) { next(err); }
};

exports.getScanStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stats = await ScanJob.aggregate([
      { $match: { orgId: req.user.orgId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, piiFound: { $sum: '$totalPIIFound' } } },
      { $sort: { _id: 1 } }
    ]);
    sendSuccess(res, stats);
  } catch (err) { next(err); }
};

exports.cancelScan = async (req, res, next) => {
  try {
    const job = await ScanJob.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId, status: { $in: ['queued', 'running'] } },
      { status: 'cancelled' }, { new: true }
    );
    if (!job) return sendError(res, 'Scan not found or already completed', 404);

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'scan_cancel', resourceType: 'scan_job', resourceId: job._id,
      ipAddress: req.ip, userAgent: req.get('user-agent')
    });

    sendSuccess(res, { job }, 'Scan cancelled');
  } catch (err) { next(err); }
};
