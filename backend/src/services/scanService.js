const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');

const ScanJob = require('../models/ScanJob');
const ScanResult = require('../models/ScanResult');
const DataSource = require('../models/DataSource');
const Alert = require('../models/Alert');
const { detectPII, classifyRisk } = require('./aiService');
const { emitToOrg } = require('./socketService');
const { decrypt } = require('./encryptionService');
const logger = require('../config/logger');

const AI_URL = process.env.AI_ENGINE_URL || 'http://ai-engine:8000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function detectFile(filePath, fileName) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), fileName);
  try {
    const res = await axios.post(`${AI_URL}/scan/file`, form, {
      headers: form.getHeaders(),
      timeout: 120000,
      maxBodyLength: Infinity
    });
    return res.data;
  } catch (err) {
    logger.error(`File scan error for ${fileName}: ${err.message}`);
    return { detections: [], total_found: 0 };
  }
}

async function saveFindings(job, detections, assetPath, context = {}) {
  if (!detections || detections.length === 0) return 0;
  const unique = detections.filter((d, i, arr) =>
    arr.findIndex(x => x.pii_type === d.pii_type && x.masked_value === d.masked_value) === i
  );
  if (unique.length === 0) return 0;

  const classification = await classifyRisk(unique, context);
  await ScanResult.create({
    scanJobId: job._id,
    orgId: job.orgId,
    dataSourceId: job.connectorId?._id || job.connectorId,
    assetPath,
    fileName: assetPath.split('/').pop(),
    detectedPII: unique.map(d => ({
      piiType: d.pii_type, maskedValue: d.masked_value,
      confidence: d.confidence, contextSnippet: d.context || ''
    })),
    sensitivityLevel: classification.sensitivity_level || 'internal',
    riskScore: classification.risk_score || 50,
    remediationStatus: 'pending'
  });

  const score = classification.risk_score || 50;
  if (score >= 80) {
    job.criticalFindings++;
    await Alert.create({
      orgId: job.orgId, scanJobId: job._id, type: 'critical_pii_found',
      severity: 'critical',
      title: `Critical PII in ${assetPath.split('/').pop()}`,
      description: `Found ${unique.length} PII item(s): ${[...new Set(unique.map(d => d.pii_type))].slice(0, 4).join(', ')}`,
      affectedAsset: assetPath
    });
  } else if (score >= 60) {
    job.highFindings++;
  } else if (score >= 40) {
    job.mediumFindings++;
  } else {
    job.lowFindings++;
  }

  emitToOrg(job.orgId.toString(), 'scan:finding', {
    jobId: job._id, assetPath,
    piiTypes: [...new Set(unique.map(d => d.pii_type))],
    severity: classification.sensitivity_level, count: unique.length
  });
  return unique.length;
}

function emitProgress(job, pct, file, stage) {
  job.progress = pct;
  if (file !== null) job.currentFile = file;
  emitToOrg(job.orgId.toString(), 'scan:progress', {
    jobId: job._id, progress: pct, currentFile: file || '', stage
  });
}

// ─── Local File Scanner ───────────────────────────────────────────────────────

async function scanLocalFiles(job, credentials) {
  const files = credentials?.files || [];
  if (files.length === 0) {
    return { totalPII: 0, note: 'No files attached. Re-configure this source and upload files.' };
  }
  let totalPII = 0;
  for (let i = 0; i < files.length; i++) {
    const fileInfo = files[i];
    emitProgress(job, Math.round(10 + ((i + 1) / files.length) * 85), fileInfo.name, `Scanning ${fileInfo.name}…`);
    job.totalFilesScanned = i + 1;
    await job.save();
    const filePath = path.join(__dirname, '../../uploads', fileInfo.path.split('uploads/').pop());
    if (!fs.existsSync(filePath)) { logger.warn(`Missing: ${filePath}`); continue; }
    const result = await detectFile(filePath, fileInfo.name);
    if (result.detections?.length > 0) {
      totalPII += await saveFindings(job, result.detections, fileInfo.name, { unencrypted: true });
    }
  }
  return { totalPII };
}

// ─── MySQL / MSSQL Scanner ────────────────────────────────────────────────────

