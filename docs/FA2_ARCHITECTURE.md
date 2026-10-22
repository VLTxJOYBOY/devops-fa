# PulseCity (PulseCity) Comprehensive DevOps & SRE Architecture

> **FA2 Final Architecture Specification Document**  
> **System Name**: PulseCity (PulseCity)  
> **Platform Version**: 1.0.0

---

## 1. Project Overview & Problem Statement

### Overview
PulseCity (PulseCity) is a modern web platform designed for municipal civic issue reporting, tracking, and resolution management. Citizens can submit issues (e.g., potholes, street light outages, waste accumulation) with geolocation and image evidence, while ward administrators manage lifecycle status updates in real time.

### Problem Statement
Traditional civic management systems suffer from high downtime, lack of real-time status visibility, manual deployment risks, unmonitored server crashes, and absence of standardized operational reliability practices. PulseCity addresses these challenges by implementing an automated CI/CD pipeline, containerized microservices, Kubernetes orchestration, centralized logging, Prometheus monitoring, and Site Reliability Engineering (SRE) governance.

---

## 2. End-to-End System Architecture

```
Developer
   │
   ▼
GitHub Repository (main)
   │
   ▼
GitHub Actions CI Pipeline
   ├───────────────────┼───────────────────┐
   ▼                   ▼                   ▼
Backend Unit Tests   Frontend Lint &     Trivy & npm Audit
(Jest: 18/18 Pass)   Build (Vite)        Security Scan
   │                   │                   │
   └───────────────────┴───────────────────┘
                       │
                       ▼
            Multi-stage Docker Builds
                       │
                       ▼
       GitHub Container Registry (GHCR)
     (Tagged: :latest & :<git-sha>)
                       │
                       ▼
GitHub Actions CD Pipeline (Kustomize SHA Substitution)
                       │
                       ▼
           Kubernetes Cluster Deployment
           (Namespace: pulsecity)
         ┌───────────────┴───────────────┐
         ▼                               ▼
  Frontend Pods (Nginx)          Backend Pods (Express/Node.js)
  - Port 80                      - Port 5000
  - Reverse proxy /api/ &        - /health & /metrics endpoints
    /socket.io/ to backend       - Connects to MongoDB Atlas
         │                               │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
Prometheus Scraping              Promtail DaemonSet Log Harvesting
(Interval: 15s)                  (Collects pod stdout/stderr)
        │                                 │
        ▼                                 ▼
Loki Log Aggregator ─────────────► Grafana Dashboards
                                  - Observability Dashboard
                                  - SRE & Reliability Dashboard
                                  - Centralized Logs Dashboard
```

---

## 3. Tool Matrix & Technologies Used

| Tool / Technology | Category / Purpose | Implementation Details |
|-------------------|--------------------|------------------------|
| **Git / GitHub** | Source Code Management | Main branch protection, feature branching, gitignore security filters. |
| **GitHub Actions** | CI/CD Automation | Declarative `.github/workflows/ci.yml` automation pipeline. |
| **Jest & Supertest** | Automated Testing | Backend unit and API testing framework (**18/18 passing tests**). |
| **ESLint & Vite** | Frontend Quality & Build | Code linting and production static asset compilation. |
| **Trivy & npm audit** | Security Auditing | Filesystem and container dependency vulnerability scanning. |
| **Docker** | Containerization | Multi-stage Dockerfiles producing minimal Node.js and Nginx images. |
| **GHCR** | Container Registry | GitHub Container Registry storing immutable images tagged with Git SHAs. |
| **Kubernetes & Kustomize** | Orchestration & Deployment | Declarative K8s manifests, namespace isolation, health probes, Kustomize configuration. |
| **Terraform** | Infrastructure as Code | Provisions cloud infrastructure (EC2, VPC, security groups). |
| **Ansible** | Configuration Management | Server provisioning and initial Docker environment setup. |
| **Prometheus** | Metrics Monitoring | Standalone TSDB scraping `/metrics` on 15s interval; evaluates alert rules. |
| **Loki & Promtail** | Centralized Logging | Log aggregation daemonset (Promtail) pushing stdout/stderr logs to Loki TSDB. |
| **Grafana** | Visualization & Dashboards | Unified UI hosting Observability, Logging, and SRE dashboards. |
| **MongoDB Atlas** | Database | Cloud-hosted MongoDB database for application persistent storage. |

