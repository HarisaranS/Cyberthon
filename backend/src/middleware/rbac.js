const ROLE_HIERARCHY = {
  super_admin: 5, admin: 4, dpo: 3, analyst: 2, viewer: 1
};

const rbac = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (roles.includes(req.user.role)) return next();
  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = Math.min(...roles.map(r => ROLE_HIERARCHY[r] || 99));
  if (userLevel >= requiredLevel) return next();
  return res.status(403).json({ success: false, message: 'Insufficient permissions for this action' });
};

module.exports = { rbac };
