/**
 * Enterprise Network Discovery Service
 * Discovers all IT assets across the network: databases, mail servers, SSH hosts,
 * file servers, web servers, LDAP directories, cache servers, and more.
 * Stores results in the AssetInventory collection.
 */

const net = require('net');
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const { MongoClient } = require('mongodb');
const AssetInventory = require('../models/AssetInventory');
const DataSource = require('../models/DataSource');
const { encrypt } = require('./encryptionService');
const logger = require('../config/logger');

const execAsync = promisify(exec);

// ─── Port Definitions ────────────────────────────────────────────────────────

const ENTERPRISE_PORTS = [
  // Databases
  { port: 3306,  service: 'mysql',          assetType: 'database' },
  { port: 5432,  service: 'postgresql',     assetType: 'database' },
  { port: 27017, service: 'mongodb',        assetType: 'database' },
  { port: 1433,  service: 'mssql',          assetType: 'database' },
  { port: 1521,  service: 'oracle',         assetType: 'database' },
  { port: 5984,  service: 'couchdb',        assetType: 'database' },
  { port: 9200,  service: 'elasticsearch',  assetType: 'search_engine' },
  { port: 9300,  service: 'elasticsearch-cluster', assetType: 'search_engine' },
  // Cache / Queue
  { port: 6379,  service: 'redis',          assetType: 'cache_server' },
  { port: 11211, service: 'memcached',      assetType: 'cache_server' },
  { port: 5672,  service: 'rabbitmq-amqp', assetType: 'cache_server' },
  { port: 15672, service: 'rabbitmq-mgmt', assetType: 'cache_server' },
  // Mail
  { port: 25,    service: 'smtp',           assetType: 'mail_server' },
  { port: 465,   service: 'smtps',          assetType: 'mail_server' },
  { port: 587,   service: 'smtp-submission',assetType: 'mail_server' },
  { port: 143,   service: 'imap',           assetType: 'mail_server' },
  { port: 993,   service: 'imaps',          assetType: 'mail_server' },
  { port: 110,   service: 'pop3',           assetType: 'mail_server' },
  { port: 995,   service: 'pop3s',          assetType: 'mail_server' },
  // File Sharing
  { port: 21,    service: 'ftp',            assetType: 'file_server' },
  { port: 22,    service: 'ssh-sftp',       assetType: 'ssh_host' },
  { port: 445,   service: 'smb',            assetType: 'file_server' },
  { port: 139,   service: 'netbios',        assetType: 'file_server' },
  { port: 2049,  service: 'nfs',            assetType: 'file_server' },
  { port: 548,   service: 'afp',            assetType: 'file_server' },
  // Web / API
  { port: 80,    service: 'http',           assetType: 'web_server' },
  { port: 443,   service: 'https',          assetType: 'web_server' },
  { port: 8080,  service: 'http-alt',       assetType: 'web_server' },
  { port: 8443,  service: 'https-alt',      assetType: 'web_server' },
  { port: 8000,  service: 'http-dev',       assetType: 'web_server' },
  { port: 3000,  service: 'http-dev',       assetType: 'web_server' },
  { port: 9000,  service: 'http-api',       assetType: 'web_server' },
  { port: 8888,  service: 'http-jupyter',   assetType: 'web_server' },
  // Remote Access
  { port: 3389,  service: 'rdp',            assetType: 'workstation' },
  { port: 5900,  service: 'vnc',            assetType: 'workstation' },
  { port: 5901,  service: 'vnc-1',          assetType: 'workstation' },
  // Directory Services
  { port: 389,   service: 'ldap',           assetType: 'ldap_directory' },
  { port: 636,   service: 'ldaps',          assetType: 'ldap_directory' },
  { port: 88,    service: 'kerberos',       assetType: 'ldap_directory' },
  // Printers / IoT
  { port: 9100,  service: 'jetdirect',      assetType: 'printer' },
  { port: 515,   service: 'lpd',            assetType: 'printer' },
  // Monitoring
  { port: 161,   service: 'snmp',           assetType: 'switch' },
  { port: 162,   service: 'snmptrap',       assetType: 'switch' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get all local network base IPs (handles multi-NIC systems)
 */
function getNetworkRanges() {
  const ranges = new Set();
  
  // Enterprise explicitly configured subnets (comma separated base IPs, e.g. "192.168.1,10.0.0")
  if (process.env.SCAN_SUBNETS) {
    process.env.SCAN_SUBNETS.split(',').forEach(s => ranges.add(s.trim()));
  }
  
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        const parts = addr.address.split('.');
        ranges.add(`${parts[0]}.${parts[1]}.${parts[2]}`);
      }
    }
  }
  if (ranges.size === 0) ranges.add('192.168.1');
  return [...ranges];
}

