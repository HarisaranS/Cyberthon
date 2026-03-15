# 🔍 Automated Network Scanner - Setup Complete!

## ✅ What's Installed

### 1. **Network Discovery Service**
- Automatically scans your network (192.168.x.x) for databases
- Discovers MySQL, PostgreSQL, MongoDB, MSSQL on ports 3306, 5432, 27017, 1433
- Tries common credentials (root/root, admin/admin, postgres/postgres)
- Auto-registers discovered databases as data sources

### 2. **Local File Scanner**
- Scans employee laptops for sensitive files
- Searches for: *.env, *.pem, *.key, *credentials*, *password*, *secret*, id_rsa
- Scans: C:\Users, C:\ProgramData, D:\ (Windows) or /home, /var, /opt (Linux)

### 3. **Automated Scheduler**
- **Every 15 minutes**: Scans all registered data sources
- **Every 6 hours**: Network discovery for new databases
- **Daily at 2 AM**: Deep scans of all sources
- **Weekly Sunday 3 AM**: Cleanup old scan jobs

### 4. **Vulnerable Test Databases Created**

#### MySQL Databases (host.docker.internal:3306, user: root, password: root)
- `hr_system` - Employee data with Aadhaar, PAN, passports
- `customer_db` - Customer PII with credit cards, voter IDs
- `medical_records` - Patient data with diagnoses, insurance
- `financial_data` - Bank accounts, UPI IDs, transactions
- `voter_registry` - Voter information with addresses

#### MongoDB Database (localhost:27017, no auth)
- `vulnerable_app_db` - 5 collections with user profiles, payments, KYC docs, medical records, employee data

---

## 🚀 How to Use

### Option 1: Automatic Discovery (Recommended)

1. **Login to DataSentinel**: http://localhost:5173
2. **Trigger Network Scan**: 
   ```bash
   # Via API (get your token from browser DevTools > Application > Local Storage)
   curl -X POST http://localhost:3000/api/v1/discovery/scan \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
3. **Wait 30-60 seconds** - Scanner will discover all databases
4. **Check Data Sources page** - You'll see auto-discovered sources
5. **Scans start automatically** every 15 minutes

### Option 2: Manual Setup

1. **Go to Data Sources** → **Add Source**
2. **Add MySQL Source**:
   - Name: `HR System`
   - Type: `MySQL`
   - Host: `host.docker.internal`
   - Port: `3306`
   - Username: `root`
   - Password: `root`
   - Database: `hr_system`
3. **Repeat for other databases**: customer_db, medical_records, financial_data, voter_registry
4. **Add MongoDB Source**:
   - Name: `Vulnerable App DB`
   - Type: `MongoDB`
   - Host: `host.docker.internal`
   - Port: `27017`
   - Database: `vulnerable_app_db`
   - Leave username/password empty

### Option 3: Scan All Now

```bash
# Scan all discovered sources immediately
curl -X POST http://localhost:3000/api/v1/discovery/scan-all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 What You'll See

### Dashboard
- Total PII found across all sources
- Risk scores (Critical/High/Medium/Low)
- Real-time scan progress

### Scans Page
- Active scans with progress bars
- Completed scans with findings
- Auto-scans run every 15 minutes

### Inventory Page
- All discovered PII assets
- Aadhaar, PAN, Credit Cards, Passports, etc.
- DPDPA 2023 sensitivity classification
- Masked values with context snippets

### Risk Center
- Overall risk score
- Top 10 riskiest assets
- Risk breakdown by PII type

---

## 🔧 API Endpoints

### Network Discovery
```bash
# Trigger network discovery
POST /api/v1/discovery/scan

# Get discovered sources
GET /api/v1/discovery/sources

# Scan all discovered sources
POST /api/v1/discovery/scan-all
```

### Regular Scanning
```bash
# List all scans
GET /api/v1/scans

# Start manual scan
POST /api/v1/scans
{
  "connectorId": "SOURCE_ID",
  "scanType": "full"
}

# Get scan results
GET /api/v1/scans/:id/results
```

---

## 📅 Automated Schedule

| Task | Frequency | Description |
|------|-----------|-------------|
| **Auto Scans** | Every 15 minutes | Scans all registered sources |
| **Network Discovery** | Every 6 hours | Discovers new databases on network |
| **Deep Scans** | Daily at 2 AM | Comprehensive scans of all sources |
| **Cleanup** | Weekly Sunday 3 AM | Removes old scan jobs (30+ days) |

---

## 🛡️ Test Data Summary

### Total Records Created
- **MySQL**: 50+ records across 5 databases
- **MongoDB**: 15+ documents across 5 collections

### PII Types Included
- ✅ Aadhaar Numbers (12 digits)
- ✅ PAN Cards (10 chars)
- ✅ Mobile Numbers (10 digits)
- ✅ Email Addresses
- ✅ Credit Cards (16 digits with CVV)
- ✅ Passport Numbers
- ✅ Driving Licenses
- ✅ Voter IDs
- ✅ Bank Accounts & IFSC
- ✅ UPI IDs
- ✅ GSTIN
- ✅ Medical Records
- ✅ Dates of Birth

---

## 🔍 Verify Setup

1. **Check Backend Logs**:
   ```bash
   docker compose logs backend --tail 50
   ```
   Should see: "Automated tasks initialized"

2. **Check Databases**:
   ```bash
   # MySQL
   docker compose exec backend node -e "const mysql = require('mysql2/promise'); (async () => { const c = await mysql.createConnection({host:'host.docker.internal',user:'root',password:'root'}); const [dbs] = await c.execute('SHOW DATABASES'); console.log(dbs); await c.end(); })();"
   
   # MongoDB
   docker compose exec mongodb mongosh --eval "show dbs"
   ```

3. **Test Network Discovery**:
   - Login to DataSentinel
   - Open browser DevTools → Network tab
   - Make any API call to get your token
   - Run: `curl -X POST http://localhost:3000/api/v1/discovery/scan -H "Authorization: Bearer YOUR_TOKEN"`

---

## 🎯 Expected Results

After first scan (15 minutes):
- **5-10 data sources** discovered
- **100-200 PII instances** detected
- **Risk scores**: 80-100 (Critical) for databases with Aadhaar/PAN/Credit Cards
- **Alerts**: Critical PII found notifications

---

## 🚨 Troubleshooting

### No sources discovered?
- Check MySQL is running: `mysql -h 127.0.0.1 -u root -proot -e "SHOW DATABASES"`
- Check MongoDB: `docker compose exec mongodb mongosh --eval "show dbs"`
- Check backend logs: `docker compose logs backend`

### Scans not running?
- Check scheduler logs: `docker compose logs backend | grep Scheduler`
- Verify cron is active: Should see "Automated tasks initialized"

### No PII detected?
- Check AI engine: `curl http://localhost:8000/health`
- Verify databases have data: Run SQL queries above
- Check scan results: `GET /api/v1/scans/:id/results`

---

## 📖 Next Steps

1. **View Dashboard**: http://localhost:5173/app/dashboard
2. **Check Scans**: http://localhost:5173/app/scans
3. **Review Inventory**: http://localhost:5173/app/inventory
4. **Generate Reports**: http://localhost:5173/app/reports
5. **Check Compliance**: http://localhost:5173/app/dpdpa

---

**🎉 Your automated network scanner is now running!**

Scans will start automatically every 15 minutes. Check the Scans page to see progress.
