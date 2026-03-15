const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const ScanResult = require('../models/ScanResult');
const ComplianceItem = require('../models/ComplianceItem');
const ConsentRecord = require('../models/ConsentRecord');
const Asset = require('../models/AssetInventory');
const Nomination = require('../models/Nomination');
const logger = require('../config/logger');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/reports');

const ensureDir = () => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
};

// --- Design System Helpers ---
const applyHeader = (doc, title, generatedByStr) => {
  doc.rect(0, 0, doc.page.width, 140).fill('#000000'); // Pure Black
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#FFFFFF').text('DataSentinel', 50, 40, { lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor('#CCCCCC').text('GLOBAL INTELLIGENCE NEXUS', 50, 72, { letterSpacing: 2, lineBreak: false });
  
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#FFFFFF').text(title, doc.page.width - 400, 45, { align: 'right', width: 350, lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor('#CCCCCC').text(`DATE: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, doc.page.width - 400, 70, { align: 'right', width: 350, lineBreak: false });
  doc.fontSize(10).font('Helvetica').fillColor('#CCCCCC').text(`ISSUER: ${generatedByStr.toUpperCase()}`, doc.page.width - 400, 85, { align: 'right', width: 350, lineBreak: false });
  
  doc.x = 50;
  doc.y = 170; // Reset Y and X for content
};

const applyFooter = (doc, pageNum) => {
  const bottom = doc.page.height - 50;
  doc.moveTo(50, bottom - 10).lineTo(doc.page.width - 50, bottom - 10).lineWidth(0.5).strokeColor('#000000').stroke();
  doc.fontSize(8).font('Helvetica').fillColor('#555555').text('DataSentinel Intelligence Engine • Strict Confidentiality', 50, bottom, { lineBreak: false });
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#000000').text(`PAGE ${pageNum}`, doc.page.width - 100, bottom, { align: 'right', width: 50, lineBreak: false });
};

// --- Report Generators ---

const generateConsentManagementReport = async (doc, orgId) => {
  const records = await ConsentRecord.find({ orgId }).sort({ grantedAt: -1 }).limit(100);
  
  doc.x = 50;
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Consent Management Ledger (Section 6)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#333333').text('Immutable registry of data principal consents, defining processing scope, legal basis, and cryptographic integrity states as mandated under DPDPA 2023.', { width: 495 });
  doc.moveDown(2);

  const startY = doc.y;
  doc.rect(50, startY, 495, 25).fill('#F2F2F2');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('PRINCIPAL', 60, startY + 8, { lineBreak: false });
  doc.text('PURPOSE / SCOPE', 200, startY + 8, { lineBreak: false });
  doc.text('GRANTED ON', 360, startY + 8, { lineBreak: false });
  doc.text('STATE', 460, startY + 8, { lineBreak: false });

  let currentY = startY + 35;
  
  if (records.length === 0) {
    doc.x = 60;
    doc.y = currentY;
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text('No active consent records found.');
  } else {
    records.forEach((record, idx) => {
      if (currentY > doc.page.height - 100) { doc.addPage(); currentY = 50; }
      
      doc.rect(50, currentY - 5, 495, 20).fill(idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA');
      
      const shortPurpose = record.purposeDescription?.substring(0, 25) + (record.purposeDescription?.length > 25 ? '...' : '') || 'General Processing';
      const dateStr = record.grantedAt ? new Date(record.grantedAt).toLocaleDateString() : 'Unknown';
      
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      doc.text(record.principalEmail || record.principalName || 'Anonymous', 60, currentY, { width: 130, height: 15, ellipsis: true, lineBreak: false });
      doc.fillColor('#333333').text(shortPurpose, 200, currentY, { width: 150, height: 15, ellipsis: true, lineBreak: false });
      doc.fillColor('#555555').text(dateStr, 360, currentY, { lineBreak: false });
      
      const st = record.status || 'active';
      let stColor = '#000000'; // Pure B&W formatting
      doc.font('Helvetica-Bold').fillColor(stColor).text(st.toUpperCase(), 460, currentY, { lineBreak: false });
      
      currentY += 25;
    });
  }
};

const generateNominationRegistryReport = async (doc, orgId) => {
  const nominations = await Nomination.find({ orgId }).sort({ lodgedAt: -1 }).limit(100);
  
  doc.x = 50;
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Nomination Delegate Registry (Section 10)');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#333333').text('Cryptographic ledger mapping data principals to authorized nominees for exercising rights in the event of incapacity or death, pursuant to DPDPA 2023 Section 10.', { width: 495 });
  doc.moveDown(2);

  const startY = doc.y;
  doc.rect(50, startY, 495, 25).fill('#F2F2F2');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
  doc.text('DATA PRINCIPAL', 60, startY + 8, { lineBreak: false });
  doc.text('AUTHORIZED NOMINEE', 210, startY + 8, { lineBreak: false });
  doc.text('RELATION', 350, startY + 8, { lineBreak: false });
  doc.text('INTEGRITY', 440, startY + 8, { lineBreak: false });

  let currentY = startY + 35;
  
  if (nominations.length === 0) {
    doc.x = 60;
    doc.y = currentY;
    doc.font('Helvetica').fontSize(10).fillColor('#555555').text('No registered nominations found.');
  } else {
    nominations.forEach((nom, idx) => {
      if (currentY > doc.page.height - 100) { doc.addPage(); currentY = 50; }
      
      doc.rect(50, currentY - 5, 495, 20).fill(idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA');
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      doc.text(nom.principalName, 60, currentY, { width: 140, height: 15, ellipsis: true, lineBreak: false });
      doc.fillColor('#333333').text(nom.nomineeName, 210, currentY, { width: 130, height: 15, ellipsis: true, lineBreak: false });
      doc.fillColor('#555555').text(nom.relation || 'Legal Heir', 350, currentY, { width: 80, height: 15, ellipsis: true, lineBreak: false });
      
      const st = nom.status || 'pending';
      let stColor = '#000000';
      doc.font('Helvetica-Bold').fillColor(stColor).text(st.toUpperCase(), 440, currentY, { lineBreak: false });
      
      currentY += 25;
    });
  }
};

const generateExecutiveSummary = async (doc, orgId) => {
  const [results, compItems, consents, nominations] = await Promise.all([
    ScanResult.find({ orgId }),
    ComplianceItem.find({ orgId }),
    ConsentRecord.find({ orgId }),
    Nomination.find({ orgId })
  ]);
  
  doc.x = 50;
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('Executive Briefing');
  doc.moveDown(1);
  
  // High level KPIs
  const critical = results.filter(r => r.sensitivityLevel === 'sensitive_personal').length;
  const compliantSections = compItems.filter(c => c.status === 'compliant').length;
  const totalSections = compItems.length || 1;
  const dpdpaScore = Math.round((compliantSections / totalSections) * 100);

  doc.rect(50, doc.y, 495, 90).lineWidth(1).strokeColor('#000000').stroke();
  doc.moveTo(215, doc.y).lineTo(215, doc.y + 90).strokeColor('#000000').stroke();
  doc.moveTo(380, doc.y).lineTo(380, doc.y + 90).strokeColor('#000000').stroke();
  
  const boxY = doc.y;
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555');
  doc.text('NEXUS HEALTH INDEX', 60, boxY + 15, { lineBreak: false });
  doc.text('CRITICAL RISKS', 227, boxY + 15, { lineBreak: false });
  doc.text('ACTIVE CONSENTS', 395, boxY + 15, { lineBreak: false });
  
  doc.fontSize(36).font('Helvetica-Bold').fillColor('#000000').text(`${dpdpaScore}%`, 60, boxY + 35, { lineBreak: false });
  doc.fillColor('#000000').text(critical.toString(), 227, boxY + 35, { lineBreak: false });
  doc.fillColor('#000000').text(consents.length.toString(), 395, boxY + 35, { lineBreak: false });

  doc.x = 50;
  doc.y = boxY + 120;
  
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Strategic Intelligence Summary');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#333333').text(`The organization is currently ${dpdpaScore}% aligned with global DPDPA standards. Operations are highly focused on Sections 6 and 10 of the act. The intelligence engine has scanned ${results.length} repositories, tracking ${consents.length} active consent ledgers and ${nominations.length} cryptographic succession mandates. Continued vigilance is advised for the ${critical} critical risk vectors identified in unstructured architectures.`, { width: 495, align: 'justify', lineHeight: 1.5 });
};