---

## 4. Pipeline Details

### Continuous Integration (CI) Pipeline
Defined in `.github/workflows/ci.yml`:
1. **`backend-test`**: Installs dependencies and executes `npm test` using Jest and in-memory MongoDB.
2. **`frontend-lint-and-build`**: Runs `eslint` and compiles Vite production bundle.
3. **`security-scan`**: Performs `npm audit` and Trivy security scans.
4. **`docker-build-push`**: Executes multi-stage Docker builds and pushes images to GHCR tagged with `:latest` and `:<git-sha>` (pull requests build but do not push).

### Continuous Deployment (CD) Pipeline
Defined in `.github/workflows/ci.yml`:
1. Triggers only on push to `main` branch after successful CI completion.
2. Uses `azure/k8s-set-context` with GitHub secret `KUBE_CONFIG`.
3. Runs `kustomize edit set image` to replace image tags with immutable `<git-sha>`.
4. Executes `kubectl apply -k k8s/` and verifies deployment rollout via `kubectl rollout status`.

---

## 5. Observability, Centralized Logging, & SRE Framework

### Metrics & Monitoring (Phase 7)
- **Prometheus**: Configured via `k8s/monitoring/prometheus-config.yaml` to scrape target `pulsecity-backend.pulsecity.svc.cluster.local:5000/metrics`.
- **Exposed Metrics**: Standard Node.js process metrics plus custom metrics: `http_requests_total`, `http_request_duration_seconds` (histogram), and `http_active_requests` (gauge).

### Centralized Logging (Phase 8)
- **Promtail**: Deployed as a DaemonSet harvesting container logs from `/var/log/pods`.
- **Loki**: Deployed in `logging` namespace; indexes log streams by `{namespace="pulsecity"}`.

### Site Reliability Engineering (Phase 9)
- **SLIs & SLO Targets**:
  - **Availability SLI**: `avg_over_time(up{job="pulsecity-backend"}[30m])` $\rightarrow$ **SLO Target: >= 99.0%**
  - **HTTP Success Rate SLI**: 2xx ratio $\rightarrow$ **SLO Target: >= 99.0%**
  - **HTTP 5xx Error Rate SLI**: 5xx ratio $\rightarrow$ **SLO Target: < 1.0%**
  - **p95 Request Latency SLI**: `histogram_quantile(0.95, ...)` $\rightarrow$ **SLO Target: < 500 ms**
- **SLA Commitment**: Academic demo example (99% monthly target; 15-minute critical triage).
- **Error Budget**: $100\% - 99\% = 1.0\%$ ($432 \text{ allowable downtime minutes/month}$).
- **Alerting Rules**: `BackendDown` (critical), `HighErrorRate` (warning), `HighLatency` (warning), `HighActiveRequests` (warning).
- **SRE Artifacts**: Runbook (`docs/sre/runbook.md`), Incident Management (`docs/sre/incident-management.md`), Post-Mortem Example (`docs/sre/postmortem-example.md`), and Governance Policy (`docs/sre/slo-policy.md`).

---

## 6. Security & Compliance Architecture

1. **Zero Secret Hardcoding**: Secrets (`JWT_SECRET`, `MONGO_URI`, `KUBE_CONFIG`) are managed externally via environment variables and Kubernetes Secret objects (`.gitignore` verified).
2. **Container Security**: Non-root container execution guidelines and automated Trivy vulnerability scanning.
3. **Least Privilege RBAC**: ServiceAccounts and ClusterRoles configured for Prometheus and Promtail with minimal read permissions.

---

## 7. System Limitations

1. **Live Cluster Runtime Status**: Live Kubernetes cluster deployment and runtime alert firing remain pending live cluster provisioning.
2. **Prometheus Alertmanager**: External email/Slack notification routing requires Alertmanager integration.
3. **SRE Threshold Calibration**: Active request and latency alert thresholds are illustrative demo baselines requiring real-world load test calibration in production.

---

## 8. Future Improvements

1. **Autoscaling**: Implement Horizontal Pod Autoscaler (HPA) based on CPU/Memory and active HTTP request metrics.
2. **Service Mesh**: Introduce Linkerd or Istio for mutual TLS (mTLS) and distributed tracing.
3. **Inbound Rate Limiting**: Implement Redis-backed API gateway rate limiting.
