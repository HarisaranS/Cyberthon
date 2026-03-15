/**
 * Credential Authentication Service
 * Tests discovered credentials against various enterprise services.
 * Supports: SMTP, IMAP, SSH, HTTP Basic Auth, LDAP, and more.
 */

const nodemailer = require('nodemailer');
const { Client: SSHClient } = require('ssh2');
const logger = require('../config/logger');
const AssetInventory = require('../models/AssetInventory');
const DataSource = require('../models/DataSource');
const { encrypt } = require('./encryptionService');

// ─── Common Credential Lists ─────────────────────────────────────────────────

const COMMON_SMTP_CREDS = [
  { user: 'admin@localhost',    password: 'admin' },
  { user: 'postmaster@localhost', password: 'postmaster' },
  { user: 'root@localhost',     password: 'root' },
  { user: 'admin',              password: 'admin' },
  { user: 'admin',              password: 'password' },
];

const COMMON_SSH_CREDS = [
  { user: 'root',    password: 'root' },
  { user: 'root',    password: 'toor' },
  { user: 'root',    password: '123456' },
  { user: 'admin',   password: 'admin' },
  { user: 'admin',   password: 'password' },
  { user: 'ubuntu',  password: 'ubuntu' },
  { user: 'pi',      password: 'raspberry' },
  { user: 'user',    password: 'user' },
  { user: 'test',    password: 'test' },
];

// ─── SMTP Authentication Test ─────────────────────────────────────────────────

/**
 * Test SMTP authentication
 */
async function testSMTP(host, port, credentials = []) {
  const credList = credentials.length > 0 ? credentials : COMMON_SMTP_CREDS;
  
  // First try no-auth (open relay check)
  try {
    const transport = nodemailer.createTransport({
      host, port: parseInt(port) || 25,
      secure: port === 465,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      auth: undefined
    });
    await transport.verify();
    transport.close();
    return { success: true, user: '', password: '', authRequired: false, noAuth: true };
  } catch { /* need auth */ }

  // Try common credentials
  for (const cred of credList) {
    try {
      const transport = nodemailer.createTransport({
        host, port: parseInt(port) || 587,
        secure: port === 465,
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000,
        auth: { user: cred.user, pass: cred.password }
      });
      await transport.verify();
      transport.close();
      return { success: true, user: cred.user, password: cred.password, authRequired: true };
    } catch { /* next */ }
  }
  return { success: false };
}

// ─── IMAP Authentication ──────────────────────────────────────────────────────

async function testIMAP(host, port, credentials = []) {
  const credList = credentials.length > 0 ? credentials : COMMON_SMTP_CREDS;
  for (const cred of credList) {
    try {
      // Simple TCP check with IMAP capability probe
      const result = await new Promise((resolve) => {
        const net = require('net');
        const tls = require('tls');
        const socket = port === 993
          ? tls.connect({ host, port, rejectUnauthorized: false }, () => {})
          : net.connect(port, host);

        let buffer = '';
        socket.setTimeout(5000);
        socket.on('data', d => { buffer += d.toString(); });
        socket.on('connect', () => {
          setTimeout(() => {
            const loginCmd = `A001 LOGIN ${cred.user} ${cred.password}\r\n`;
            socket.write(loginCmd);
            setTimeout(() => {
              const ok = buffer.includes('A001 OK');
              socket.destroy();
              resolve({ success: ok, user: cred.user, password: cred.password });
            }, 2000);
          }, 1000);
        });
        socket.on('error', () => resolve({ success: false }));
        socket.on('timeout', () => { socket.destroy(); resolve({ success: false }); });
      });
      if (result.success) return result;
    } catch { /* next */ }
  }
  return { success: false };
}

// ─── SSH Authentication ───────────────────────────────────────────────────────

/**
 * Test SSH with password authentication
 */
