const mongoose = require('mongoose');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const ConsentRecord = require('./src/models/ConsentRecord');
const Nomination = require('./src/models/Nomination');
const ComplianceItem = require('./src/models/ComplianceItem');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? 'mongodb://mongodb:27017/datasentinel' : 'mongodb://localhost:27027/datasentinel');

const seedDPDPA = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    let user = await User.findOne({ email: 'test@test.com' });
    let orgId;

    if (!user) {
      console.log('Test user not found. Provisioning new MNC Enterprise context...');
      const org = await Organization.create({ 
        name: 'Global Intelligence Nexus Corp', 
        industry: 'Cybersecurity & Compliance', 
        size: '201-1000' 
      });
      orgId = org._id;

      user = new User({ 
        name: 'MNC Enterprise Admin', 
        email: 'test@test.com', 
        passwordHash: 'testtest', 
        orgId, 
        role: 'admin',
        isEmailVerified: true 
      });
      await user.save();
      console.log('✓ Provisioned test user and organization.');
    } else {
      orgId = user.orgId;
    }

    // 1. Seed Compliance Items
    const sections = [
      { section: 'Section 4', requirement: 'Grounds for Processing Personal Data', status: 'compliant', evidence: 'Verified via Algorithmic Audit' },
      { section: 'Section 5', requirement: 'Notice to Data Principal', status: 'partial', evidence: 'Pending Mobile App Notice Verification' },
      { section: 'Section 6', requirement: 'Consent Management Framework', status: 'compliant', evidence: 'Immutable Ledger Active' },
      { section: 'Section 8', requirement: 'General Obligations of Data Fiduciary', status: 'partial', evidence: 'DPO Appointment Recorded' },
      { section: 'Section 10', requirement: 'Right to Nominate', status: 'compliant', evidence: 'Succession Registry Active' },
    ];

    for (const item of sections) {
      await ComplianceItem.findOneAndUpdate(
        { orgId, section: item.section },
        { ...item, orgId },
        { upsert: true }
      );
    }

    // 2. Seed Consent Records
    const consents = [
      { principalName: 'Rajesh Kumar', principalEmail: 'rajesh@example.com', purposeDescription: 'Marketing & Analytics', status: 'active', collectionPoint: 'Web Portal', legalBasis: 'consent' },
      { principalName: 'Amit Singh', principalEmail: 'amit@example.com', purposeDescription: 'Financial Alerts', status: 'withdrawn', collectionPoint: 'Mobile App', legalBasis: 'consent' },
      { principalName: 'Priya Sharma', principalEmail: 'priya@example.com', purposeDescription: 'KYC Verification', status: 'pending', collectionPoint: 'Manual Upload', legalBasis: 'legal_obligation' },
    ];

    for (const c of consents) {
      await ConsentRecord.findOneAndUpdate(
        { orgId, principalEmail: c.principalEmail },
        { ...c, orgId },
        { upsert: true }
      );
    }

    // 3. Seed Nominations
    const nominations = [
      { principalName: 'Vikram Seth', principalId: 'PRIN-8892', nomineeName: 'Aditi Seth', relation: 'Spouse', status: 'verified' },
      { principalName: 'Sneha Kapur', principalId: 'PRIN-1102', nomineeName: 'Rahul Kapur', relation: 'Brother', status: 'pending' },
    ];

    for (const n of nominations) {
      await Nomination.findOneAndUpdate(
        { orgId, principalId: n.principalId },
        { ...n, orgId },
        { upsert: true }
      );
    }

    console.log('DPDPA MNC-Grade Data Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDPDPA();
