const { S3Client, CreateBucketCommand, PutObjectCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'REDACTED_AWS_KEY',
    secretAccessKey: 'REDACTED_AWS_SECRET'
  }
});

const BUCKET_NAME = 'datasentinel-vulnerable-test-bucket';

// Sample vulnerable files with PII
const vulnerableFiles = {
  'employees/employee_data.csv': `emp_id,name,aadhaar,pan,mobile,email,salary,bank_account,ifsc
EMP001,Rajesh Kumar,234567890123,ABCDE1234F,9876543210,rajesh.k@company.com,850000,12345678901234,HDFC0001234
EMP002,Priya Sharma,345678901234,BCDEF2345G,9876543211,priya.s@company.com,650000,23456789012345,ICIC0002345
EMP003,Amit Patel,456789012345,CDEFG3456H,9876543212,amit.p@company.com,750000,34567890123456,SBIN0003456
EMP004,Sneha Reddy,567890123456,DEFGH4567I,9876543213,sneha.r@company.com,550000,45678901234567,HDFC0004567
EMP005,Vikram Malhotra,678901234567,EFGHI5678J,9876543214,vikram.m@company.com,920000,56789012345678,ICIC0005678`,

  'customers/customer_info.json': JSON.stringify({
    customers: [
      {
        id: 1,
        name: "Suresh Raman",
        aadhaar: "234512345678",
        pan: "ABCPK1234L",
        mobile: "9123456789",
        email: "suresh.r@gmail.com",
        credit_card: "4532123456789012",
        cvv: "123",
        expiry: "12/2025",
        voter_id: "ABC1234567"
      },
      {
        id: 2,
        name: "Lakshmi Menon",
        aadhaar: "345623456789",
        pan: "BCDPL2345M",
        mobile: "9123456790",
        email: "lakshmi.m@yahoo.com",
        credit_card: "5412345678901234",
        cvv: "234",
        expiry: "06/2026",
        voter_id: "BCD2345678"
      }
    ]
  }, null, 2),

  'medical/patient_records.txt': `Patient: Ramesh Choudhary
Aadhaar: 234598765432
Mobile: 9988776655
Email: ramesh.c@email.com
Blood Group: O+
Diagnosis: Type 2 Diabetes
Prescription: Metformin 500mg twice daily
Insurance: INS123456789
Emergency Contact: 9988776656

Patient: Sunita Joshi
Aadhaar: 345609876543
Mobile: 9988776657
Email: sunita.j@email.com
Blood Group: A+
Diagnosis: Hypertension
Prescription: Amlodipine 5mg once daily
Insurance: INS234567890
Emergency Contact: 9988776658`,

  'config/.env': `# Database Credentials
DB_HOST=production-db.company.com
DB_USER=admin
DB_PASSWORD=REDACTED_PWD
DB_NAME=production_db

# API Keys
AWS_ACCESS_KEY=REDACTED_AWS_KEY
AWS_SECRET_KEY=REDACTED_AWS_SECRET
STRIPE_SECRET_KEY=REDACTED_STRIPE_KEY

# Admin Credentials
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=Admin@2024!
ADMIN_AADHAAR=234567891234
ADMIN_PAN=ABCDE1234F`,

  'backups/user_backup.sql': `INSERT INTO users (name, aadhaar, pan, mobile, email, password_hash) VALUES
('Sanjay Mehta', '234567891234', 'AABCS1234D', '9876512345', 'sanjay@company.com', '$2b$12$hash1'),
('Neha Agarwal', '345678902345', 'BBCDT2345E', '9876512346', 'neha@company.com', '$2b$12$hash2'),
('Rohit Khanna', '456789013456', 'CCDEU3456F', '9876512347', 'rohit@company.com', '$2b$12$hash3');

INSERT INTO payment_methods (user_id, card_number, cvv, expiry, bank_account, ifsc) VALUES
(1, '4532123456789012', '123', '12/2025', '12340001234567', 'HDFC0001234'),
(2, '5412345678901234', '234', '06/2026', '23450002345678', 'ICIC0002345'),
(3, '6011123456789012', '345', '09/2024', '34560003456789', 'SBIN0003456');`,

  'logs/access.log': `2024-03-13 10:15:23 - User login: rajesh.kumar@company.com (Aadhaar: 234567890123)
2024-03-13 10:16:45 - Payment processed: Card ending 9012, Amount: ₹25000
2024-03-13 10:18:12 - KYC verification: PAN ABCDE1234F, Mobile 9876543210
2024-03-13 10:20:33 - Password reset: Email priya.sharma@company.com, Mobile 9876543211
2024-03-13 10:22:54 - Bank transfer: Account 12345678901234, IFSC HDFC0001234, Amount: ₹50000`,

  'reports/financial_report.xlsx.txt': `Financial Report Q1 2024

Employee Salaries:
Rajesh Kumar (PAN: ABCDE1234F) - ₹850,000 - Account: 12345678901234
Priya Sharma (PAN: BCDEF2345G) - ₹650,000 - Account: 23456789012345
Amit Patel (PAN: CDEFG3456H) - ₹750,000 - Account: 34567890123456

Customer Transactions:
Suresh Raman (Aadhaar: 234512345678) - Card: 4532****9012 - ₹125,000
Lakshmi Menon (Aadhaar: 345623456789) - Card: 5412****1234 - ₹85,000`,

  'kyc/documents_list.csv': `customer_id,name,aadhaar,pan,voter_id,passport,mobile,email,verification_status
1001,Harish Rao,234567123456,AABCH1234K,TLG1234567,A1234567,9876512345,harish.rao@email.com,approved
1002,Madhavi Reddy,345678234567,BBCDM2345L,TLG2345678,B2345678,9876512346,madhavi.r@email.com,approved
1003,Venkat Swamy,456789345678,CCDVN3456M,TLG3456789,C3456789,9876512347,venkat.s@email.com,pending
1004,Shalini Devi,567890456789,DDESD4567N,TLG4567890,D4567890,9876512348,shalini.d@email.com,approved`
};