/**
 * Check if a TCP port is open with timeout
 */
function checkPort(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      // Try to get a banner – wait a short time
      setTimeout(() => {
        socket.destroy();
        resolve({ open: true, banner: banner.trim().slice(0, 200) });
      }, 400);
    });
    socket.on('data', (data) => {
      banner += data.toString('utf8', 0, 200);
    });
    socket.on('timeout', () => { socket.destroy(); resolve({ open: false }); });
    socket.on('error', () => { socket.destroy(); resolve({ open: false }); });
    socket.connect(port, host);
  });
}

/**
 * Ping a host (returns true if alive)
 */
async function pingHost(ip) {
  try {
    const isWindows = os.platform() === 'win32';
    const cmd = isWindows
      ? `ping -n 1 -w 500 ${ip}`
      : `ping -c 1 -W 1 ${ip}`;
    const { stdout } = await execAsync(cmd, { timeout: 2500 });
    return isWindows ? stdout.includes('TTL=') : stdout.includes('1 received');
  } catch {
    return false;
  }
}

/**
 * Determine primary asset type from open ports
 */
function classifyAsset(openPorts) {
  const services = openPorts.map(p => p.service);
  if (services.some(s => ['smtp', 'smtps', 'imap', 'imaps', 'pop3'].includes(s))) return 'mail_server';
  if (services.some(s => ['mysql', 'postgresql', 'mongodb', 'mssql', 'oracle', 'couchdb'].includes(s))) return 'database';
  if (services.some(s => ['ldap', 'ldaps', 'kerberos'].includes(s))) return 'ldap_directory';
  if (services.some(s => ['elasticsearch'].includes(s))) return 'search_engine';
  if (services.some(s => ['redis', 'memcached', 'rabbitmq-amqp'].includes(s))) return 'cache_server';
  if (services.some(s => ['smb', 'nfs', 'afp', 'netbios', 'ftp'].includes(s))) return 'file_server';
  if (services.some(s => ['ssh-sftp'].includes(s))) return 'ssh_host';
  if (services.some(s => ['rdp', 'vnc', 'vnc-1'].includes(s))) return 'workstation';
  if (services.some(s => ['http', 'https', 'http-alt'].includes(s))) return 'web_server';
  if (services.some(s => ['jetdirect', 'lpd'].includes(s))) return 'printer';
  if (services.some(s => ['snmp', 'snmptrap'].includes(s))) return 'switch';
  return 'unknown';
}

// ─── Main Discovery Functions ─────────────────────────────────────────────────

/**
 * Scan a single host for all enterprise ports
 */
async function scanHost(ip) {
  // First check if host is alive (skip full port scan for dead hosts)
  const alive = await pingHost(ip);
  if (!alive) {
    // Try a quick port check on common ports before giving up
    const quickCheck = await checkPort(ip, 80, 800);
    const quickSSH = await checkPort(ip, 22, 800);
    const quickMongo = await checkPort(ip, 27017, 800);
    const quickRedis = await checkPort(ip, 6379, 800);
    const quickPg = await checkPort(ip, 5432, 800);
    if (!quickCheck.open && !quickSSH.open && !quickMongo.open && !quickRedis.open && !quickPg.open) return null;
  }

  const openPorts = [];
  // Scan all ports concurrently (in small batches)
  const BATCH = 8;
  for (let i = 0; i < ENTERPRISE_PORTS.length; i += BATCH) {
    const batch = ENTERPRISE_PORTS.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async ({ port, service, assetType }) => {
        const result = await checkPort(ip, port, 1500);
        if (result.open) {
          return { port, service, assetType, banner: result.banner, state: 'open' };
        }
        return null;
      })
    );
    openPorts.push(...results.filter(Boolean));
  }

  if (openPorts.length === 0) return null;

  return {
    ip,
    isAlive: true,
    openPorts,
    assetType: classifyAsset(openPorts)
  };
}

