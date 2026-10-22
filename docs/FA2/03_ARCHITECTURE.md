# 03. PulseCity System Architecture

`[MUST KNOW]`

---

## 1. High-Level Architecture Diagram (ASCII)

### A. Automatic CI/CD Pipeline Architecture (Verified Active)

```
                     ┌──────────────────────────────┐
                     │ Developer Pushes Code (Git)  │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────┐
                     │  GitHub Repository (Main)    │
                     └──────────────┬───────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   GitHub Actions Pipeline (ci.yml)                     │
│                                                                        │
│  ┌─────────────────┐    ┌─────────────────────────┐    ┌────────────┐  │
│  │ 1. Backend Test │    │ 2. Frontend Lint/Build  │    │ 3. Security│  │
│  │   (18/18 PASS)  │    │   (0 Errors / Vite)     │    │    Scan    │  │
│  └────────┬────────┘    └────────────┬────────────┘    └─────┬──────┘  │
│           │                          │                       │         │
│           └──────────────────────────┴───────────────────────┘         │
│                                      │ (All 3 Pass)                    │
│                                      ▼                                 │
│                         ┌──────────────────────────┐                   │
│                         │ 4. Docker Build & Push   │                   │
│                         └────────────┬─────────────┘                   │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │
                                       ▼
                     ┌──────────────────────────────┐
                     │ GitHub Container Registry    │
                     │ (ghcr.io/vltxjoyboy/...)  │
                     └──────────────────────────────┘
```

---

### B. Application & Local Execution Architecture (Verified Active)

```
 Citizen Browser
  (localhost:3000)
       │
       ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Docker Container: pulsecity-frontend (Nginx Alpine)      │
 │  - Serves React SPA Dist static assets                  │
 │  - Proxies /api/* requests to backend:5000              │
 └────────────────────────────┬────────────────────────────┘
                              │
                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │ Docker Container: pulsecity-backend (Node.js Express)    │
 │  - Serves REST API routes (/api/issues, /api/auth)      │
 │  - Exposes /health & /metrics endpoints                 │
 └──────────────┬────────────────────────────┬─────────────┘
                │                            │
                ▼                            ▼
┌───────────────────────────────┐  ┌───────────────────────────┐
│ MongoDB Atlas Cloud Database  │  │ Prometheus Metrics Scraper│
│  - Stores issues & users      │  │  - Reads /metrics         │
└───────────────────────────────┘  └───────────────────────────┘
```

---

### C. Prepared Kubernetes & Observability Architecture (Optional / Manual)

```
                            Kubernetes Cluster (pulsecity namespace)
 ┌───────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                           │
 │  ┌──────────────────────────────┐                ┌──────────────────────────────┐         │
 │  │ Frontend Service (NodePort)  │                │ Backend Service (ClusterIP)  │         │
 │  └──────────────┬───────────────┘                └──────────────┬───────────────┘         │
 │                 │                                               │                         │
 │                 ▼                                               ▼                         │
 │  ┌──────────────────────────────┐                ┌──────────────────────────────┐         │
 │  │  Frontend Deployment (Pods)  │───proxy /api──►│   Backend Deployment (Pods)  │         │
 │  └──────────────────────────────┘                └──────────────┬───────────────┘         │
 │                                                                 │                         │
 └─────────────────────────────────────────────────────────────────┼─────────────────────────┘
                                                                   │
                                           ┌───────────────────────┴───────────────────────┐
                                           │                                               │
                                           ▼                                               ▼
                         ┌──────────────────────────────────┐            ┌──────────────────────────────────┐
                         │ Prometheus (Scrapes /metrics)    │            │ Promtail (Scrapes pod stdout)    │
                         └─────────────────┬────────────────┘            └─────────────────┬────────────────┘
                                           │                                               │
                                           ▼                                               ▼
                         ┌──────────────────────────────────┐            ┌──────────────────────────────────┐
                         │ Grafana Observability Dashboards │            │ Loki Centralized Log Storage     │
                         └──────────────────────────────────┘            └──────────────────────────────────┘
```

---

## 2. Step-by-Step Data Flow Explanation

1. **Developer Push**: Code changes are committed and pushed to `https://github.com/AshVortex404/PulseCity`.
2. **CI Trigger**: GitHub Actions automatically starts the workflow defined in `.github/workflows/ci.yml`.
3. **Quality & Security Assurance**:
   - `backend-test` executes 18 Jest tests against an in-memory test database.
   - `frontend-lint-and-build` runs ESLint and Vite compiler.
   - `security-scan` runs `npm audit` and Trivy filesystem vulnerability scanner.
4. **Container Image Generation**: Upon success of all quality gates, `docker-build-push` builds multi-stage Docker images and authenticates to GHCR using `GITHUB_TOKEN`.
5. **Registry Delivery**: Compiled images are published to GHCR with both `:latest` and `:<git-commit-sha>` tags.
6. **Local Runtime Execution**: `docker-compose.yml` pulls or builds local containers, linking the Nginx React frontend to the Express backend via container networking.
7. **External Database Connectivity**: Backend connects securely to MongoDB Atlas over HTTPS/TLS using the `MONGO_URI` environment variable.

---

## 3. Core DevOps Concepts Explained Simply

### 🐳 1. Containerization
- **What is it?**: Packaging an application together with its runtime, libraries, and configuration into a single portable container.
- **Why it matters**: Ensures the application runs identically on developer machines, CI servers, and cloud clusters.

### ☸️ 2. Container Orchestration
- **What is it?**: Automated management of container lifecycles, load balancing, health monitoring, and scaling across multiple server nodes.
- **Why it matters**: Kubernetes handles automatic container restarts if a node fails, ensuring zero downtime.

### 🔄 3. Continuous Integration (CI)
- **What is it?**: The practice of automatically building and testing code changes whenever a developer pushes to the repository.
- **Why it matters**: Catches bugs, syntax errors, and broken tests immediately before code is merged.

### 🚀 4. Continuous Delivery (CD)
- **What is it?**: Automatically packaging and publishing deployable artifacts (such as Docker images to GHCR) so code is always ready to deploy.
- **Why it matters**: Makes software releases fast, repeatable, and low-risk.

### 📊 5. Observability & Monitoring
- **What is it?**: Collecting metrics, logs, and health status from running services to monitor system health and diagnose issues.
- **Why it matters**: Allows teams to detect performance bottlenecks or downtime before users complain.
