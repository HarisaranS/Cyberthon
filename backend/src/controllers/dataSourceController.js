const path = require('path');
const fs = require('fs');
const DataSource = require('../models/DataSource');
const ScanJob = require('../models/ScanJob');
const ScanResult = require('../models/ScanResult');
const Alert = require('../models/Alert');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { encrypt, decrypt } = require('../services/encryptionService');
const { logAction } = require('../services/auditService');

exports.getSources = async (req, res, next) => {
  try {
    const query = { orgId: req.user.orgId, isActive: true };
    if (req.query.infrastructure) {
      query.infrastructure = req.query.infrastructure;
    }
    const sources = await DataSource.find(query).sort({ createdAt: -1 });
    sendSuccess(res, sources);
  } catch (err) { next(err); }
};

exports.createSource = async (req, res, next) => {
  try {
    const { name, type, credentials, infrastructure, sampleData } = req.body;
    if (!name || !type) return sendError(res, 'Name and type required', 400);
    if (type === 's3' && credentials && credentials.bucketName && !credentials.bucket) {
      credentials.bucket = credentials.bucketName;
    }
    const encryptedCreds = credentials ? encrypt(JSON.stringify(credentials)) : null;
    
    // Auto-detect infrastructure if not provided
    const cloudTypes = ['s3', 'azure_blob', 'google_drive', 'onedrive', 'sharepoint'];
    const finalInfrastructure = infrastructure || (cloudTypes.includes(type) ? 'cloud' : 'on-premises');
    
    const source = await DataSource.create({
      orgId: req.user.orgId, name, type,
      credentials: encryptedCreds, healthStatus: 'unknown', createdBy: req.user._id,
      infrastructure: finalInfrastructure, sampleData
    });

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'source_create', resourceType: 'data_source', resourceId: source._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { name, type, infrastructure: source.infrastructure }
    });

    sendSuccess(res, { source }, 'Data source created', 201);
  } catch (err) { next(err); }
};

exports.getSource = async (req, res, next) => {
  try {
    const source = await DataSource.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!source) return sendError(res, 'Data source not found', 404);
    sendSuccess(res, { source });
  } catch (err) { next(err); }
};

exports.updateSource = async (req, res, next) => {
  try {
    const { name, credentials, schedule, sampleData } = req.body;
    const update = { name };
    if (credentials) update.credentials = encrypt(JSON.stringify(credentials));
    if (schedule) update.schedule = schedule;
    if (sampleData) update.sampleData = sampleData;
    const source = await DataSource.findOneAndUpdate({ _id: req.params.id, orgId: req.user.orgId }, update, { new: true });
    if (!source) return sendError(res, 'Data source not found', 404);

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'source_update', resourceType: 'data_source', resourceId: source._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { name: source.name }
    });

    sendSuccess(res, { source }, 'Data source updated');
  } catch (err) { next(err); }
};

exports.deleteSource = async (req, res, next) => {
  try {
    const source = await DataSource.findOne({ _id: req.params.id, orgId: req.user.orgId });
    if (!source) return sendError(res, 'Data source not found', 404);

    // Delete files on disk for local sources
    if (source.type === 'local' && source.credentials) {
      try {
        const creds = JSON.parse(decrypt(source.credentials) || '{}');
        for (const f of (creds.files || [])) {
          if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
        }
      } catch (e) { /* ignore */ }
    }

    // Cascade delete: scan jobs → results → alerts → source
    const jobs = await ScanJob.find({ orgId: req.user.orgId, connectorId: source._id }).select('_id');
    const jobIds = jobs.map(j => j._id);
    if (jobIds.length > 0) {
      await ScanResult.deleteMany({ scanJobId: { $in: jobIds } });
      await Alert.deleteMany({ scanJobId: { $in: jobIds } });
      await ScanJob.deleteMany({ _id: { $in: jobIds } });
    }
    await DataSource.deleteOne({ _id: source._id });

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'source_delete', resourceType: 'data_source', resourceId: source._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { name: source.name, type: source.type }
    });

    sendSuccess(res, {}, 'Source and all associated data permanently deleted');
  } catch (err) { next(err); }
};

exports.testConnection = async (req, res, next) => {
  try {
    const { type, credentials } = req.body;
    if (!type || !credentials) return sendError(res, 'type and credentials required', 400);

    if (type === 'mysql' || type === 'mssql') {
      const mysql = require('mysql2/promise');
      const conn = await mysql.createConnection({
        host: credentials.host, port: parseInt(credentials.port) || 3306,
        user: credentials.username || credentials.user,
        password: credentials.password, database: credentials.database,
        connectTimeout: 10000
      });
      await conn.ping();
      await conn.end();
      return sendSuccess(res, { connected: true, message: `Connected to MySQL (${credentials.host})` });
    }

    if (type === 'postgresql') {
      const { Client } = require('pg');
      const client = new Client({
        host: credentials.host, port: parseInt(credentials.port) || 5432,
        user: credentials.username || credentials.user,
        password: credentials.password, database: credentials.database,
        connectionTimeoutMillis: 10000
      });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return sendSuccess(res, { connected: true, message: `Connected to PostgreSQL (${credentials.host})` });
    }

    if (type === 'mongodb') {
      const { MongoClient } = require('mongodb');
      const auth = credentials.username
        ? `${encodeURIComponent(credentials.username)}:${encodeURIComponent(credentials.password)}@`
        : '';
      const uri = credentials.uri ||
        `mongodb://${auth}${credentials.host || 'localhost'}:${credentials.port || 27017}/${credentials.database}`;
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
      await client.connect();
      await client.db(credentials.database).command({ ping: 1 });
      await client.close();
      return sendSuccess(res, { connected: true, message: `Connected to MongoDB (${credentials.host})` });
    }

    if (type === 's3') {
      const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: credentials.region || 'ap-south-1',
        credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey }
      });
      const bucketName = credentials.bucket || credentials.bucketName;
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      return sendSuccess(res, { connected: true, message: `Connected to S3 bucket: ${bucketName}` });
    }

    sendSuccess(res, { connected: true, message: `Source type ${type} configured` });
  } catch (err) { next(err); }
};

exports.uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0)
      return sendError(res, 'No files uploaded', 400);
    const { name } = req.body;
    if (!name) return sendError(res, 'Source name required', 400);

    const fileInfos = req.files.map(f => ({
      name: f.originalname,
      path: f.path,
      size: f.size,
      mimetype: f.mimetype
    }));

    const encryptedCreds = encrypt(JSON.stringify({ files: fileInfos }));
    const source = await DataSource.create({
      orgId: req.user.orgId,
      name,
      type: 'local',
      credentials: encryptedCreds,
      healthStatus: 'unknown',
      createdBy: req.user._id,
      infrastructure: 'on-premises'
    });

    await logAction({
      orgId: req.user.orgId, userId: req.user._id, userEmail: req.user.email, userRole: req.user.role,
      action: 'source_upload', resourceType: 'data_source', resourceId: source._id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      details: { name, fileCount: fileInfos.length }
    });

    sendSuccess(res, { source }, `Source created with ${fileInfos.length} file(s)`, 201);
  } catch (err) { next(err); }
};
