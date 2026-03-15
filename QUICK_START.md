# Quick Start: Infrastructure Separation with Real Data

## 🚀 Setup Real Data (5 minutes)

### Step 1: Run Sample Data Setup Script (2 min)

```bash
cd backend
node setup-sample-data.js
```

**Expected Output:**
```
✅ MySQL ON-PREMISES data setup complete!
   - 3 Employee records with Aadhaar, PAN, Bank details
   - 3 Customer records with Voter ID, Passport, Driving License, GSTIN
   - 3 Transaction records with UPI, IFSC, Account numbers

✅ S3 CLOUD data setup complete!
   - payment_records.csv: 5 payment records with credit cards & CVV
   - customer_export.json: 3 customers with passports, Aadhaar, PAN, GSTIN
   - bank_statements.txt: 3 bank accounts with account numbers, IFSC, UPI
   - employee_payroll.csv: 3 employees with Aadhaar, PAN, bank details
   - sensitive_documents.txt: Customer data with passports, credit cards
```

### Step 2: Verify MySQL Data

```bash
mysql -u REDACTED_DB_PWD -p datasentinel_demo -e "SELECT * FROM employee_records;"
```

**You should see:**
```
| emp_id | full_name           | aadhaar_number    | pan_number  |
|--------|---------------------|-------------------|-------------|
| 1001   | Rajesh Kumar Singh  | 2345 6789 0123    | ABCDE1234F  |
| 1002   | Priya Sharma Verma  | 3456 7890 1234    | FGHIJ5678K  |
| 1003   | Amit Patel Desai    | 4567 8901 2345    | KLMNO9012P  |
```

### Step 3: Verify S3 Data

```bash
aws s3 ls s3://your-bucket/cloud-data/
```

**You should see:**
```
payment_records.csv
customer_export.json
bank_statements.txt
employee_payroll.csv
sensitive_documents.txt
```

## 🎯 Test in UI (3 minutes)

### ON-PREMISES Dashboard

1. **Click "On-Premises"** in sidebar
2. **Click "Add Data Source"**
3. **Select MySQL**
4. **Fill in:**
   - Host: `localhost`
   - Port: `3306`
   - Username: `REDACTED_DB_PWD`
   - Password: `password`
   - Database: `datasentinel_demo`
5. **Click "Test Connection"** → ✅ Success
6. **Click "Create Source"**
7. **Click "Scan"** button
8. **Watch real PII detection:**

   **Expected Findings:**
   - ✅ Aadhaar: 2345 6789 0123, 3456 7890 1234, 4567 8901 2345
   - ✅ PAN: ABCDE1234F, FGHIJ5678K, KLMNO9012P
   - ✅ Bank Accounts: 1234567890123456, 2345678901234567, 3456789012345678
   - ✅ IFSC Codes: HDFC0001234, ICIC0000001, SBIN0001234
   - ✅ Voter IDs: ABC1234567, DEF7890123, GHI4567890
   - ✅ Passports: A1234567, B2345678, C3456789
   - ✅ GSTIN: 27AAPFU0939F1ZV, 18AABCT1234H1Z0, 29ABCDE1234F1Z5

### CLOUD Dashboard

1. **Click "Cloud"** in sidebar
2. **Click "Add Data Source"**
3. **Select S3**
4. **Fill in:**
   - Region: `ap-south-1` (or your region)
   - Access Key: `your-aws-access-key`
   - Secret Key: `your-aws-secret-key`
   - Bucket: `your-bucket-name`
   - Prefix: `cloud-data/` (optional)
5. **Click "Test Connection"** → ✅ Success
6. **Click "Create Source"**
7. **Click "Scan"** button
8. **Watch different PII detection:**

   **Expected Findings:**
   - ✅ Credit Cards: 4532123456789012, 5432123456789013, 6532123456789014
   - ✅ CVV: 123, 456, 789
   - ✅ Passports: D1234567, E2345678, F3456789
   - ✅ GSTIN: 32ABCDE1234F1Z0, 33FGHIJ5678K1Z5, 34KLMNO9012P1Z0
   - ✅ Aadhaar: 5678 9012 3456, 6789 0123 4567, 7890 1234 5678
   - ✅ PAN: QRSTU1234V, VWXYZ5678A, BCDEF9012G
   - ✅ Bank Accounts: 1234567890123456, 2345678901234567, 3456789012345678
   - ✅ UPI IDs: pradeep.nair@oksbi, kavya.reddy@ybl, vikram.desai@upi

## 📊 Key Differences to Observe

### ON-PREMISES (MySQL)
```
Database: datasentinel_demo
Tables:
├─ employee_records (3 rows)
│  └─ Aadhaar, PAN, Bank Account, IFSC
├─ customer_database (3 rows)
│  └─ Voter ID, Passport, Driving License, GSTIN
└─ transaction_logs (3 rows)
   └─ UPI ID, IFSC, Account Number
```

