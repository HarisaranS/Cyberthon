const axios = require('axios');
const logger = require('../config/logger');
const ScanResult = require('../models/ScanResult');
const DataSource = require('../models/DataSource');
const ComplianceItem = require('../models/ComplianceItem');

const AI_URL = process.env.AI_ENGINE_URL || 'http://ai-engine:8000';

const detectPII = async (text, sourceType = 'file') => {
  try {
    const res = await axios.post(`${AI_URL}/detect`, { text, source_type: sourceType }, { timeout: 30000 });
    return res.data;
  } catch (err) {
    logger.error(`AI detect error [${err.response?.status || 'no_response'}]: ${err.message}`, { data: err.response?.data });
    return { detections: [], total_found: 0 };
  }
};

// PII type risk mapping
const PII_RISK_MAP = {
  'AADHAAR': { risk_score: 95, sensitivity_level: 'sensitive_personal' },
  'PAN': { risk_score: 90, sensitivity_level: 'sensitive_personal' },
  'PASSPORT': { risk_score: 90, sensitivity_level: 'sensitive_personal' },
  'CREDIT_CARD': { risk_score: 95, sensitivity_level: 'sensitive_personal' },
  'DRIVING_LICENSE': { risk_score: 85, sensitivity_level: 'sensitive_personal' },
  'VOTER_ID': { risk_score: 80, sensitivity_level: 'personal' },
  'MOBILE': { risk_score: 70, sensitivity_level: 'personal' },
  'EMAIL': { risk_score: 60, sensitivity_level: 'personal' },
  'DOB': { risk_score: 65, sensitivity_level: 'personal' },
  'NAME': { risk_score: 50, sensitivity_level: 'personal' },
  'GSTIN': { risk_score: 75, sensitivity_level: 'personal' },
  'UPI': { risk_score: 80, sensitivity_level: 'sensitive_personal' },
  'IFSC': { risk_score: 55, sensitivity_level: 'internal' }
};

const classifyRisk = async (detections, context = {}) => {
  try {
    // Calculate average risk score based on PII types
    if (!detections || detections.length === 0) {
      return { sensitivity_level: 'internal', risk_score: 0 };
    }

    let totalScore = 0;
    let maxScore = 0;
    const piiTypes = new Set();

    detections.forEach(d => {
      const piiType = d.pii_type || d.type || 'UNKNOWN';
      piiTypes.add(piiType);
      
      const riskInfo = PII_RISK_MAP[piiType] || { risk_score: 50, sensitivity_level: 'internal' };
      totalScore += riskInfo.risk_score;
      maxScore = Math.max(maxScore, riskInfo.risk_score);
    });

    const avgScore = Math.round(totalScore / detections.length);
    
    // Determine sensitivity level based on max score
    let sensitivityLevel = 'internal';
    if (maxScore >= 90) {
      sensitivityLevel = 'sensitive_personal';
    } else if (maxScore >= 75) {
      sensitivityLevel = 'personal';
    } else if (maxScore >= 60) {
      sensitivityLevel = 'personal';
    } else {
      sensitivityLevel = 'internal';
    }

    // Adjust based on context
    if (context.internet_exposed) {
      sensitivityLevel = 'sensitive_personal';
    }

    return {
      sensitivity_level: sensitivityLevel,
      risk_score: avgScore,
      pii_types: Array.from(piiTypes)
    };
  } catch (err) {
    logger.error(`AI classify error: ${err.message}`);
    return { sensitivity_level: 'internal', risk_score: 0 };
  }
};

const submitFeedback = async (feedback, orgId) => {
  try {
    const res = await axios.post(`${AI_URL}/retrain`, { feedback, org_id: orgId }, { timeout: 10000 });
    return res.data;
  } catch (err) {
    logger.error('AI retrain error:', err.message);
    return { status: 'error', message: err.message };
  }
};

const checkHealth = async () => {
  try {
    const res = await axios.get(`${AI_URL}/health`, { timeout: 5000 });
    return { status: 'healthy', ...res.data };
  } catch (err) {
    return { status: 'unreachable', error: err.message };
  }
};

const getSystemStateContext = async (orgId) => {
  try {
    const [totalPII, assetCount, dataSources, complianceItems] = await Promise.all([
      ScanResult.countDocuments({ orgId }),
      ScanResult.countDocuments({ orgId, sensitivityLevel: 'sensitive_personal' }),
      DataSource.countDocuments({ orgId, isActive: true }),
      ComplianceItem.find({ orgId })
    ]);

    const activeScans = await require('../models/ScanJob').countDocuments({ orgId, status: 'running' });
    
    const compliantCount = complianceItems.filter(i => i.status === 'compliant').length;
    const totalReqs = complianceItems.length;
    const compliancePercent = totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 0;

    return `CURRENT SYSTEM STATE:
- Total PII Assets: ${totalPII}
- Critical Risk Assets: ${assetCount}
- Active Data Sources: ${dataSources}
- Active Scans: ${activeScans}
- DPDPA Section Compliance: ${compliancePercent}% (${compliantCount}/${totalReqs} requirements met)`;
  } catch (err) {
    logger.error('Error fetching system state for AI:', err);
    return 'System state unavailable.';
  }
};

module.exports = { detectPII, classifyRisk, submitFeedback, checkHealth, getSystemStateContext, AI_URL };
