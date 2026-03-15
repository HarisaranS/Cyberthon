#!/usr/bin/env node

/**
 * Real Sample Data Setup Script
 * Directly inserts critical data into MySQL and S3 with clear differences
 * Run: node setup-sample-data.js
 */

const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: 'datasentinel_demo'
};

const S3_CONFIG = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const S3_BUCKET = process.env.S3_BUCKET || 'datasentinel-demo';

async function setupMySQL() {
  console.log('\n📦 Setting up MySQL with ON-PREMISES critical data...\n');
  let conn;
  try {
    conn = await mysql.createConnection({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password
    });
    
    // Create database
    await conn.execute(`DROP DATABASE IF EXISTS ${MYSQL_CONFIG.database}`);
    await conn.execute(`CREATE DATABASE ${MYSQL_CONFIG.database}`);
    await conn.changeUser({ database: MYSQL_CONFIG.database });
    
    console.log('✓ Database created\n');

    // ===== ON-PREMISES: EMPLOYEE RECORDS =====
    console.log('📋 Creating EMPLOYEE_RECORDS table (On-Premises)...');
    await conn.execute(`
      CREATE TABLE employee_records (
        emp_id INT PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone_number VARCHAR(20),
        aadhaar_number VARCHAR(20),
        pan_number VARCHAR(20),
        date_of_birth DATE,
        salary DECIMAL(10,2),
        bank_account VARCHAR(20),
        ifsc_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const employees = [
      {
        emp_id: 1001,
        full_name: 'Rajesh Kumar Singh',
        email: 'rajesh.kumar@company.com',
        phone_number: '9876543210',
        aadhaar_number: '2345 6789 0123',
        pan_number: 'ABCDE1234F',
        date_of_birth: '1990-05-15',
        salary: 750000,
        bank_account: '1234567890123456',
        ifsc_code: 'HDFC0001234'
      },
      {
        emp_id: 1002,
        full_name: 'Priya Sharma Verma',
        email: 'priya.sharma@company.com',
        phone_number: '9123456789',
        aadhaar_number: '3456 7890 1234',
        pan_number: 'FGHIJ5678K',
        date_of_birth: '1992-08-22',
        salary: 850000,
        bank_account: '2345678901234567',
        ifsc_code: 'ICIC0000001'
      },
      {
        emp_id: 1003,
        full_name: 'Amit Patel Desai',
        email: 'amit.patel@company.com',
        phone_number: '8765432109',
        aadhaar_number: '4567 8901 2345',
        pan_number: 'KLMNO9012P',
        date_of_birth: '1988-03-10',
        salary: 920000,
        bank_account: '3456789012345678',
        ifsc_code: 'SBIN0001234'
      }
    ];

    for (const emp of employees) {
      await conn.execute(
        `INSERT INTO employee_records VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [emp.emp_id, emp.full_name, emp.email, emp.phone_number, emp.aadhaar_number, 
         emp.pan_number, emp.date_of_birth, emp.salary, emp.bank_account, emp.ifsc_code]
      );
    }
    console.log(`✓ Inserted ${employees.length} employee records\n`);

    // ===== ON-PREMISES: CUSTOMER DATABASE =====
    console.log('📋 Creating CUSTOMER_DATABASE table (On-Premises)...');
    await conn.execute(`
      CREATE TABLE customer_database (
        customer_id INT PRIMARY KEY,
        customer_name VARCHAR(255),
        email VARCHAR(255),
        mobile VARCHAR(20),
        voter_id VARCHAR(20),
        passport_number VARCHAR(20),
        driving_license VARCHAR(30),
        gstin VARCHAR(20),
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const customers = [
      {
        customer_id: 5001,
        customer_name: 'Vikram Singh Rajput',
        email: 'vikram.rajput@email.com',
        mobile: '9988776655',
        voter_id: 'ABC1234567',
        passport_number: 'A1234567',
        driving_license: 'MH02 2020 1234567',
        gstin: '27AAPFU0939F1ZV'
      },
      {
        customer_id: 5002,
        customer_name: 'Neha Gupta Iyer',
        email: 'neha.gupta@email.com',
        mobile: '9876543210',
        voter_id: 'DEF7890123',
        passport_number: 'B2345678',
        driving_license: 'KA05 2019 5678901',
        gstin: '18AABCT1234H1Z0'
      },
      {
        customer_id: 5003,
        customer_name: 'Arjun Reddy Nair',
        email: 'arjun.reddy@email.com',
        mobile: '9765432109',
        voter_id: 'GHI4567890',
        passport_number: 'C3456789',
        driving_license: 'TN01 2021 9876543',
        gstin: '29ABCDE1234F1Z5'
      }
    ];

    for (const cust of customers) {
      await conn.execute(
        `INSERT INTO customer_database VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [cust.customer_id, cust.customer_name, cust.email, cust.mobile, cust.voter_id,
         cust.passport_number, cust.driving_license, cust.gstin]
      );
    }
    console.log(`✓ Inserted ${customers.length} customer records\n`);

    // ===== ON-PREMISES: TRANSACTION LOGS =====
    console.log('📋 Creating TRANSACTION_LOGS table (On-Premises)...');
    await conn.execute(`
      CREATE TABLE transaction_logs (
        transaction_id INT PRIMARY KEY,
        customer_id INT,
        amount DECIMAL(12,2),
        upi_id VARCHAR(50),
        ifsc_code VARCHAR(20),
        account_number VARCHAR(20),
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const transactions = [
      {
        transaction_id: 10001,
        customer_id: 5001,
        amount: 50000.00,
        upi_id: 'vikram.rajput@oksbi',
        ifsc_code: 'HDFC0001234',
        account_number: '1234567890123456'
      },
      {
        transaction_id: 10002,
        customer_id: 5002,
        amount: 35000.00,
        upi_id: 'neha.gupta@ybl',
        ifsc_code: 'ICIC0000001',
        account_number: '2345678901234567'
      },
      {
        transaction_id: 10003,
        customer_id: 5003,
        amount: 72000.00,
        upi_id: 'arjun.reddy@upi',
        ifsc_code: 'SBIN0001234',
        account_number: '3456789012345678'
      }
    ];

    for (const txn of transactions) {
      await conn.execute(
        `INSERT INTO transaction_logs VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [txn.transaction_id, txn.customer_id, txn.amount, txn.upi_id, txn.ifsc_code, txn.account_number]
      );
    }
    console.log(`✓ Inserted ${transactions.length} transaction records\n`);

    console.log('✅ MySQL ON-PREMISES data setup complete!\n');
    console.log('📊 MySQL Data Summary:');
    console.log('   - 3 Employee records with Aadhaar, PAN, Bank details');
    console.log('   - 3 Customer records with Voter ID, Passport, Driving License, GSTIN');
    console.log('   - 3 Transaction records with UPI, IFSC, Account numbers\n');

  } catch (err) {
    console.error('❌ MySQL setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

async function setupS3() {
  console.log('📦 Setting up S3 with CLOUD critical data...\n');
  try {
    // Validate credentials
    if (!S3_CONFIG.credentials.accessKeyId || !S3_CONFIG.credentials.secretAccessKey) {
      console.warn('⚠️  AWS credentials not configured in .env');
      console.warn('   Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET');
      console.warn('   Skipping S3 setup...\n');
      return;
    }

    console.log(`📋 AWS Credentials Check:`);
    console.log(`   Region: ${S3_CONFIG.region}`);
    console.log(`   Bucket: ${S3_BUCKET}`);
    console.log(`   Access Key: ${S3_CONFIG.credentials.accessKeyId.substring(0, 4)}...`);
    console.log(`   Secret Key: ${S3_CONFIG.credentials.secretAccessKey.substring(0, 4)}...\n`);

    const s3 = new S3Client(S3_CONFIG);

    // Check if bucket exists, if not create it
    console.log(`📋 Checking S3 bucket: ${S3_BUCKET}...`);
    try {
      await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`✓ Bucket exists\n`);
    } catch (err) {
      if (err.name === 'NoSuchBucket' || err.$metadata?.httpStatusCode === 404) {
        console.log(`✓ Creating bucket: ${S3_BUCKET}...`);
        try {
          await s3.send(new CreateBucketCommand({
            Bucket: S3_BUCKET,
            CreateBucketConfiguration: {
              LocationConstraint: S3_CONFIG.region
            }
          }));
          console.log(`✓ Bucket created\n`);
        } catch (createErr) {
          console.error(`❌ Failed to create bucket: ${createErr.message}`);
          console.error(`   Make sure your AWS credentials have S3 permissions\n`);
          return;
        }
      } else {
        console.error(`❌ AWS Error: ${err.message}`);
        console.error(`   Code: ${err.Code || err.name}`);
        console.error(`   Make sure your AWS credentials are valid\n`);
        return;
      }
    }

    // ===== CLOUD: PAYMENT RECORDS =====
    console.log('📋 Creating payment_records.csv (Cloud)...');
    const paymentCSV = `payment_id,customer_name,email,phone,credit_card_number,cvv,expiry,amount,timestamp
PAY001,Deepak Verma,deepak.verma@gmail.com,9876543210,4532123456789012,123,12/25,15000.00,2024-01-15 10:30:00
PAY002,Anjali Mishra,anjali.mishra@gmail.com,9765432109,5432123456789013,456,11/26,8500.00,2024-01-15 11:45:00
PAY003,Rohan Joshi,rohan.joshi@gmail.com,9654321098,6532123456789014,789,10/27,22000.00,2024-01-15 14:20:00
PAY004,Sanjay Kumar,sanjay.kumar@gmail.com,9543210987,7632123456789015,234,09/28,45000.00,2024-01-15 15:30:00
PAY005,Meera Singh,meera.singh@gmail.com,9432109876,8732123456789016,567,08/29,12500.00,2024-01-15 16:45:00`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'cloud-data/payment_records.csv',
      Body: paymentCSV,
      ContentType: 'text/csv'
    }));
    console.log('✓ Uploaded payment_records.csv\n');

    // ===== CLOUD: CUSTOMER EXPORT =====
    console.log('📋 Creating customer_export.json (Cloud)...');
    const customerJSON = JSON.stringify([
      {
        customer_id: 'CUST001',
        full_name: 'Suresh Iyer',
        email: 'suresh.iyer@email.com',
        phone: '9876543210',
        passport: 'D1234567',
        aadhaar: '5678 9012 3456',
        pan: 'QRSTU1234V',
        gstin: '32ABCDE1234F1Z0',
        credit_card: '4532123456789012'
      },
      {
        customer_id: 'CUST002',
        full_name: 'Divya Nambiar',
        email: 'divya.nambiar@email.com',
        phone: '9765432109',
        passport: 'E2345678',
        aadhaar: '6789 0123 4567',
        pan: 'VWXYZ5678A',
        gstin: '33FGHIJ5678K1Z5',
        credit_card: '5432123456789013'
      },
      {
        customer_id: 'CUST003',
        full_name: 'Vikram Desai',
        email: 'vikram.desai@email.com',
        phone: '9654321098',
        passport: 'F3456789',
        aadhaar: '7890 1234 5678',
        pan: 'BCDEF9012G',
        gstin: '34KLMNO9012P1Z0',
        credit_card: '6532123456789014'
      }
    ], null, 2);

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'cloud-data/customer_export.json',
      Body: customerJSON,
      ContentType: 'application/json'
    }));
    console.log('✓ Uploaded customer_export.json\n');

    // ===== CLOUD: BANK STATEMENTS =====
    console.log('📋 Creating bank_statements.txt (Cloud)...');
    const bankStatements = `CONFIDENTIAL BANK STATEMENTS
=====================================

Account Holder: Pradeep Nair
Account Number: 1234567890123456
IFSC Code: HDFC0001234
Balance: ₹500,000
Passport: D1234567
Driving License: KA02 2018 7654321
UPI ID: pradeep.nair@oksbi
Email: pradeep.nair@company.com
Phone: 9876543210

Account Holder: Kavya Reddy
Account Number: 2345678901234567
IFSC Code: ICIC0000001
Balance: ₹750,000
Passport: E2345678
Driving License: TN03 2019 8765432
UPI ID: kavya.reddy@ybl
Email: kavya.reddy@company.com
Phone: 9765432109

Account Holder: Vikram Desai
Account Number: 3456789012345678
IFSC Code: SBIN0001234
Balance: ₹1,000,000
Passport: F3456789
Driving License: MH04 2020 9876543
UPI ID: vikram.desai@upi
Email: vikram.desai@company.com
Phone: 9654321098`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'cloud-data/bank_statements.txt',
      Body: bankStatements,
      ContentType: 'text/plain'
    }));
    console.log('✓ Uploaded bank_statements.txt\n');

    // ===== CLOUD: EMPLOYEE PAYROLL =====
    console.log('📋 Creating employee_payroll.csv (Cloud)...');
    const payrollCSV = `emp_id,employee_name,email,phone,aadhaar,pan,salary,bank_account,ifsc,voter_id
EMP101,Pradeep Kumar,pradeep.k@company.com,9876543210,8901 2345 6789,GHIJK1234L,1200000,1234567890123456,HDFC0001234,JKL1234567
EMP102,Kavya Sharma,kavya.s@company.com,9765432109,9012 3456 7890,LMNOP5678Q,1350000,2345678901234567,ICIC0000001,MNO7890123
EMP103,Vikram Nair,vikram.n@company.com,9654321098,0123 4567 8901,QRSTU9012R,1500000,3456789012345678,SBIN0001234,PQR4567890`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'cloud-data/employee_payroll.csv',
      Body: payrollCSV,
      ContentType: 'text/csv'
    }));
    console.log('✓ Uploaded employee_payroll.csv\n');

    // ===== CLOUD: SENSITIVE DOCUMENTS =====
    console.log('📋 Creating sensitive_documents.txt (Cloud)...');
    const sensitiveDoc = `SENSITIVE CUSTOMER DATA - DO NOT SHARE
========================================

Customer: Sanjay Kumar
Email: sanjay.kumar@email.com
Phone: 9876543210
Passport Number: A1234567
Voter ID: ABC1234567
Driving License: MH02 2020 1234567
Credit Card: 4532123456789012
CVV: 123
Expiry: 12/25
GSTIN: 27AAPFU0939F1ZV
Aadhaar: 2345 6789 0123
PAN: ABCDE1234F

Customer: Meera Singh
Email: meera.singh@email.com
Phone: 9765432109
Passport Number: B2345678
Voter ID: DEF7890123
Driving License: KA05 2019 5678901
Credit Card: 5432123456789013
CVV: 456
Expiry: 11/26
GSTIN: 18AABCT1234H1Z0
Aadhaar: 3456 7890 1234
PAN: FGHIJ5678K`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: 'cloud-data/sensitive_documents.txt',
      Body: sensitiveDoc,
      ContentType: 'text/plain'
    }));
    console.log('✓ Uploaded sensitive_documents.txt\n');

    console.log('✅ S3 CLOUD data setup complete!\n');
    console.log('📊 S3 Data Summary:');
    console.log('   - payment_records.csv: 5 payment records with credit cards & CVV');
    console.log('   - customer_export.json: 3 customers with passports, Aadhaar, PAN, GSTIN');
    console.log('   - bank_statements.txt: 3 bank accounts with account numbers, IFSC, UPI');
    console.log('   - employee_payroll.csv: 3 employees with Aadhaar, PAN, bank details');
    console.log('   - sensitive_documents.txt: Customer data with passports, credit cards\n');

  } catch (err) {
    console.error('❌ S3 setup failed:', err.message);
    console.error('   Full error:', err);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🛡 DataSentinel - Real Sample Data Setup                  ║');
  console.log('║  ON-PREMISES vs CLOUD Infrastructure                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await setupMySQL();
  await setupS3();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✨ Setup Complete!                                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🎯 Next Steps:\n');
  console.log('1️⃣  Go to ON-PREMISES Dashboard');
  console.log('   → Add MySQL source (localhost:3306)');
  console.log('   → Username: root, Password: root');
  console.log('   → Database: datasentinel_demo');
  console.log('   → Run scan → See Aadhaar, PAN, Bank details\n');

  console.log('2️⃣  Go to CLOUD Dashboard');
  console.log('   → Add S3 source (your bucket)');
  console.log('   → Run scan → See Credit cards, Passports, GSTIN\n');

  console.log('3️⃣  Compare Results');
  console.log('   → Different PII detected in each infrastructure');
  console.log('   → Separate risk scores and compliance reports\n');

  console.log('📊 Key Differences:\n');
  console.log('   ON-PREMISES (MySQL):');
  console.log('   ├─ Aadhaar: 2345 6789 0123, 3456 7890 1234, 4567 8901 2345');
  console.log('   ├─ PAN: ABCDE1234F, FGHIJ5678K, KLMNO9012P');
  console.log('   ├─ Bank Accounts: 1234567890123456, 2345678901234567, 3456789012345678');
  console.log('   └─ IFSC: HDFC0001234, ICIC0000001, SBIN0001234\n');

  console.log('   CLOUD (S3):');
  console.log('   ├─ Credit Cards: 4532123456789012, 5432123456789013, 6532123456789014');
  console.log('   ├─ Passports: D1234567, E2345678, F3456789');
  console.log('   ├─ GSTIN: 32ABCDE1234F1Z0, 33FGHIJ5678K1Z5, 34KLMNO9012P1Z0');
  console.log('   └─ Voter IDs: ABC1234567, DEF7890123, GHI4567890\n');
}

main().catch(console.error);