async function scanMySQL(job, credentials) {
  let conn;
  try {
    const mysql = require('mysql2/promise');
    conn = await mysql.createConnection({
      host: credentials.host || 'localhost',
      port: parseInt(credentials.port) || 3306,
      user: credentials.username || credentials.user,
      password: credentials.password,
      database: credentials.database,
      connectTimeout: 15000
    });
    emitProgress(job, 10, null, 'Connected to MySQL — listing tables…');
    const [tables] = await conn.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
      [credentials.database]
    );
    let totalPII = 0;
    for (let i = 0; i < tables.length; i++) {
      const t = tables[i].TABLE_NAME || tables[i].table_name;
      emitProgress(job, Math.round(10 + ((i + 1) / tables.length) * 80), `${credentials.database}.${t}`, `Scanning table ${t}…`);
      await job.save();
      try {
        const [rows] = await conn.execute(`SELECT * FROM \`${t}\` LIMIT 500`);
        if (!rows.length) continue;
        const text = rows.map(r => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | ')).join('\n');
        const res = await detectPII(text, 'database');
        if (res.detections?.length > 0) {
          const n = await saveFindings(job, res.detections, `${credentials.database}.${t}`, { unencrypted: !credentials.ssl });
          if (n > 0) { totalPII += n; job.totalFilesScanned++; }
        }
      } catch (e) { logger.warn(`MySQL table ${t}: ${e.message}`); }
    }
    return { totalPII };
  } finally { if (conn) await conn.end().catch(() => {}); }
}

// ─── PostgreSQL Scanner ───────────────────────────────────────────────────────

async function scanPostgres(job, credentials) {
  const { Client } = require('pg');
  const client = new Client({
    host: credentials.host || 'localhost',
    port: parseInt(credentials.port) || 5432,
    user: credentials.username || credentials.user,
    password: credentials.password,
    database: credentials.database,
    connectionTimeoutMillis: 15000
  });
  try {
    await client.connect();
    emitProgress(job, 10, null, 'Connected to PostgreSQL — listing tables…');
    const { rows: tables } = await client.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
    let totalPII = 0;
    for (let i = 0; i < tables.length; i++) {
      const t = tables[i].tablename;
      emitProgress(job, Math.round(10 + ((i + 1) / tables.length) * 80), `public.${t}`, `Scanning table ${t}…`);
      await job.save();
      try {
        const { rows } = await client.query(`SELECT * FROM "${t}" LIMIT 500`);
        if (!rows.length) continue;
        const text = rows.map(r => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | ')).join('\n');
        const res = await detectPII(text, 'database');
        if (res.detections?.length > 0) {
          const n = await saveFindings(job, res.detections, `${credentials.database}.public.${t}`, { unencrypted: !credentials.ssl });
          if (n > 0) { totalPII += n; job.totalFilesScanned++; }
        }
      } catch (e) { logger.warn(`PG table ${t}: ${e.message}`); }
    }
    return { totalPII };
  } finally { await client.end().catch(() => {}); }
}

// ─── MongoDB Scanner ──────────────────────────────────────────────────────────

async function scanMongoDBSource(job, credentials) {
  const { MongoClient } = require('mongodb');
  const auth = credentials.username
    ? `${encodeURIComponent(credentials.username)}:${encodeURIComponent(credentials.password)}@`
    : '';
  const uri = credentials.uri ||
    `mongodb://${auth}${credentials.host || 'localhost'}:${credentials.port || 27017}/${credentials.database}`;
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    emitProgress(job, 10, null, 'Connected to MongoDB — listing collections…');
    const db = client.db(credentials.database);
    const cols = await db.listCollections().toArray();
    let totalPII = 0;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i].name;
      emitProgress(job, Math.round(10 + ((i + 1) / cols.length) * 80), c, `Scanning collection ${c}…`);
      await job.save();
      try {
        const docs = await db.collection(c).find({}).limit(500).toArray();
        if (!docs.length) continue;
        const text = docs.map(d =>
          Object.entries(d).filter(([k]) => k !== '_id').map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ')
        ).join('\n');
        const res = await detectPII(text, 'database');
        if (res.detections?.length > 0) {
          const n = await saveFindings(job, res.detections, `${credentials.database}.${c}`, { unencrypted: true });
          if (n > 0) { totalPII += n; job.totalFilesScanned++; }
        }
      } catch (e) { logger.warn(`MongoDB col ${c}: ${e.message}`); }
    }
    return { totalPII };
  } finally { await client.close().catch(() => {}); }
}

// ─── S3 Scanner ───────────────────────────────────────────────────────────────

const S3_EXTS = new Set(['.txt','.csv','.pdf','.docx','.xlsx','.json','.xml',
  '.log','.py','.js','.ts','.java','.env','.config','.yaml','.yml','.sql']);

