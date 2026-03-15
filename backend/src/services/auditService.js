const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

/**
 * Creates a cryptographically linked audit log entry for DPDPA compliance.
 */
const logAction = async ({
  orgId,
  userId,
  userEmail,
  userRole,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
  userAgent,
  outcome = 'success'
}) => {
  try {
    // Get the last log entry's hash for the chain
    const lastLog = await AuditLog.findOne({ orgId }).sort({ timestamp: -1 });
    const prevHash = lastLog ? lastLog.entryHash : 'GENESIS';

    const logEntry = new AuditLog({
      orgId, userId, userEmail, userRole, action,
      resourceType, resourceId, details, ipAddress, userAgent,
      outcome, prevHash
    });

    // Compute entry hash: SHA256(prevHash + action + timestamp + detailsString)
    const hashPayload = `${prevHash}|${action}|${logEntry.timestamp.toISOString()}|${JSON.stringify(details || {})}`;
    logEntry.entryHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    await logEntry.save();
    return logEntry;
  } catch (err) {
    logger.error('AuditLog creation failed:', err);
    // Don't throw - audit logging should not break the main flow but should be robust
  }
};

module.exports = { logAction };