async function testSSH(host, port, credentials = []) {
  const credList = credentials.length > 0 ? credentials : COMMON_SSH_CREDS;
  for (const cred of credList) {
    try {
      const result = await new Promise((resolve) => {
        const conn = new SSHClient();
        const timeout = setTimeout(() => {
          conn.destroy();
          resolve({ success: false });
        }, 6000);

        conn.on('ready', () => {
          clearTimeout(timeout);
          conn.end();
          resolve({ success: true, user: cred.user, password: cred.password });
        });
        conn.on('error', () => {
          clearTimeout(timeout);
          resolve({ success: false });
        });
        conn.connect({
          host, port: parseInt(port) || 22,
          username: cred.user, password: cred.password,
          readyTimeout: 5000,
          algorithms: { serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256'] }
        });
      });
      if (result.success) return result;
    } catch { /* next */ }
  }
  return { success: false };
}

// ─── HTTP Basic/Digest Auth Test ─────────────────────────────────────────────

async function testHTTPBasicAuth(host, port) {
  const axios = require('axios');
  const commonCreds = [
    { user: 'admin', password: 'admin' },
    { user: 'admin', password: '' },
    { user: 'root', password: 'root' },
    { user: 'user', password: 'user' },
  ];
  
  // First check if the endpoint requires auth
  try {
    const url = `http://${host}:${port}/`;
    const resp = await axios.get(url, { timeout: 4000, validateStatus: () => true });
    if (resp.status !== 401) {
      return { success: true, user: '', password: '', noAuth: true, statusCode: resp.status };
    }
    // Try common creds
    for (const cred of commonCreds) {
      try {
        const r = await axios.get(url, {
          auth: { username: cred.user, password: cred.password },
          timeout: 4000, validateStatus: () => true
        });
        if (r.status !== 401) {
          return { success: true, user: cred.user, password: cred.password };
        }
      } catch { /* next */ }
    }
  } catch { /* not reachable */ }
  return { success: false };
}

// ─── Master Credential Test Function ─────────────────────────────────────────

/**
 * Test all services on a discovered asset
 * @param {Object} asset - AssetInventory document
 * @param {Array} customCreds - optional custom credentials to try
 * @returns {Object} results per service
 */
async function testAssetCredentials(asset, orgId, userId, customCreds = []) {
  const results = [];
  const accessibleServices = [];

  for (const portInfo of asset.openPorts) {
    const { port, service } = portInfo;
    let authResult = null;

    try {
      if (['smtp', 'smtps', 'smtp-submission'].includes(service)) {
        authResult = await testSMTP(asset.ip, port, customCreds);
        if (authResult.success) {
          accessibleServices.push('smtp');
          // Create SMTP DataSource
          const existing = await DataSource.findOne({ orgId, name: `SMTP - ${asset.ip}:${port}` });
          if (!existing) {
            await DataSource.create({
              orgId, createdBy: userId,
              name: `SMTP - ${asset.ip}:${port}`,
              type: 'exchange',
              infrastructure: 'on-premises',
              credentials: encrypt(JSON.stringify({
                host: asset.ip, port, username: authResult.user, password: authResult.password,
                protocol: service, tls: port === 465 || port === 993
              })),
              healthStatus: 'healthy', autoDiscovered: true
            });
          }
        }
      } else if (['imap', 'imaps'].includes(service)) {
        authResult = await testIMAP(asset.ip, port, customCreds);
        if (authResult.success) accessibleServices.push('imap');
      } else if (service === 'ssh-sftp') {
        authResult = await testSSH(asset.ip, port, customCreds);
        if (authResult.success) {
          accessibleServices.push('ssh');
          const existing = await DataSource.findOne({ orgId, name: `SFTP - ${asset.ip}:${port}` });
          if (!existing) {
            await DataSource.create({
              orgId, createdBy: userId,
              name: `SFTP - ${asset.ip}:${port}`,
              type: 'sftp',
              infrastructure: 'on-premises',
              credentials: encrypt(JSON.stringify({
                host: asset.ip, port, username: authResult.user, password: authResult.password
              })),
              healthStatus: 'healthy', autoDiscovered: true
            });
          }
        }
      } else if (['http', 'http-alt', 'http-dev', 'http-api'].includes(service)) {
        authResult = await testHTTPBasicAuth(asset.ip, port);
        if (authResult.success) accessibleServices.push(`http:${port}`);
      }
    } catch (err) {
      logger.warn(`[CredAuth] Error testing ${service} on ${asset.ip}:${port}: ${err.message}`);
    }

    results.push({ port, service, authResult });
  }

  // Update asset auth status
  const newStatus = accessibleServices.length > 0 ? 'accessible_credentials' : 'requires_credentials';
  await AssetInventory.findByIdAndUpdate(asset._id, {
    $set: { authStatus: newStatus },
    $addToSet: { accessibleServices: { $each: accessibleServices } }
  });

  return { assetId: asset._id, ip: asset.ip, accessibleServices, results };
}

module.exports = { testSMTP, testIMAP, testSSH, testHTTPBasicAuth, testAssetCredentials };