async function scanS3(job, credentials) {
  const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: credentials.region || 'ap-south-1',
    credentials: { accessKeyId: credentials.accessKeyId, secretAccessKey: credentials.secretAccessKey }
  });
  const bucketName = credentials.bucket || credentials.bucketName;
  const objects = [];
  let token;
  do {
    const r = await s3.send(new ListObjectsV2Command({
      Bucket: bucketName, Prefix: credentials.prefix || '',
      ContinuationToken: token, MaxKeys: 200
    }));
    objects.push(...(r.Contents || []));
    token = r.NextContinuationToken;
  } while (token && objects.length < 500);

  const scannable = objects.filter(o => S3_EXTS.has(path.extname(o.Key || '').toLowerCase()));
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'ds-s3-'));
  let totalPII = 0;
  try {
    for (let i = 0; i < scannable.length; i++) {
      const obj = scannable[i];
      emitProgress(job, Math.round(10 + ((i + 1) / scannable.length) * 80), obj.Key, `Downloading ${obj.Key}…`);
      await job.save();
      try {
        const resp = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: obj.Key }));
        const baseName = path.basename(obj.Key);
        const tmpFile = path.join(tmpDir, baseName);
        const chunks = [];
        for await (const chunk of resp.Body) chunks.push(chunk);
        await fsp.writeFile(tmpFile, Buffer.concat(chunks));
        const result = await detectFile(tmpFile, baseName);
        if (result.detections?.length > 0) {
          const n = await saveFindings(job, result.detections, obj.Key, { unencrypted: true, internet_exposed: !!credentials.isPublicBucket });
          if (n > 0) { totalPII += n; job.totalFilesScanned++; }
        }
        await fsp.unlink(tmpFile).catch(() => {});
      } catch (e) { logger.warn(`S3 ${obj.Key}: ${e.message}`); }
    }
  } finally { await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {}); }
  return { totalPII };
}

// ─── Email (IMAP) Scanner ───────────────────────────────────────────────────

async function scanEmail(job, credentials) {
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');
  const imap = new Imap({
    user: credentials.username || credentials.user || credentials.email,
    password: credentials.password,
    host: credentials.host || 'localhost',
    port: parseInt(credentials.port) || 993,
    tls: credentials.tls !== false,
    tlsOptions: { rejectUnauthorized: false }
  });

  return new Promise((resolve, reject) => {
    let totalPII = 0;
    let processed = 0;

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) { imap.end(); return reject(err); }
        const f = imap.seq.fetch(`${Math.max(1, box.messages.total - 49)}:${box.messages.total}`, {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          struct: true
        });

        f.on('message', (msg, seqno) => {
          let buffer = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => { buffer += chunk.toString(); });
          });
          msg.once('end', async () => {
            processed++;
            emitProgress(job, Math.round(10 + (processed / 50) * 80), `Email #${seqno}`, `Scanning email ${seqno}…`);
            try {
              const parsed = await simpleParser(buffer);
              const text = `${parsed.subject}\n${parsed.text}\n${parsed.from?.text || ''}`;
              const res = await detectPII(text, 'email');
              if (res.detections?.length > 0) {
                totalPII += await saveFindings(job, res.detections, `INBOX/email-${seqno}`, { pii_context: 'email' });
                job.totalFilesScanned++;
              }
            } catch (e) { logger.warn(`Email ${seqno} parse error: ${e.message}`); }
          });
        });

        f.once('error', (err) => { logger.error('Fetch error:', err); });
        f.once('end', () => { imap.end(); });
      });
    });

    imap.once('error', (err) => { reject(err); });
    imap.once('end', () => { resolve({ totalPII }); });
    imap.connect();
  });
}

// ─── SSH / SFTP Scanner ───────────────────────────────────────────────────────

async function scanSSH(job, credentials) {
  const { Client } = require('ssh2');
  const conn = new Client();
  
  return new Promise((resolve, reject) => {
    let totalPII = 0;
    conn.on('ready', () => {
      conn.sftp(async (err, sftp) => {
        if (err) { conn.end(); return reject(err); }
        
        emitProgress(job, 10, null, 'Connected via SSH — listing files…');
        const scannablePaths = ['./', './logs', '/etc', '/var/log']; 
        const filesToScan = [];
        
        for (const dirPath of scannablePaths) {
          try {
            const list = await new Promise((res) => sftp.readdir(dirPath, (e, l) => res(e ? [] : l)));
            list.forEach(item => {
              if (item.attrs.isFile() && S3_EXTS.has(path.extname(item.filename).toLowerCase())) {
                filesToScan.push(path.join(dirPath, item.filename));
              }
            });
          } catch(e) {}
        }

        const limited = filesToScan.slice(0, 50);
        const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'ds-ssh-'));
        
        try {
          for (let i = 0; i < limited.length; i++) {
            const remotePath = limited[i];
            const localPath = path.join(tmpDir, path.basename(remotePath));
            emitProgress(job, Math.round(10 + (i/limited.length)*80), remotePath, `Downloading ${remotePath}…`);
            
            await new Promise((res) => sftp.fastGet(remotePath, localPath, res));
            const result = await detectFile(localPath, path.basename(remotePath));
            if (result.detections?.length > 0) {
              totalPII += await saveFindings(job, result.detections, remotePath, { pii_context: 'server_file' });
              job.totalFilesScanned++;
            }
            await fsp.unlink(localPath).catch(() => {});
          }
        } finally {
          await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
          sftp.end();
          conn.end();
        }
      });
    }).on('error', reject).connect({
      host: credentials.host,
      port: parseInt(credentials.port) || 22,
      username: credentials.username || credentials.user,
      password: credentials.password,
      readyTimeout: 15000
    });
    
    conn.on('close', () => resolve({ totalPII }));
  });
}