const generateAnnualAudit = async (doc, orgId) => {
  doc.x = 50;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000').text('Confidential Annual Enterprise Audit', { align: 'center', width: 495 });
  doc.moveDown(2);
  
  doc.x = 50;
  await generateExecutiveSummary(doc, orgId);
  doc.addPage();
  applyHeader(doc, 'Annual Audit - Consent Registry', 'System Architect');
  doc.x = 50;
  await generateConsentManagementReport(doc, orgId);
  doc.addPage();
  applyHeader(doc, 'Annual Audit - Nominations', 'System Architect');
  doc.x = 50;
  await generateNominationRegistryReport(doc, orgId);
};

// --- Main Builder ---
const generateReport = async (reportId) => {
  ensureDir();
  const report = await Report.findById(reportId).populate('generatedBy', 'name email');
  if (!report) return;

  report.status = 'generating';
  await report.save();

  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const filename = `report_${report.type}_${Date.now()}.pdf`;
    const filePath = path.join(UPLOADS_DIR, filename);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const generatedByName = report.generatedBy?.name || 'System Auto-Gen';
    applyHeader(doc, report.title.toUpperCase(), generatedByName);

    switch (report.type) {
      case 'consent_management': await generateConsentManagementReport(doc, report.orgId); break;
      case 'nomination_registry': await generateNominationRegistryReport(doc, report.orgId); break;
      case 'executive_summary': await generateExecutiveSummary(doc, report.orgId); break;
      case 'annual_audit': await generateAnnualAudit(doc, report.orgId); break;
      default: await generateExecutiveSummary(doc, report.orgId);
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
       doc.switchToPage(i);
       applyFooter(doc, i + 1);
    }

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    report.status = 'ready';
    report.fileUrl = `/uploads/reports/${filename}`;
    await report.save();

  } catch (err) {
    logger.error('Report generation error:', err);
    report.status = 'failed';
    await report.save();
  }
};

module.exports = { generateReport };
