const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const auditLog = (action, resourceType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (req.user && data.success) {
      try {
        const last = await AuditLog.findOne({}, {}, { sort: { timestamp: -1 } });
        const prevHash = last?.entryHash || '0';
        const entryData = JSON.stringify({
          userId: req.user._id, action, resourceType,
          details: { method: req.method, path: req.path },
          timestamp: new Date().toISOString(), prevHash
        });
        const entryHash = crypto.createHash('sha256').update(entryData).digest('hex');
        await AuditLog.create({
          orgId: req.user.orgId, userId: req.user._id,
          userEmail: req.user.email, userRole: req.user.role,
          action, resourceType,
          details: { method: req.method, body: req.body },
          ipAddress: req.ip, userAgent: req.get('user-agent'),
          outcome: 'success', prevHash, entryHash
        });
      } catch (err) {
        logger.error('Audit log error:', err);
      }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { auditLog };