/**
 * Full network discovery scan - discovers all live hosts
 * @param {ObjectId} orgId
 * @returns {Array} discovered/updated asset records
 */
async function discoverNetworkAssets(orgId) {
  const ranges = getNetworkRanges();
  const allAssets = [];
  const CONCURRENCY = 20; // scan 20 hosts at a time

  logger.info(`[Asset Discovery] Starting scan across ${ranges.length} network range(s)...`);

  for (const baseIP of ranges) {
    const ips = [];
    for (let i = 1; i <= 254; i++) ips.push(`${baseIP}.${i}`);

    // Add special hosts including Docker compose service names
    ['localhost', '127.0.0.1', 'host.docker.internal', 'mongodb', 'redis', 'postgres', 'mysql'].forEach(h => {
      if (!ips.includes(h)) ips.push(h);
    });

    logger.info(`[Asset Discovery] Scanning ${ips.length} hosts in ${baseIP}.0/24`);

    // Process in concurrent batches
    for (let i = 0; i < ips.length; i += CONCURRENCY) {
      const batch = ips.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map(ip => scanHost(ip).catch(() => null)));
      
      for (const result of results) {
        if (!result) continue;
        
        try {
          // Upsert into AssetInventory
          const asset = await AssetInventory.findOneAndUpdate(
            { orgId, ip: result.ip },
            {
              $set: {
                orgId,
                ip: result.ip,
                isAlive: true,
                openPorts: result.openPorts.map(p => ({
                  port: p.port,
                  service: p.service,
                  banner: p.banner || '',
                  state: 'open',
                  protocol: 'tcp'
                })),
                assetType: result.assetType,
                lastSeen: new Date(),
                autoDiscovered: true
              },
              $setOnInsert: { firstSeen: new Date() }
            },
            { upsert: true, new: true }
          );
          allAssets.push(asset);
          logger.info(`[Asset Discovery] Found ${result.assetType} at ${result.ip} (${result.openPorts.length} ports)`);
        } catch (err) {
          logger.error(`[Asset Discovery] DB error for ${result.ip}: ${err.message}`);
        }
      }
    }
  }

  // Mark hosts not seen in this scan as offline
  const seenIps = allAssets.map(a => a.ip);
  if (seenIps.length > 0) {
    await AssetInventory.updateMany(
      { orgId, ip: { $nin: seenIps }, lastSeen: { $lt: new Date(Date.now() - 3 * 60 * 60 * 1000) } },
      { $set: { isAlive: false } }
    );
  }

  logger.info(`[Asset Discovery] Complete. Found ${allAssets.length} live assets.`);
  return allAssets;
}

// ─── Database Credential Testing (existing logic, enhanced) ──────────────────

const DB_COMMON_CREDS = [
  { user: 'REDACTED_DB_PWD',     password: 'REDACTED_DB_PWD' },
  { user: 'REDACTED_DB_PWD',     password: '' },
  { user: 'REDACTED_DB_PWD',     password: 'password' },
  { user: 'REDACTED_DB_PWD',     password: 'toor' },
  { user: 'admin',    password: 'admin' },
  { user: 'admin',    password: 'password' },
  { user: 'admin',    password: '' },
  { user: 'postgres', password: 'postgres' },
  { user: 'postgres', password: '' },
  { user: 'postgres', password: 'password' },
  { user: 'sa',       password: 'sa' },
  { user: 'sa',       password: 'Password1' },
  { user: 'mongo',    password: 'mongo' },
  { user: '',         password: '' },
];

