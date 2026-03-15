/**
 * Cloud Scan Service
 * Discovers cloud resources from IAM credentials (AWS, GCP, Azure)
 * and auto-registers them as DataSources for PII scanning.
 */

const logger = require('../config/logger');
const DataSource = require('../models/DataSource');
const CloudCredential = require('../models/CloudCredential');
const { encrypt, decrypt } = require('./encryptionService');

// ─── AWS Discovery ────────────────────────────────────────────────────────────

async function discoverAWS(orgId, userId, credentials) {
  const { S3Client, ListBucketsCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');
  const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
  const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
  
  const { accessKeyId, secretAccessKey, region = 'us-east-1' } = credentials;
  const awsCreds = { accessKeyId, secretAccessKey };
  const discovered = [];

  // Discover S3 Buckets
  try {
    const s3 = new S3Client({ region, credentials: awsCreds });
    const { Buckets = [] } = await s3.send(new ListBucketsCommand({}));
    
    for (const bucket of Buckets) {
      let bucketRegion = region;
      try {
        const locResp = await s3.send(new GetBucketLocationCommand({ Bucket: bucket.Name }));
        bucketRegion = locResp.LocationConstraint || 'us-east-1';
      } catch { /* use default */ }
      
      const sourceName = `AWS S3 - ${bucket.Name}`;
      const existing = await DataSource.findOne({ orgId, name: sourceName });
      if (!existing) {
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: 's3', infrastructure: 'cloud',
          credentials: encrypt(JSON.stringify({ bucket: bucket.Name, region: bucketRegion, accessKeyId, secretAccessKey, prefix: '' })),
          healthStatus: 'healthy', autoDiscovered: true
        });
        discovered.push({ type: 's3', name: source.name, id: source._id });
        logger.info(`[AWS Discovery] Registered S3 bucket: ${bucket.Name}`);
      }
    }
  } catch (err) {
    logger.warn(`[AWS Discovery] S3 discovery failed: ${err.message}`);
  }

  // Discover RDS Instances
  try {
    const rds = new RDSClient({ region, credentials: awsCreds });
    const { DBInstances = [] } = await rds.send(new DescribeDBInstancesCommand({}));
    
    for (const db of DBInstances) {
      if (!db.Endpoint) continue;
      const dbType = db.Engine.includes('mysql') ? 'mysql'
        : db.Engine.includes('postgres') ? 'postgresql'
        : db.Engine.includes('sqlserver') ? 'mssql' : 'mysql';
      
      const sourceName = `AWS RDS - ${db.DBInstanceIdentifier}`;
      const existing = await DataSource.findOne({ orgId, name: sourceName });
      if (!existing) {
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: dbType, infrastructure: 'cloud',
          credentials: encrypt(JSON.stringify({
            host: db.Endpoint.Address, port: db.Endpoint.Port, database: db.DBName || 'main',
            username: db.MasterUsername, password: '(set manually)', ssl: true
          })),
          healthStatus: 'unknown', autoDiscovered: true,
          tags: [`aws`, `rds`, `${db.Engine}`, region]
        });
        discovered.push({ type: dbType, name: source.name, id: source._id, note: 'Set password manually' });
        logger.info(`[AWS Discovery] Registered RDS: ${db.DBInstanceIdentifier}`);
      }
    }
  } catch (err) {
    logger.warn(`[AWS Discovery] RDS discovery failed: ${err.message}`);
  }

  // Discover DynamoDB Tables
  try {
    const ddb = new DynamoDBClient({ region, credentials: awsCreds });
    const { TableNames = [] } = await ddb.send(new ListTablesCommand({}));
    
    for (const tableName of TableNames) {
      const sourceName = `AWS DynamoDB - ${tableName}`;
      const existing = await DataSource.findOne({ orgId, name: sourceName });
      if (!existing) {
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: 'rest_api', infrastructure: 'cloud',
          credentials: encrypt(JSON.stringify({ provider: 'aws_dynamodb', accessKeyId, secretAccessKey, region, tableName })),
          healthStatus: 'healthy', autoDiscovered: true,
          tags: ['aws', 'dynamodb', region]
        });
        discovered.push({ type: 'dynamodb', name: source.name, id: source._id });
        logger.info(`[AWS Discovery] Registered DynamoDB table: ${tableName}`);
      }
    }
  } catch (err) {
    logger.warn(`[AWS Discovery] DynamoDB discovery failed: ${err.message}`);
  }

  return discovered;
}

// ─── GCP Discovery ────────────────────────────────────────────────────────────

