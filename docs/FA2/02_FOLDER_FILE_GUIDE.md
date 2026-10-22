# 02. PulseCity Directory & File Structure Guide

`[MUST KNOW]`

---

## 1. Repository Directory Overview

```
PulseCity/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD Pipeline
├── backend/                       # Express REST API Server
│   ├── middleware/                # Auth & Prometheus Metrics Middleware
│   ├── models/                    # MongoDB Mongoose Schemas (Issue, User)
│   ├── routes/                    # API Endpoints (authRoutes, issueRoutes)
│   ├── tests/                     # Jest & Supertest Unit Test Suite (18 tests)
│   ├── Dockerfile                 # Backend Container Multi-stage Build
│   ├── package.json               # Backend Node.js Dependencies & Test Scripts
│   └── server.js                  # Express Entrypoint & DB Connection
├── frontend/                      # React Single Page Application (Vite)
│   ├── src/                       # React Components & Context Providers
│   ├── Dockerfile                 # Multi-stage Nginx Frontend Build
│   ├── nginx.conf                 # Nginx Reverse Proxy Config for API calls
│   └── package.json               # Frontend Dependencies & Scripts
├── k8s/                           # Declarative Kubernetes Manifests
│   ├── backend-deployment.yaml    # Application backend deployment
│   ├── backend-service.yaml       # Application backend service (ClusterIP 5000)
│   ├── frontend-deployment.yaml   # Application frontend deployment
│   ├── frontend-service.yaml      # Application frontend service (NodePort 30000)
│   ├── monitoring/                # Prometheus & Grafana Configuration
│   │   ├── namespace.yaml         # Isolated 'monitoring' namespace
│   │   ├── prometheus-config.yaml # Scrape config & alert rules ConfigMap
│   │   ├── prometheus-deployment.yaml
│   │   ├── prometheus-service.yaml# Internal ClusterIP (port 9090)
│   │   ├── prometheus-rbac.yaml   # RBAC ClusterRole & Binding
│   │   ├── grafana-deployment.yaml
│   │   ├── grafana-service.yaml   # Internal ClusterIP (port 3000)
│   │   ├── grafana-datasource.yaml# Provisioned Prometheus Datasource
│   │   ├── grafana-dashboard-provider.yaml # Dashboard provider config
│   │   ├── grafana-dashboard.yaml # Observability Dashboard ConfigMap
│   │   ├── grafana-secret.yaml.example # Template for Grafana admin secret
│   │   └── kustomization.yaml     # Self-contained Kustomize config
│   └── sre/                       # Prometheus Alert Rules & SRE Dashboard
│       ├── prometheus-alerts.yaml # Alert rules ConfigMap
│       ├── grafana-sre-dashboard.yaml # SRE Dashboard ConfigMap
│       └── kustomization.yaml     # Self-contained SRE Kustomize config
├── docs/                          # Comprehensive FA2 & SRE Documentation
├── docker-compose.yml             # Local Multi-Container Development Config
└── README.md                      # Primary Repository Readme
```

---

## 2. Comprehensive File Guide Table