async function tryDBConnect(host, port, type) {
  for (const cred of DB_COMMON_CREDS) {
    try {
      if (type === 'mysql') {
        const conn = await mysql.createConnection({
          host, port: parseInt(port), user: cred.user, password: cred.password, connectTimeout: 4000
        });
        const [dbs] = await conn.execute('SHOW DATABASES');
        await conn.end();
        return { success: true, user: cred.user, password: cred.password, databases: dbs.map(d => d.Database) };
      }
      if (type === 'postgresql') {
        const client = new PgClient({
          host, port: parseInt(port), user: cred.user || 'postgres', password: cred.password,
          database: 'postgres', connectionTimeoutMillis: 4000
        });
        await client.connect();
        const { rows } = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
        await client.end();
        return { success: true, user: cred.user, password: cred.password, databases: rows.map(r => r.datname) };
      }
      if (type === 'mongodb') {
        const uri = cred.user
          ? `mongodb://${encodeURIComponent(cred.user)}:${encodeURIComponent(cred.password)}@${host}:${port}`
          : `mongodb://${host}:${port}`;
        const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
        await client.connect();
        const { databases } = await client.db().admin().listDatabases();
        await client.close();
        return { success: true, user: cred.user, password: cred.password, databases: databases.map(d => d.name) };
      }
      if (type === 'redis') {
        // Try Redis PING (no auth first, then common passwords)
        const { createClient } = require('redis');
        const redisUrl = cred.password
          ? `redis://:${cred.password}@${host}:${port}`
          : `redis://${host}:${port}`;
        const client = createClient({ url: redisUrl, socket: { connectTimeout: 4000 } });
        await client.connect();
        await client.ping();
        await client.quit();
        return { success: true, user: '', password: cred.password, databases: ['redis-0'] };
      }
    } catch (err) {
      // Try next credential
    }
  }
  return { success: false };
}

/**
 * Auto-register discovered DB assets as DataSources
 */
async function autoRegisterDBSources(orgId, userId, assets) {
  const registered = [];
  const SYS_DBS = new Set(['information_schema','mysql','performance_schema','sys','postgres','template0','template1','admin','local','config']);

  for (const asset of assets) {
    for (const portInfo of asset.openPorts) {
      const dbTypes = { mysql: 3306, postgresql: 5432, mongodb: 27017, mssql: 1433, redis: 6379 };
      const dbKey = Object.keys(dbTypes).find(k => portInfo.service.startsWith(k));
      if (!dbKey) continue;

      const conn = await tryDBConnect(asset.ip, portInfo.port, dbKey);
      if (!conn.success) continue;

      // Update asset auth status
      await AssetInventory.findByIdAndUpdate(asset._id, {
        $set: { authStatus: 'accessible_credentials' },
        $addToSet: { accessibleServices: portInfo.service }
      });

      for (const dbName of (conn.databases || [])) {
        if (SYS_DBS.has(dbName)) continue;

        const sourceName = `${dbKey.toUpperCase()} - ${asset.ip}:${portInfo.port}/${dbName}`;
        const existing = await DataSource.findOne({ orgId, name: sourceName });
        if (existing) continue;

        const credentials = { host: asset.ip, port: portInfo.port, username: conn.user, password: conn.password, database: dbName };
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: dbKey,
          credentials: encrypt(JSON.stringify(credentials)),
          healthStatus: 'healthy', autoDiscovered: true
        });

        // Link DataSource to AssetInventory
        await AssetInventory.findByIdAndUpdate(asset._id, {
          $addToSet: { dataSourceIds: source._id }
        });

        registered.push(source);
        logger.info(`[Auto-Register] Added ${dbKey} source: ${source.name}`);
      }
    }
  }
  return registered;
}

/**
 * Scan local file systems for sensitive files
 */
