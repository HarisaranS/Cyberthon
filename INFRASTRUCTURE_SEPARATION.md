# Infrastructure Separation Implementation Guide

## Overview
DataSentinel now has completely separate dashboards for On-Premises and Cloud infrastructure with real, distinct data sources and scans.

## Changes Made

### 1. Backend Changes

#### Database Model Updates
- **DataSource.js**: Added `infrastructure` field (on-premises/cloud) and `sampleData` field
  - Auto-sets infrastructure based on source type
  - Cloud types: S3, Azure Blob, Google Drive, OneDrive, SharePoint, Gmail, Exchange, Slack, Teams
  - On-Premises types: MySQL, PostgreSQL, MongoDB, MSSQL, Local

#### Scheduler Updates
- **schedulerService.js**: Changed auto-scan timing from **15 minutes to 2 hours**
  - Cron: `0 */2 * * *` (every 2 hours)
  - Reduces system load and API costs

#### Scan Service Updates
- **scanService.js**: Added real sample data scanning
  - New `scanSampleData()` function uses DataSource.sampleData field
  - Scans real data instead of mock data
  - Different data for MySQL vs S3 = different PII detected

#### API Controller Updates
- **dataSourceController.js**: Added infrastructure filtering
  - `GET /api/v1/sources?infrastructure=on-premises` - Get only on-premises sources
  - `GET /api/v1/sources?infrastructure=cloud` - Get only cloud sources
  - Supports sampleData field in create/update

- **scanController.js**: Added infrastructure filtering
  - `GET /api/v1/scans?infrastructure=on-premises` - Get on-premises scans
  - `GET /api/v1/scans?infrastructure=cloud` - Get cloud scans
  - Filters scans by source infrastructure type

### 2. Frontend Changes

#### New Pages
- **OnPremisesDashboard.jsx**: Dedicated dashboard for on-premises infrastructure
  - Blue theme (Server icon)
  - Shows only on-premises sources and scans
  - Tabs: Overview, Data Sources, Scans
  - Quick actions: Add Source, View Scans

- **CloudDashboard.jsx**: Dedicated dashboard for cloud infrastructure
  - Purple theme (Cloud icon)
  - Shows only cloud sources and scans
  - Same layout as on-premises for consistency
  - Different color scheme for visual distinction

#### Navigation Updates
- **AppLayout.jsx**: Updated sidebar navigation
  - Removed filter buttons
  - Added direct links to separate dashboards
  - On-Premises: `/app/on-premises`
  - Cloud: `/app/cloud`

#### Routing Updates
- **App.jsx**: Added new routes
  - `/app/on-premises` → OnPremisesDashboard
  - `/app/cloud` → CloudDashboard

### 3. Sample Data Setup

#### Script: setup-sample-data.js
Creates real, distinct data in MySQL and S3:

**MySQL (On-Premises) Data:**
- Employees table: Names, emails, phones, Aadhaar, PAN, DOB
- Customers table: Credit cards, voter IDs, passports, GSTIN
- Transactions table: UPI IDs, IFSC codes, driving licenses

**S3 (Cloud) Data:**
- customer_export.csv: Different customer records with PII
- payment_records.json: Payment data with credit cards and passport numbers
- employee_data.txt: Employee records with different PII patterns
- bank_statements.csv: Bank account data with driving licenses and PAN

**Run Setup:**
```bash
cd backend
node setup-sample-data.js
```

## How It Works

### Workflow
1. **User clicks "On-Premises"** in sidebar → Navigates to `/app/on-premises`
2. **OnPremisesDashboard loads** → Fetches only on-premises sources and scans
3. **User adds MySQL source** → Automatically marked as on-premises
4. **User runs scan** → Scans MySQL data, finds specific PII patterns
5. **Results show** → Only on-premises PII (Aadhaar, PAN, etc.)

### Same for Cloud
1. **User clicks "Cloud"** in sidebar → Navigates to `/app/cloud`
2. **CloudDashboard loads** → Fetches only cloud sources and scans
3. **User adds S3 source** → Automatically marked as cloud
4. **User runs scan** → Scans S3 files, finds different PII patterns
5. **Results show** → Only cloud PII (credit cards, passports, etc.)

## Real Data vs Mock Data

### Before
- All scans used mock/demo data
- Same results regardless of source type
- No real PII detection

### After
- MySQL scans use real employee/customer data from MySQL
- S3 scans use real payment/employee data from S3
- Different PII detected based on actual data
- Realistic compliance reporting

## Auto-Scan Timing

### Before
- Every 15 minutes: `*/15 * * * *`
- 96 scans per day per source
- High API costs

### After
- Every 2 hours: `0 */2 * * *`
- 12 scans per day per source
- 8x reduction in system load and costs

## API Endpoints

### Data Sources
```
GET  /api/v1/sources                          - All sources
GET  /api/v1/sources?infrastructure=on-premises - On-premises only
GET  /api/v1/sources?infrastructure=cloud     - Cloud only
POST /api/v1/sources                          - Create source (auto-sets infrastructure)
```

### Scans
```
GET  /api/v1/scans                            - All scans
GET  /api/v1/scans?infrastructure=on-premises - On-premises scans
GET  /api/v1/scans?infrastructure=cloud       - Cloud scans
POST /api/v1/scans                            - Start scan
```

## Testing

### Step 1: Setup Sample Data
```bash
cd backend
node setup-sample-data.js
```

### Step 2: Add Data Sources
1. Go to On-Premises Dashboard
2. Click "Add Data Source"
3. Select MySQL
4. Enter: localhost:3306, user: root, password: password, database: datasentinel_demo
5. Test connection → Success

6. Go to Cloud Dashboard
7. Click "Add Data Source"
8. Select S3
9. Enter AWS credentials and bucket name
10. Test connection → Success

### Step 3: Run Scans
1. On-Premises Dashboard → Click "Scan" on MySQL source
2. Watch progress → Different PII detected (Aadhaar, PAN, etc.)
3. Cloud Dashboard → Click "Scan" on S3 source
4. Watch progress → Different PII detected (Credit cards, passports, etc.)

### Step 4: Verify Results
- On-Premises Dashboard shows only on-premises scans and PII
- Cloud Dashboard shows only cloud scans and PII
- No data mixing between infrastructure types

## Database Migrations

If using existing database, run:
```javascript
// Add infrastructure field to existing sources
db.datasources.updateMany({}, [
  { $set: { infrastructure: {
    $cond: [
      { $in: ['$type', ['s3', 'azure_blob', 'google_drive', 'onedrive', 'sharepoint', 'gmail', 'exchange', 'slack', 'teams']] },
      'cloud',
      'on-premises'
    ]
  }}}
])
```

## Performance Impact

- **Reduced API calls**: 8x fewer auto-scans
- **Lower database load**: Fewer scan jobs created
- **Better cost efficiency**: Fewer AI engine invocations
- **Cleaner UI**: Separate dashboards prevent confusion

## Future Enhancements

1. **Cross-infrastructure reports**: Compare on-premises vs cloud risk
2. **Infrastructure-specific policies**: Different compliance rules per infrastructure
3. **Hybrid scanning**: Scan across both infrastructure types simultaneously
4. **Infrastructure migration tracking**: Monitor data movement between on-premises and cloud
