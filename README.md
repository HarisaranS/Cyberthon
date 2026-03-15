# 🛡 DataSentinel
## India's First Native DPDPA 2023 Personal Data Intelligence Platform

> **Know Your Data. Own Your Compliance.**

DataSentinel helps Indian enterprises discover, classify, and protect personal data across all data sources — ensuring full compliance with the Digital Personal Data Protection Act 2023. Avoid penalties up to ₹250 Crore.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────┐
│                   NGINX :80                  │
│              (Reverse Proxy)                 │
└──────┬──────────────┬──────────────┬────────┘
       │              │              │
  ┌────▼────┐   ┌─────▼─────┐  ┌───▼────┐
  │Frontend │   │  Backend  │  │   AI   │
  │ React   │   │ Node.js   │  │ Engine │
  │ :5173   │   │  :3000    │  │ :8000  │
  └─────────┘   └─────┬─────┘  └────────┘
                      │
              ┌───────┴───────┐
         ┌────▼────┐    ┌────▼────┐
         │ MongoDB │    │  Redis  │
         │  :27017 │    │  :6379  │
         └─────────┘    └─────────┘
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js 20, Express.js, Mongoose, Bull, Socket.io |
| AI Engine | Python FastAPI, spaCy, Presidio, pytesseract |
| Database | MongoDB 7, Redis 7 |
| Infrastructure | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start (Recommended: Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker + Docker Compose)
- 4GB+ RAM available for Docker
- Ports 80, 3000, 5173, 8000, 27017, 6379 free

### Step 1: Clone / Extract

```bash
# If you downloaded the zip, extract it:
unzip datasentinel.zip
cd datasentinel
```

### Step 2: Launch Everything

```bash
# Build and start all services
docker compose up --build

# Or run in background:
docker compose up --build -d
```

> ⏳ First build takes **5-10 minutes** (downloading images, installing dependencies, loading AI models). Subsequent starts take ~30 seconds.

### Step 3: Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 Web App | http://localhost | Main application (via Nginx) |
| 🖥 Frontend | http://localhost:5173 | Direct frontend access |
| 🔌 Backend API | http://localhost:3000 | REST API |
| 🤖 AI Engine | http://localhost:8000 | PII Detection API |
| 📖 API Docs | http://localhost:8000/docs | FastAPI Swagger UI |

### Step 4: Register Your Account

1. Open **http://localhost:5173**
2. Click **"Get Started"** on the landing page
3. Fill in your name, organisation, email and password
4. You're in! Start exploring the dashboard.

---

## 🔧 Manual Local Setup (No Docker)

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7 running locally
- Redis 7 running locally

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your local MongoDB/Redis URLs

npm install
npm run dev
# Backend starts on http://localhost:3000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3000/api/v1

npm install
npm run dev
# Frontend starts on http://localhost:5173
```

### AI Engine Setup
```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# AI Engine starts on http://localhost:8000
```

---

## 📖 How to Use DataSentinel

### 1. Register & Login
- Create an account at `/register`
- Your organization is auto-created
- You start as `admin` role

### 2. Add a Data Source
- Go to **Data Sources** in the sidebar
- Click **"Add Source"**
- Select type (MySQL, MongoDB, S3, Google Drive, etc.)
- Enter a name — credentials are encrypted with AES-256

### 3. Run a Scan
- Go to **Scans** → select source → click **"Start Scan"**
- Watch real-time progress (powered by Socket.io)
- Scan uses sample data files to demonstrate detection
- Results show detected PII with risk scores

### 4. View Inventory
- **Inventory** shows all discovered PII assets
- Filter by sensitivity: Sensitive Personal / Personal / Internal / Public
- Each asset shows: PII types found, risk score, remediation status

### 5. Check Compliance
- **DPDPA 2023** page shows your compliance score
- Checklist maps findings to specific DPDPA sections
- Progress bars show compliance by pillar

### 6. Risk Center
- Overall risk score gauge
- Risk breakdown by PII type
- Top 10 riskiest assets
- Risk factor analysis

### 7. Generate Reports
- **Reports** → select type → click **"Generate"**
- PDF generated automatically (takes ~10 seconds)
- Download directly from the reports list

### 8. Breach Management
- **Breaches** → **"Log Breach"**
- 72-hour countdown timer starts immediately
- Tracks DPB notification obligation

### 9. DPO Copilot AI
- Chat with our AI compliance assistant
- Ask about DPDPA sections, rights, penalties
- Get draft notices and policy text

### 10. Audit Log
- Every action is logged immutably
- SHA-256 hash chain — tamper-proof
- Click **"Verify Chain Integrity"** to validate

---

## 🔑 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/datasentinel
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=exactly-32-character-key-here!!
AI_ENGINE_URL=http://ai-engine:8000
FRONTEND_URL=http://localhost:5173

# Email (optional - for verification emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_AI_URL=http://localhost:8000
VITE_APP_NAME=DataSentinel
```

---

## 🛡 Security Features

| Feature | Implementation |
|---------|---------------|
| PII Storage | SHA-256 hashes only — no plain values stored |
| Credentials | AES-256-CBC encrypted before MongoDB |
| Passwords | bcrypt rounds 12 |
| Auth | JWT access tokens (15m) + refresh tokens (7d) |
| Audit Trail | Immutable hash chain (SHA-256 linked) |
| Rate Limiting | 200 req/15min general, 10 req/15min auth |
| Input Sanitization | mongo-sanitize, HPP, Helmet headers |
| RBAC | Role-based access: super_admin > admin > dpo > analyst > viewer |

---

## 🌐 API Reference