async function scanLocalFileSystem(orgId, userId) {
  const isWindows = os.platform() === 'win32';
  const sensitivePatterns = ['*.env', '*.pem', '*.key', '*credentials*', '*password*', '*secret*', 'id_rsa', 'id_dsa', '*.p12', '*.pfx', '*.jks'];
  const searchPaths = isWindows ? ['C:\\Users', 'C:\\ProgramData'] : ['/home', '/var', '/opt', '/etc'];
  const foundFiles = [];

  for (const basePath of searchPaths) {
    for (const pattern of sensitivePatterns) {
      try {
        const cmd = isWindows
          ? `powershell -Command "Get-ChildItem -Path '${basePath}' -Filter '${pattern}' -Recurse -ErrorAction SilentlyContinue -Depth 4 | Select-Object -First 50 | ForEach-Object { $_.FullName }"`
          : `find ${basePath} -name '${pattern}' -type f 2>/dev/null | head -50`;
        const { stdout } = await execAsync(cmd, { timeout: 30000 });
        foundFiles.push(...stdout.split('\n').filter(f => f.trim()));
      } catch { /* path not accessible */ }
    }
  }

  if (foundFiles.length > 0) {
    const existing = await DataSource.findOne({ orgId, type: 'local', name: 'Auto-Discovered Local Files' });
    if (!existing) {
      const credentials = {
        files: foundFiles.slice(0, 100).map(f => ({ name: f.split(/[/\\]/).pop(), path: f, size: 0 }))
      };
      const source = await DataSource.create({
        orgId, createdBy: userId, name: 'Auto-Discovered Local Files', type: 'local',
        credentials: encrypt(JSON.stringify(credentials)), healthStatus: 'healthy', autoDiscovered: true
      });
      logger.info(`[Auto-Register] Added ${foundFiles.length} local sensitive files`);
      return source;
    }
  }
  return null;
}

/**
 * Auto-register S3 from environment variables
 */
async function autoRegisterS3(orgId, userId) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) return [];
  const registered = [];
  const existing = await DataSource.findOne({ orgId, type: 's3', name: 'S3 - datasentinel-vulnerable-test-bucket' });
  if (!existing) {
    const s3Credentials = {
      bucket: 'datasentinel-vulnerable-test-bucket',
      region: process.env.AWS_REGION || 'ap-south-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      prefix: ''
    };
    const s3Source = await DataSource.create({
      orgId, createdBy: userId, name: 'S3 - datasentinel-vulnerable-test-bucket', type: 's3',
      credentials: encrypt(JSON.stringify(s3Credentials)), healthStatus: 'healthy', autoDiscovered: true
    });
    registered.push(s3Source);
    logger.info('[Auto-Register] Added S3 bucket from environment variables');
  }
  return registered;
}

/**
 * Full enterprise discovery - discovers assets, tests credentials, registers sources
 */
async function runEnterpriseDiscovery(orgId, userId) {
  logger.info(`[Enterprise Discovery] Starting full discovery for org ${orgId}`);
  
  // Phase 1: Discover all network assets
  const assets = await discoverNetworkAssets(orgId);
  
  // Phase 2: Test DB credentials and auto-register sources
  const dbSources = await autoRegisterDBSources(orgId, userId, assets);
  
  // Phase 3: Scan local file system
  const localSource = await scanLocalFileSystem(orgId, userId);
  
  // Phase 4: Auto-register cloud sources from env vars
  const cloudSources = await autoRegisterS3(orgId, userId);
  
  return {
    assetsDiscovered: assets.length,
    dbSourcesRegistered: dbSources.length,
    localFilesRegistered: localSource ? 1 : 0,
    cloudSourcesRegistered: cloudSources.length,
    totalSourcesRegistered: dbSources.length + (localSource ? 1 : 0) + cloudSources.length
  };
}

module.exports = {
  discoverNetworkAssets,
  scanLocalFileSystem,
  autoRegisterSources: (orgId, userId) => runEnterpriseDiscovery(orgId, userId).then(r => []),
  runEnterpriseDiscovery
};