| Path / File | Purpose | Simple Explanation | Evaluation Priority |
|:---|:---|:---|:---:|
| `docker-compose.yml` | Local Orchestration | Defines `backend` (port 5000) and `frontend` (port 3000) containers for single-command local execution. | `[MUST KNOW]` |
| `.github/workflows/ci.yml` | CI/CD Workflow | Automates unit tests, linting, production builds, Trivy security scanning, and GHCR Docker pushes. | `[MUST KNOW]` |
| `backend/server.js` | Backend Entrypoint | Starts Express server on port 5000, connects to MongoDB Atlas, and mounts routes and metrics middleware. | `[MUST KNOW]` |
| `backend/middleware/metrics.js` | Metrics Collection | Uses `prom-client` to measure HTTP request counts, durations, active requests, and exposes `/metrics`. | `[MUST KNOW]` |
| `backend/routes/issueRoutes.js` | Issue API Routes | Handles GET, POST, PUT, DELETE operations for civic complaint management. | `[MUST KNOW]` |
| `backend/routes/authRoutes.js` | Authentication API | Handles citizen/admin user registration and JWT login verification. | `[MUST KNOW]` |
| `backend/tests/` | Unit Test Suite | Contains 3 Jest test files (`auth.test.js`, `issues.test.js`, `healthAndMetrics.test.js`) verifying 18 test cases. | `[MUST KNOW]` |
| `backend/Dockerfile` | Backend Container | Multi-stage build using `node:20-alpine`, installs production dependencies, and runs `server.js`. | `[MUST KNOW]` |
| `frontend/Dockerfile` | Frontend Container | Multi-stage build: Stage 1 builds React Vite dist; Stage 2 serves dist via lightweight Nginx Alpine. | `[MUST KNOW]` |
| `frontend/nginx.conf` | Frontend Proxy Config | Configures Nginx to serve SPA index.html and proxy `/api/` calls directly to `http://backend:5000`. | `[MUST KNOW]` |
| `frontend/src/App.jsx` | React Root Component | Sets up React Router paths and navigation layout. | `[GOOD TO KNOW]` |
| `k8s/namespace.yaml` | K8s Namespace | Creates isolated `pulsecity` namespace for application pods. | `[GOOD TO KNOW]` |
| `k8s/backend-deployment.yaml` | K8s Backend Deploy | Deploys backend pods with resource limits, liveness (`/health`) & readiness probes. | `[GOOD TO KNOW]` |
| `k8s/backend-service.yaml` | K8s Backend Service | Exposes backend internally on port 5000 via ClusterIP. | `[GOOD TO KNOW]` |
| `k8s/frontend-deployment.yaml` | K8s Frontend Deploy | Deploys Nginx frontend pods running the compiled React bundle. | `[GOOD TO KNOW]` |
| `k8s/frontend-service.yaml` | K8s Frontend Service | Exposes frontend to external traffic via NodePort. | `[GOOD TO KNOW]` |
| `k8s/monitoring/` | Monitoring Stack | Contains standalone Prometheus and Grafana deployment manifests. | `[MUST KNOW]` |
| `k8s/sre/` | Alerting & SRE | Defines Prometheus alert rules and Grafana SRE reliability dashboard. | `[MUST KNOW]` |
| `docs/FA2/00_ZERO_TO_GRAFANA.md` | Zero-to-Grafana Guide | Primary step-by-step Examiner Demonstration Guide. | `[CRITICAL]` |

---

## 3. Important Code Files Breakdown for Evaluation

### 🟢 1. `backend/server.js` `[MUST KNOW]`
- **Why it exists**: Serves as the central server initialization script.
- **Key Functions**:
  - Connects to MongoDB Atlas using Mongoose (`mongoose.connect`).
  - Registers CORS and JSON body-parsing middleware.
  - Mounts routes: `/api/auth`, `/api/issues`.
  - Exposes health endpoint: `GET /health` returning `{"status":"healthy","database":"connected"}`.
  - Mounts metrics middleware (`metricsMiddleware`) exposing `GET /metrics`.

### ⚡ 2. `backend/middleware/metrics.js` `[MUST KNOW]`
- **Why it exists**: Provides application observability metrics without external agents.
- **Key Prometheus Metrics Created**:
  - `http_requests_total`: Counter tracking total HTTP requests by method, route, and status code.
  - `http_request_duration_seconds`: Histogram tracking API response latency in seconds.
  - `http_active_requests`: Gauge tracking current active requests in real-time.

### 🧪 3. `backend/tests/` `[MUST KNOW]`
- **Why it exists**: Ensures code quality and prevents regression bugs.
- **Test Suites**:
  - `auth.test.js`: Verifies user registration, login, token generation, and invalid credentials handling.
  - `issues.test.js`: Verifies creating, reading, updating, and deleting civic issue reports.
  - `healthAndMetrics.test.js`: Verifies `GET /health` returns 200 OK and `GET /metrics` outputs Prometheus format text.