// ─── Redis Scanner ────────────────────────────────────────────────────────────

async function scanRedis(job, credentials) {
  const Redis = require('ioredis');
  const redis = new Redis({
    host: credentials.host || 'localhost',
    port: parseInt(credentials.port) || 6379,
    password: credentials.password || null,
    db: parseInt(credentials.database) || 0,
    connectTimeout: 10000
  });

  try {
    emitProgress(job, 10, null, 'Connected to Redis — scanning keys…');
    let totalPII = 0;
    const keys = await redis.keys('*');
    const limited = keys.slice(0, 1000);
    
    for (let i = 0; i < limited.length; i++) {
      if (i % 100 === 0) {
        emitProgress(job, Math.round(10 + (i/limited.length)*80), `Redis Key: ${limited[i]}`, `Scanning key ${i}…`);
      }
      const val = await redis.get(limited[i]);
      if (!val) continue;
      const res = await detectPII(val, 'cache');
      if (res.detections?.length > 0) {
        totalPII += await saveFindings(job, res.detections, `redis://${credentials.host}/${limited[i]}`, { pii_context: 'redis_cache' });
        job.totalFilesScanned++;
      }
    }
    return { totalPII };
  } finally {
    await redis.quit().catch(() => {});
  }
}

// ─── Run Scan (entry point) ───────────────────────────────────────────────────

const runScan = async (jobId) => {
  const job = await ScanJob.findById(jobId).populate('connectorId');
  if (!job) return;

  job.status = 'running';
  job.startedAt = new Date();
  await job.save();

  const source = job.connectorId;
  emitToOrg(job.orgId.toString(), 'scan:started', { jobId, name: job.name, sourceType: source?.type });

  try {
    let credentials = {};
    if (source?.credentials) {
      try { credentials = JSON.parse(decrypt(source.credentials) || '{}'); }
      catch (e) { logger.warn('Credential decrypt:', e.message); }
    }
    emitProgress(job, 5, '', 'Initializing scanner…');

    const sourceType = source?.type || 'local';
    let result;
    
    switch (sourceType) {
      case 'local':       result = await scanLocalFiles(job, credentials); break;
      case 'mysql':
      case 'mssql':       result = await scanMySQL(job, credentials); break;
      case 'postgresql':  result = await scanPostgres(job, credentials); break;
      case 'mongodb':     result = await scanMongoDBSource(job, credentials); break;
      case 's3':          result = await scanS3(job, credentials); break;
      case 'imap':
      case 'email':       result = await scanEmail(job, credentials); break;
      case 'ssh':
      case 'sftp':        result = await scanSSH(job, credentials); break;
      case 'redis':       result = await scanRedis(job, credentials); break;
      default:
        throw new Error(`Source type "${sourceType}" not yet supported. Use: imap/email, ssh, redis, local, mysql, postgresql, mongodb, or s3.`);
    }

    const totalPII = result.totalPII || 0;
    job.status = 'completed';
    job.progress = 100;
    job.totalPIIFound = totalPII;
    job.completedAt = new Date();
    job.insightSummary = totalPII > 0
      ? `Scan complete. Found ${totalPII} PII instance(s) — ${job.criticalFindings} critical, ${job.highFindings} high, ${job.mediumFindings} medium, ${job.lowFindings} low.`
      : `Scan complete. No PII detected.`;

    // Calculate unique PII count across all scans for this source
    const allResults = await ScanResult.find({ dataSourceId: source?._id, orgId: job.orgId });
    const uniquePII = new Set();
    allResults.forEach(result => {
      result.detectedPII.forEach(pii => {
        uniquePII.add(`${pii.piiType}:${pii.maskedValue}`);
      });
    });

    await DataSource.findByIdAndUpdate(source?._id, {
      lastScannedAt: new Date(), healthStatus: 'healthy',
      totalFilesScanned: job.totalFilesScanned,
      totalPIIFound: uniquePII.size
    });
    emitToOrg(job.orgId.toString(), 'scan:completed', {
      jobId: job._id, totalPII, criticalFindings: job.criticalFindings, message: job.insightSummary
    });
  } catch (err) {
    logger.error('Scan failed:', err);
    job.status = 'failed';
    job.errorMessage = err.message;
    await DataSource.findByIdAndUpdate(source?._id, { healthStatus: 'error' });
    emitToOrg(job.orgId.toString(), 'scan:failed', { jobId: job._id, error: err.message });
  }
  await job.save();
};

module.exports = { runScan };
