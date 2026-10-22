# 11. How to Run & Verify PulseCity Locally

`[MUST KNOW]`

---

## 1. Prerequisites

Ensure your machine has the following tools installed:
- **Git**: Version control (`git --version`)
- **Docker & Docker Compose**: Container engine (`docker compose version`)
- **Node.js**: Version 20.x (`node --version`)

---

## 2. Environment Configuration (`backend/.env`)

Before running the application, verify `backend/.env` exists. 

```env
PORT=5000
MONGO_URI=<REDACTED>
JWT_SECRET=<REDACTED>
```

> **Security Note**: Never commit actual database passwords or JWT secret keys to Git repositories.

---

## 3. Step-by-Step Execution Guide

### Step 1: Clone Repository & Navigate to Directory
```bash
git clone https://github.com/AshVortex404/PulseCity.git
cd PulseCity
```

### Step 2: Validate Docker Compose Configuration
```bash
docker compose config
```

### Step 3: Build & Launch Containers
```bash
docker compose up --build -d
```
*This command compiles the React frontend, builds the Express backend, creates container networks, and starts services in detached background mode.*

### Step 4: Verify Container Status
```bash
docker compose ps
```
**Expected Output**:
```
NAME                IMAGE                                      STATUS          PORTS
pulsecity-backend    ghcr.io/vltxjoyboy/pulsecity-backend    Up              0.0.0.0:5000->5000/tcp
pulsecity-frontend   ghcr.io/vltxjoyboy/pulsecity-frontend   Up              0.0.0.0:3000->80/tcp
```

---

## 4. Verified Endpoint Browser URLs

Once containers are running (`Up`), open your browser or use `curl`:

| Resource / Page | URL | Expected Response |
|:---|:---|:---|
| **React Frontend SPA** | `http://localhost:3000` | PulseCity Citizen Web Interface |
| **Backend REST API** | `http://localhost:5000/api/issues` | JSON list of civic issue reports |
| **Health Endpoint** | `http://localhost:5000/health` | `{"status":"healthy","service":"pulsecity-backend","database":"connected"}` |
| **Prometheus Metrics** | `http://localhost:5000/metrics` | Prometheus metrics text stream (`http_requests_total`, etc.) |

---

## 5. Checking Container Logs

To view application logs in real-time:

```bash
# View backend logs
docker compose logs --tail=100 backend

# View frontend Nginx logs
docker compose logs --tail=100 frontend
```

---

## 6. How to Stop the Application

To shut down running containers cleanly:

```bash
docker compose down
```

---

## 7. Running Quality Checks Locally

### A. Run Backend Unit Tests (18 Tests)
```bash
cd backend
npm test
```

### B. Run Frontend Linter & Production Build
```bash
cd frontend
npm run lint
npm run build
```