### Auth
```
POST /api/v1/auth/register     — Create account
POST /api/v1/auth/login        — Login
POST /api/v1/auth/refresh      — Refresh access token
GET  /api/v1/auth/me           — Get current user (auth required)
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password/:token
```

### Data Sources
```
GET    /api/v1/sources         — List sources
POST   /api/v1/sources         — Add source
GET    /api/v1/sources/:id     — Get source
PATCH  /api/v1/sources/:id     — Update source
DELETE /api/v1/sources/:id     — Remove source
POST   /api/v1/sources/test    — Test connection
```

### Scans
```
GET  /api/v1/scans             — List scans
POST /api/v1/scans             — Start scan
GET  /api/v1/scans/active      — Active scans
GET  /api/v1/scans/:id         — Scan details
GET  /api/v1/scans/:id/results — Scan findings
POST /api/v1/scans/:id/cancel  — Cancel scan
```

### Dashboard
```
GET /api/v1/dashboard/stats      — KPI stats
GET /api/v1/dashboard/compliance — Compliance score
GET /api/v1/dashboard/risk       — Risk dashboard
GET /api/v1/dashboard/inventory  — Asset inventory
GET /api/v1/dashboard/breaches   — Breach events
GET /api/v1/dashboard/audit      — Audit log
GET /api/v1/dashboard/audit/verify — Verify hash chain
```

### AI Engine (Port 8000)
```
POST /detect           — Detect PII in text
POST /classify         — Classify risk level
POST /ocr              — OCR + detect from image
GET  /health           — Service health
GET  /docs             — Swagger UI
```

### Public (No Auth)
```
POST /api/v1/public/detect   — Demo PII detection (rate limited)
```

---

## 🤖 Detected PII Types

| Type | Pattern | Example |
|------|---------|---------|
| AADHAAR | `[2-9]\d{3}\s?\d{4}\s?\d{4}` | 2345 6789 0123 |
| PAN | `[A-Z]{5}[0-9]{4}[A-Z]` | ABCDE1234F |
| MOBILE | `[6-9]\d{9}` | 9876543210 |
| EMAIL | Standard email regex | user@domain.com |
| VOTER_ID | `[A-Z]{3}[0-9]{7}` | ABC1234567 |
| PASSPORT | Indian passport format | A1234567 |
| GSTIN | 15-char GST format | 27AAPFU0939F1ZV |
| UPI | Handle@bank patterns | user@oksbi |
| IFSC | Bank IFSC format | HDFC0001234 |
| CREDIT_CARD | Luhn-validated 16-digit | (masked) |
| DRIVING_LICENSE | State format | MH02 2020 1234567 |
| DOB | DD/MM/YYYY variants | 15/06/1990 |
| NAME | spaCy PERSON entities | (NLP detected) |

---

## 🐳 Docker Commands

```bash
# Start all services
docker compose up --build

# Start in background
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f ai-engine
docker compose logs -f frontend

# Stop all services
docker compose down

# Stop and remove all data (CAUTION: deletes MongoDB data)
docker compose down -v

# Rebuild specific service
docker compose up --build backend

# Shell into backend container
docker compose exec backend sh

# Shell into MongoDB
docker compose exec mongodb mongosh datasentinel
```

---

## 📁 Project Structure

```
datasentinel/
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── server.js
│   ├── app.js
│   ├── package.json
│   ├── .env
│   ├── Dockerfile
│   └── src/
│       ├── config/         (db, redis, logger, passport)
│       ├── models/         (10 MongoDB schemas)
│       ├── controllers/    (auth, scans, sources, dashboard, alerts, reports)
│       ├── routes/         (all API routes)
│       ├── middleware/      (auth, rbac, rateLimiter, auditLogger, errorHandler)
│       ├── services/       (ai, scan, report, email, socket, encryption, scheduler)
│       └── utils/          (jwt, response)
├── ai-engine/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── app/
│       ├── routers/        (detect, classify, ocr)
│       ├── services/       (pii_detector, indian_pii_regex, sensitivity_scorer)
│       └── models/         (schemas.py)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── lib/            (axios)
        ├── store/          (auth, ui, alert)
        ├── components/     (layout/AppLayout)
        └── pages/
            ├── public/     (Landing)
            ├── auth/       (Login, Register)
            └── app/        (Dashboard, DataSources, Scans, ScanDetail,
                             Inventory, Risk, Reports, DPDPACompliance,
                             Alerts, AuditLog, Breaches, Copilot, Settings)
```

---

## 🐛 Troubleshooting

### AI Engine takes too long to start?
The AI engine downloads spaCy models on first build. This is normal. Check:
```bash
docker compose logs -f ai-engine
```

### MongoDB connection refused?
Wait for the health check:
```bash
docker compose ps  # Check if mongodb is "healthy"
```

### Frontend can't reach backend?
Check that the backend is running:
```bash
curl http://localhost:3000/health
```

### Port already in use?
Stop conflicting services or change ports in `docker-compose.yml`.

---

## 📜 DPDPA 2023 Penalty Reference

| Violation | Maximum Penalty |
|-----------|----------------|
| Breach of security safeguards | ₹250 Crore |
| Failure to notify breach in 72h | ₹200 Crore |
| Non-compliance with children's data | ₹200 Crore |
| Violation of data principal rights | ₹150 Crore |
| Failure to register as SDF | ₹50 Crore |
| Non-compliance with DPB directions | ₹50 Crore |

---

## 📄 License

Proprietary. © 2024 DataSentinel. All rights reserved.

---

**Built with ❤️ for Indian Enterprise Data Protection**
