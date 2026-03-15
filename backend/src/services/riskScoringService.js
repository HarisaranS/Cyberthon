const TYPE_WEIGHTS = {
  AADHAAR: 100, BIOMETRIC: 100, HEALTH: 95, PAN: 90,
  CREDIT_CARD: 88, FINANCIAL: 82, PASSPORT: 82, VOTER_ID: 78,
  DRIVING_LICENSE: 75, GSTIN: 60, MOBILE: 52, EMAIL: 42,
  NAME: 35, ADDRESS: 45, DOB: 60, PIN_CODE: 25
};

const scoreAsset = (detections = [], context = {}) => {
  if (!detections.length) return 0;
  let baseScore = Math.max(...detections.map(d => TYPE_WEIGHTS[d.pii_type?.toUpperCase()] || 30));
  if (context.unencrypted) baseScore = Math.min(100, baseScore + 20);
  if (context.noConsent) baseScore = Math.min(100, baseScore + 25);
  if (context.retentionExpired) baseScore = Math.min(100, baseScore + 15);
  return Math.round(baseScore);
};

const mapToSensitivity = (score) => {
  if (score >= 80) return 'sensitive_personal';
  if (score >= 60) return 'personal';
  if (score >= 40) return 'internal';
  return 'public';
};

module.exports = { scoreAsset, mapToSensitivity };