async function discoverGCP(orgId, userId, credentials) {
  const { Storage } = require('@google-cloud/storage');
  const { projectId, serviceAccountJson } = credentials;
  
  if (!projectId || !serviceAccountJson) {
    return [];
  }

  const discovered = [];
  const serviceAccount = typeof serviceAccountJson === 'string'
    ? JSON.parse(serviceAccountJson) : serviceAccountJson;

  // Discover GCS Buckets
  try {
    const storage = new Storage({ projectId, credentials: serviceAccount });
    const [buckets] = await storage.getBuckets();
    
    for (const bucket of buckets) {
      const sourceName = `GCP GCS - ${bucket.name}`;
      const existing = await DataSource.findOne({ orgId, name: sourceName });
      if (!existing) {
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: 'azure_blob', infrastructure: 'cloud',
          credentials: encrypt(JSON.stringify({ provider: 'gcp_gcs', projectId, serviceAccountJson, bucketName: bucket.name })),
          healthStatus: 'healthy', autoDiscovered: true,
          tags: ['gcp', 'gcs']
        });
        discovered.push({ type: 'gcs', name: source.name, id: source._id });
        logger.info(`[GCP Discovery] Registered GCS bucket: ${bucket.name}`);
      }
    }
  } catch (err) {
    logger.warn(`[GCP Discovery] GCS discovery failed: ${err.message}`);
  }

  return discovered;
}

// ─── Azure Discovery ──────────────────────────────────────────────────────────

async function discoverAzure(orgId, userId, credentials) {
  const { tenantId, clientId, clientSecret, subscriptionId } = credentials;
  
  if (!tenantId || !clientId || !clientSecret || !subscriptionId) {
    logger.warn('[Azure Discovery] Missing credentials');
    return [];
  }

  const discovered = [];

  // Get bearer token from Azure AD
  try {
    const axios = require('axios');
    const tokenResp = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: 'client_credentials', client_id: clientId,
        client_secret: clientSecret, scope: 'https://management.azure.com/.default'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = tokenResp.data.access_token;

    // Discover Storage Accounts
    const storageResp = await axios.get(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Storage/storageAccounts?api-version=2023-01-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    for (const account of (storageResp.data.value || [])) {
      const sourceName = `Azure Blob - ${account.name}`;
      const existing = await DataSource.findOne({ orgId, name: sourceName });
      if (!existing) {
        const source = await DataSource.create({
          orgId, createdBy: userId, name: sourceName, type: 'azure_blob', infrastructure: 'cloud',
          credentials: encrypt(JSON.stringify({ provider: 'azure_blob', tenantId, clientId, clientSecret, subscriptionId, accountName: account.name })),
          healthStatus: 'healthy', autoDiscovered: true,
          tags: ['azure', 'blob', account.location]
        });
        discovered.push({ type: 'azure_blob', name: source.name, id: source._id });
        logger.info(`[Azure Discovery] Registered storage account: ${account.name}`);
      }
    }

    // Discover Azure SQL databases
    const sqlServersResp = await axios.get(
      `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Sql/servers?api-version=2023-05-01-preview`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    for (const server of (sqlServersResp.data.value || [])) {
      const dbsResp = await axios.get(
        `https://management.azure.com${server.id}/databases?api-version=2023-05-01-preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      for (const db of (dbsResp.data.value || [])) {
        if (db.name === 'master') continue;
        const sourceName = `Azure SQL - ${server.name}/${db.name}`;
        const existing = await DataSource.findOne({ orgId, name: sourceName });
        if (!existing) {
          const source = await DataSource.create({
            orgId, createdBy: userId, name: sourceName, type: 'mssql', infrastructure: 'cloud',
            credentials: encrypt(JSON.stringify({
              host: `${server.name}.database.windows.net`, port: 1433,
              database: db.name, username: '(set manually)', password: '(set manually)', ssl: true
            })),
            healthStatus: 'unknown', autoDiscovered: true,
            tags: ['azure', 'sql', server.location]
          });
          discovered.push({ type: 'mssql', name: source.name, id: source._id, note: 'Set credentials manually' });
          logger.info(`[Azure Discovery] Registered SQL DB: ${server.name}/${db.name}`);
        }
      }
    }
  } catch (err) {
    logger.warn(`[Azure Discovery] Failed: ${err.message}`);
  }

  return discovered;
}

// ─── Master Cloud Discovery ───────────────────────────────────────────────────

/**
 * Run discovery for all cloud credentials belonging to an org
 */
async function runCloudDiscovery(orgId, userId, specificCredId = null) {
  const query = { orgId, isActive: true };
  if (specificCredId) query._id = specificCredId;
  
  const credentials = await CloudCredential.find(query);
  const allDiscovered = [];

  for (const cred of credentials) {
    await CloudCredential.findByIdAndUpdate(cred._id, { status: 'discovering' });
    try {
      const decrypted = JSON.parse(decrypt(cred.encryptedCredentials));
      let discovered = [];

      if (cred.provider === 'aws') discovered = await discoverAWS(orgId, userId, decrypted);
      else if (cred.provider === 'gcp') discovered = await discoverGCP(orgId, userId, decrypted);
      else if (cred.provider === 'azure') discovered = await discoverAzure(orgId, userId, decrypted);

      await CloudCredential.findByIdAndUpdate(cred._id, {
        status: 'active', lastDiscoveredAt: new Date(), discoveredResources: discovered.length, lastError: null
      });
      allDiscovered.push(...discovered);
    } catch (err) {
      logger.error(`[Cloud Discovery] Credential ${cred._id} failed: ${err.message}`);
      await CloudCredential.findByIdAndUpdate(cred._id, { status: 'error', lastError: err.message });
    }
  }

  return allDiscovered;
}

module.exports = { discoverAWS, discoverGCP, discoverAzure, runCloudDiscovery };
