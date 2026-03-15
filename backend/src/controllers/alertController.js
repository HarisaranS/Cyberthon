const Alert = require('../models/Alert');
const { sendSuccess, sendError } = require('../utils/responseUtils');

exports.getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, severity, isRead } = req.query;
    const filter = { orgId: req.user.orgId };
    if (severity) filter.severity = severity;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const result = await Alert.paginate(filter, {
      page: parseInt(page), limit: parseInt(limit), sort: { createdAt: -1 }
    });
    sendSuccess(res, result.docs, 'Alerts retrieved', 200, {
      total: result.totalDocs, page: result.page, pages: result.totalPages
    });
  } catch (err) { next(err); }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Alert.countDocuments({ orgId: req.user.orgId, isRead: false });
    sendSuccess(res, { count });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    await Alert.findOneAndUpdate({ _id: req.params.id, orgId: req.user.orgId }, { isRead: true });
    sendSuccess(res, {}, 'Alert marked as read');
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Alert.updateMany({ orgId: req.user.orgId, isRead: false }, { isRead: true });
    sendSuccess(res, {}, 'All alerts marked as read');
  } catch (err) { next(err); }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      { isResolved: true, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return sendError(res, 'Alert not found', 404);
    sendSuccess(res, { alert }, 'Alert resolved');
  } catch (err) { next(err); }
};