async function setupVulnerableS3Bucket() {
  try {
    console.log('🔧 Creating vulnerable S3 bucket...');
    
    // Create bucket
    try {
      await s3Client.send(new CreateBucketCommand({
        Bucket: BUCKET_NAME,
        CreateBucketConfiguration: {
          LocationConstraint: 'ap-south-1'
        }
      }));
      console.log(`✅ Bucket created: ${BUCKET_NAME}`);
    } catch (err) {
      if (err.name === 'BucketAlreadyOwnedByYou') {
        console.log(`✅ Bucket already exists: ${BUCKET_NAME}`);
      } else {
        throw err;
      }
    }

    // Upload vulnerable files
    console.log('\n📤 Uploading vulnerable files with PII...');
    for (const [key, content] of Object.entries(vulnerableFiles)) {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: key.endsWith('.json') ? 'application/json' : 
                     key.endsWith('.csv') ? 'text/csv' : 'text/plain'
      }));
      console.log(`  ✅ Uploaded: ${key}`);
    }

    console.log('\n✅ Vulnerable S3 bucket setup complete!');
    console.log(`\n📊 Summary:`);
    console.log(`  Bucket: ${BUCKET_NAME}`);
    console.log(`  Region: ap-south-1`);
    console.log(`  Files: ${Object.keys(vulnerableFiles).length}`);
    console.log(`  PII Types: Aadhaar, PAN, Credit Cards, Passwords, Bank Accounts`);
    console.log(`\n🔍 Add this to DataSentinel:`);
    console.log(`  Type: S3`);
    console.log(`  Bucket: ${BUCKET_NAME}`);
    console.log(`  Region: ap-south-1`);
    console.log(`  Access Key: REDACTED_AWS_KEY`);
    console.log(`  Secret Key: REDACTED_AWS_SECRET`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setupVulnerableS3Bucket();