### CLOUD (S3)
```
Bucket: your-bucket/cloud-data/
Files:
├─ payment_records.csv (5 rows)
│  └─ Credit Card, CVV, Expiry
├─ customer_export.json (3 records)
│  └─ Passport, Aadhaar, PAN, GSTIN, Credit Card
├─ bank_statements.txt (3 accounts)
│  └─ Account Number, IFSC, UPI, Passport
├─ employee_payroll.csv (3 rows)
│  └─ Aadhaar, PAN, Bank Account, IFSC
└─ sensitive_documents.txt (2 customers)
   └─ Passport, Voter ID, Driving License, Credit Card
```

## 🔍 Verify Results

### On-Premises Scan Results
- **Total PII Found**: ~15-20 items
- **Critical Findings**: Aadhaar, PAN, Bank Accounts
- **Risk Score**: High (70-80)
- **Sensitivity**: Personal Data

### Cloud Scan Results
- **Total PII Found**: ~25-30 items
- **Critical Findings**: Credit Cards, Passports, GSTIN
- **Risk Score**: Critical (80-90)
- **Sensitivity**: Sensitive Personal Data

## 🧪 Testing Checklist

- [ ] MySQL data inserted successfully
- [ ] S3 files uploaded successfully
- [ ] On-Premises Dashboard loads
- [ ] Cloud Dashboard loads
- [ ] MySQL source added and tested
- [ ] S3 source added and tested
- [ ] MySQL scan completes and finds PII
- [ ] S3 scan completes and finds different PII
- [ ] On-Premises Dashboard shows only MySQL data
- [ ] Cloud Dashboard shows only S3 data
- [ ] No data mixing between dashboards
- [ ] Risk scores are different for each infrastructure

## 🐛 Troubleshooting

### MySQL Connection Failed
```bash
# Check MySQL is running
docker compose ps | grep mysql

# Or if local MySQL:
mysql -u REDACTED_DB_PWD -p -e "SELECT 1"

# Check database exists
mysql -u REDACTED_DB_PWD -p -e "SHOW DATABASES LIKE 'datasentinel_demo';"
```

### S3 Connection Failed
```bash
# Verify AWS credentials
cat backend/.env | grep AWS

# Test S3 access
aws s3 ls s3://your-bucket/
```

### Sample Data Not Showing
```bash
# Verify MySQL tables
mysql -u REDACTED_DB_PWD -p datasentinel_demo -e "SHOW TABLES;"

# Verify S3 files
aws s3 ls s3://your-bucket/cloud-data/ --recursive
```

### Scans Not Running
```bash
# Check backend logs
docker compose logs -f backend | grep -i scan

# Check AI engine health
curl http://localhost:8000/health

# Check if scan job was created
docker compose exec mongodb mongosh datasentinel --eval "db.scanjobs.find().pretty()"
```

## 📈 Expected Scan Results

### MySQL Scan (On-Premises)
```
Scan Progress: 100%
Total PII Found: 18
├─ Critical: 6 (Aadhaar, PAN, Bank Accounts)
├─ High: 6 (Voter ID, Passport, GSTIN)
├─ Medium: 4 (UPI, IFSC, Phone)
└─ Low: 2 (Email, Names)

Risk Score: 75/100
Compliance Status: ⚠️ Needs Attention
```

### S3 Scan (Cloud)
```
Scan Progress: 100%
Total PII Found: 28
├─ Critical: 10 (Credit Cards, CVV, Passports)
├─ High: 8 (Aadhaar, PAN, GSTIN)
├─ Medium: 6 (Bank Accounts, IFSC, UPI)
└─ Low: 4 (Email, Phone, Names)

Risk Score: 85/100
Compliance Status: 🔴 Critical
```

## 💡 Tips

1. **Run scans during off-peak hours** - Auto-scans run every 2 hours
2. **Compare dashboards** - Side-by-side comparison shows infrastructure differences
3. **Check audit logs** - See which infrastructure was scanned and when
4. **Generate reports** - Export separate compliance reports per infrastructure
5. **Monitor risk scores** - Cloud typically has higher risk due to internet exposure

## 🎓 Learning Path

1. ✅ Setup real data (MySQL + S3)
2. ✅ Add data sources (On-Premises + Cloud)
3. ✅ Run scans and observe PII detection
4. ✅ Compare risk scores between infrastructures
5. ✅ Generate compliance reports
6. ✅ Set up alerts for critical findings
7. ✅ Configure remediation workflows

---

**Next:** Check `INFRASTRUCTURE_SEPARATION.md` for detailed documentation and advanced features.
