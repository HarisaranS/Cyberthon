const Report = require('../models/Report');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { generateReport } = require('../services/reportService');
const { logAction } = require('../services/auditService');
const path = require('path');

exports.getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await Report.paginate(
      { orgId: req.user.orgId },
      { page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 }, populate: { path: 'generatedBy', select: 'name' } }
    );
    sendSuccess(res, result.docs, 'Reports retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { type, title, parameters } = req.body;
    if (!type) return sendError(res, 'Report type required', 400);

    const report = await Report.create({
      orgId: req.user.orgId, type, title: title || `${type.replace(/_/g, ' ')} Report`,
      generatedBy: req.user._id, status: 'queued', parameters
    });

    setTimeout(() => generateReport(report._id).catch(console.error), 100);

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'report_generate', resourceType: 'report', resourceId: report._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { type, title: report.title }
    });

    sendSuccess(res, { report }, 'Report generation started', 201);
  } catch (err) { next(err); }
};

exports.getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, orgId: req.user.orgId }).populate('generatedBy', 'name');
    if (!report) return sendError(res, 'Report not found', 404);
    sendSuccess(res, { report });
  } catch (err) { next(err); }
};

exports.downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!report || !report.fileUrl) return sendError(res, 'Report file not available', 404);
    const filePath = path.join(__dirname, '../../', report.fileUrl);
    res.download(filePath, `${report.title}.pdf`);
  } catch (err) { next(err); }
};

exports.deleteReport = async (req, res, next) => {
  try {
    await Report.findOneAndDelete({ _id: req.params.id, orgId: req.user.orgId });
    sendSuccess(res, {}, 'Report deleted');
  } catch (err) { next(err); }
};
