#!/usr/bin/env node

/**
 * Real Sample Data Setup Script for MySQL 3307
 * Inserts DIFFERENT critical data than S3 to show clear infrastructure differences
 * Run: node setup-mysql-3307.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'root',
  database: 'datasentinel_demo'
};

async function setupMySQL() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🛡 DataSentinel - MySQL 3307 Setup                        ║');
  console.log('║  ON-PREMISES Critical Data (Different from S3)             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📦 Setting up MySQL with ON-PREMISES critical data...\n');
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

    // ===== TABLE 1: EMPLOYEE PAYROLL (SENSITIVE) =====
    console.log('📋 Creating EMPLOYEE_PAYROLL table...');
    await conn.execute(`
      CREATE TABLE employee_payroll (
        emp_id INT PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        aadhaar_number VARCHAR(20),
        pan_number VARCHAR(20),
        salary DECIMAL(12,2),
        bank_account VARCHAR(20),
        ifsc_code VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const employees = [
      {
        emp_id: 2001,
        full_name: 'Arun Kumar Verma',
        email: 'arun.verma@company.com',
        phone: '9876543210',
        aadhaar_number: '1234 5678 9012',
        pan_number: 'XYZA1234B',
        salary: 1200000,
        bank_account: '9876543210123456',
        ifsc_code: 'AXIS0001234'
      },
      {
        emp_id: 2002,
        full_name: 'Sneha Patel Desai',
        email: 'sneha.patel@company.com',
        phone: '9765432109',
        aadhaar_number: '2345 6789 0123',
        pan_number: 'BCDE5678C',
        salary: 1350000,
        bank_account: '8765432109876543',
        ifsc_code: 'HDFC0002345'
      },
      {
        emp_id: 2003,
        full_name: 'Rajiv Singh Nair',
        email: 'rajiv.singh@company.com',
        phone: '9654321098',
        aadhaar_number: '3456 7890 1234',
        pan_number: 'FGHI9012D',
        salary: 1500000,
        bank_account: '7654321098765432',
        ifsc_code: 'ICIC0003456'
      }
    ];

    for (const emp of employees) {
      await conn.execute(
        `INSERT INTO employee_payroll VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [emp.emp_id, emp.full_name, emp.email, emp.phone, emp.aadhaar_number, 
         emp.pan_number, emp.salary, emp.bank_account, emp.ifsc_code]
      );
    }
    console.log(`✓ Inserted ${employees.length} employee payroll records\n`);

    // ===== TABLE 2: CUSTOMER ACCOUNTS (BANKING) =====
    console.log('📋 Creating CUSTOMER_ACCOUNTS table...');
    await conn.execute(`
      CREATE TABLE customer_accounts (
        account_id INT PRIMARY KEY,
        customer_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        account_number VARCHAR(20),
        ifsc_code VARCHAR(20),
        balance DECIMAL(15,2),
        voter_id VARCHAR(20),
        driving_license VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const accounts = [
      {
        account_id: 3001,
        customer_name: 'Mohit Sharma',
        email: 'mohit.sharma@email.com',
        phone: '9876543210',
        account_number: '1111222233334444',
        ifsc_code: 'SBIN0001111',
        balance: 500000,
        voter_id: 'XYZ1234567',
        driving_license: 'DL01 2020 5555555'
      },
      {
        account_id: 3002,
        customer_name: 'Priya Gupta',
        email: 'priya.gupta@email.com',
        phone: '9765432109',
        account_number: '2222333344445555',
        ifsc_code: 'HDFC0002222',
        balance: 750000,
        voter_id: 'MNO7890123',
        driving_license: 'MH02 2019 6666666'
      },
      {
        account_id: 3003,
        customer_name: 'Vikram Reddy',
        email: 'vikram.reddy@email.com',
        phone: '9654321098',
        account_number: '3333444455556666',
        ifsc_code: 'AXIS0003333',
        balance: 1000000,
        voter_id: 'PQR4567890',
        driving_license: 'KA05 2021 7777777'
      }
    ];

    for (const acc of accounts) {
      await conn.execute(
        `INSERT INTO customer_accounts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [acc.account_id, acc.customer_name, acc.email, acc.phone, acc.account_number,
         acc.ifsc_code, acc.balance, acc.voter_id, acc.driving_license]
      );
    }
    console.log(`✓ Inserted ${accounts.length} customer account records\n`);

    // ===== TABLE 3: INTERNAL TRANSACTIONS =====
    console.log('📋 Creating INTERNAL_TRANSACTIONS table...');
    await conn.execute(`
      CREATE TABLE internal_transactions (
        txn_id INT PRIMARY KEY,
        from_account VARCHAR(20),
        to_account VARCHAR(20),
        amount DECIMAL(12,2),
        upi_id VARCHAR(50),
        ifsc_code VARCHAR(20),
        aadhaar_number VARCHAR(20),
        pan_number VARCHAR(20),
        txn_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const transactions = [
      {
        txn_id: 4001,
        from_account: '1111222233334444',
        to_account: '2222333344445555',
        amount: 100000,
        upi_id: 'mohit.sharma@oksbi',
        ifsc_code: 'SBIN0001111',
        aadhaar_number: '1234 5678 9012',
        pan_number: 'XYZA1234B'
      },
      {
        txn_id: 4002,
        from_account: '2222333344445555',
        to_account: '3333444455556666',
        amount: 250000,
        upi_id: 'priya.gupta@ybl',
        ifsc_code: 'HDFC0002222',
        aadhaar_number: '2345 6789 0123',
        pan_number: 'BCDE5678C'
      },
      {
        txn_id: 4003,
        from_account: '3333444455556666',
        to_account: '1111222233334444',
        amount: 500000,
        upi_id: 'vikram.reddy@upi',
        ifsc_code: 'AXIS0003333',
        aadhaar_number: '3456 7890 1234',
        pan_number: 'FGHI9012D'
      }
    ];

    for (const txn of transactions) {
      await conn.execute(
        `INSERT INTO internal_transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [txn.txn_id, txn.from_account, txn.to_account, txn.amount, txn.upi_id,
         txn.ifsc_code, txn.aadhaar_number, txn.pan_number]
      );
    }
    // ===== TABLE 4: PUBLIC EMPLOYEE DIRECTORY (LOW RISK) =====
    console.log('📋 Creating PUBLIC_EMPLOYEE_DIRECTORY table...');
    await conn.execute(`
      CREATE TABLE public_employee_directory (
        emp_id INT PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        department VARCHAR(100),
        phone VARCHAR(20),
        office_location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const publicEmployees = [
      { emp_id: 5001, full_name: 'John Smith', email: 'john.smith@company.com', department: 'Engineering', phone: '9876543210', office_location: 'New York' },
      { emp_id: 5002, full_name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Marketing', phone: '9765432109', office_location: 'San Francisco' },
      { emp_id: 5003, full_name: 'Mike Chen', email: 'mike.chen@company.com', department: 'Sales', phone: '9654321098', office_location: 'Chicago' },
      { emp_id: 5004, full_name: 'Emma Davis', email: 'emma.davis@company.com', department: 'HR', phone: '9543210987', office_location: 'Boston' },
      { emp_id: 5005, full_name: 'Alex Wilson', email: 'alex.wilson@company.com', department: 'Finance', phone: '9432109876', office_location: 'Seattle' }
    ];

    for (const emp of publicEmployees) {
      await conn.execute(
        `INSERT INTO public_employee_directory VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [emp.emp_id, emp.full_name, emp.email, emp.department, emp.phone, emp.office_location]
      );
    }
    console.log(`✓ Inserted ${publicEmployees.length} public employee directory records\n`);

    // ===== TABLE 5: INTERNAL LOGS (MEDIUM RISK) =====
    console.log('📋 Creating INTERNAL_LOGS table...');
    await conn.execute(`
      CREATE TABLE internal_logs (
        log_id INT PRIMARY KEY,
        user_email VARCHAR(255),
        action VARCHAR(100),
        ip_address VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const logs = [
      { log_id: 6001, user_email: 'user1@company.com', action: 'LOGIN', ip_address: '192.168.1.1' },
      { log_id: 6002, user_email: 'user2@company.com', action: 'FILE_DOWNLOAD', ip_address: '192.168.1.2' },
      { log_id: 6003, user_email: 'user3@company.com', action: 'LOGOUT', ip_address: '192.168.1.3' },
      { log_id: 6004, user_email: 'user4@company.com', action: 'LOGIN', ip_address: '192.168.1.4' },
      { log_id: 6005, user_email: 'user5@company.com', action: 'FILE_UPLOAD', ip_address: '192.168.1.5' }
    ];

    for (const log of logs) {
      await conn.execute(
        `INSERT INTO internal_logs VALUES (?, ?, ?, ?, NOW())`,
        [log.log_id, log.user_email, log.action, log.ip_address]
      );
    }
    console.log(`✓ Inserted ${logs.length} internal log records\n`);

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✨ Setup Complete!                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('🎯 Key Data in MySQL (ON-PREMISES):\n');
    console.log('   Aadhaar Numbers:');
    console.log('   ├─ 1234 5678 9012');
    console.log('   ├─ 2345 6789 0123');
    console.log('   └─ 3456 7890 1234\n');

    console.log('   PAN Numbers:');
    console.log('   ├─ XYZA1234B');
    console.log('   ├─ BCDE5678C');
    console.log('   └─ FGHI9012D\n');

    console.log('   Bank Accounts:');
    console.log('   ├─ 9876543210123456');
    console.log('   ├─ 8765432109876543');
    console.log('   └─ 7654321098765432\n');

    console.log('   IFSC Codes:');
    console.log('   ├─ AXIS0001234');
    console.log('   ├─ HDFC0002345');
    console.log('   └─ ICIC0003456\n');

    console.log('🎯 Key Data in S3 (CLOUD) - DIFFERENT:\n');
    console.log('   Credit Cards:');
    console.log('   ├─ 4532123456789012');
    console.log('   ├─ 5432123456789013');
    console.log('   └─ 6532123456789014\n');

    console.log('   Passports:');
    console.log('   ├─ D1234567');
    console.log('   ├─ E2345678');
    console.log('   └─ F3456789\n');

    console.log('   GSTIN:');
    console.log('   ├─ 32ABCDE1234F1Z0');
    console.log('   ├─ 33FGHIJ5678K1Z5');
    console.log('   └─ 34KLMNO9012P1Z0\n');

    console.log('📝 Next Steps:\n');
    console.log('1️⃣  Go to On-Premises Dashboard');
    console.log('   → Add MySQL source (localhost:3307)');
    console.log('   → Username: root, Password: root');
    console.log('   → Database: datasentinel_demo');
    console.log('   → Run scan → See Aadhaar, PAN, Bank Accounts\n');

    console.log('2️⃣  Go to Cloud Dashboard');
    console.log('   → Add S3 source');
    console.log('   → Run scan → See Credit Cards, Passports, GSTIN\n');

    console.log('3️⃣  Compare Results');
    console.log('   → Completely different PII in each infrastructure!');
    console.log('   → Different risk scores\n');

  } catch (err) {
    console.error('❌ MySQL setup failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

setupMySQL().catch(console.error);
