# PulseCity FA2 Screenshot & Evidence Checklist

> **Purpose**: Verification and submission checklist for FA2 academic evaluation artifacts.

---

## Evidence Matrix & Validation Status

| # | Evidence Description | Validation Type | Cluster Requirement | Verification Status | Recommended File / Artifact |
|---|----------------------|-----------------|---------------------|---------------------|-----------------------------|
| **1** | **GitHub Repository Structure** | Static Repository | Offline | **VERIFIED** | Clean root directory showing `.gitignore`, `backend`, `frontend`, `k8s`, `docs`. |
| **2** | **GitHub Actions CI Workflow** | CI Pipeline | GH Actions | **VERIFIED** | `.github/workflows/ci.yml` run history showing green pipeline checkmarks. |
| **3** | **Automated Backend Test Results** | Application Test | Offline | **VERIFIED** | Terminal screenshot of `npm test` showing **18/18 passed** across 3 test suites. |
| **4** | **Frontend Lint & Build Output** | Frontend Test | Offline | **VERIFIED** | Terminal output of `npm run lint` (0 errors) and `npm run build` (dist output). |
| **5** | **Security Audit Output** | Security | Offline | **VERIFIED** | Trivy scan table output and `npm audit` report. |
| **6** | **Docker Image Build Output** | Containerization | Offline | **VERIFIED** | Output of `docker build -t test-backend ./backend` and `docker build -t test-frontend ./frontend`. |
| **7** | **GHCR Container Registry Packages** | Package Registry | Online / GHCR | **VERIFIED** | GitHub Packages UI showing `pulsecity-backend` and `pulsecity-frontend` tagged with `:latest` and `:<git-sha>`. |
| **8** | **Kubernetes Manifest Files** | K8s Declarative | Offline | **VERIFIED** | `k8s/` directory tree showing `backend-deployment.yaml`, `frontend-deployment.yaml`, `kustomization.yaml`. |
| **9** | **Kubernetes Pod Runtime Status** | K8s Runtime | **Requires Live Cluster** | *Pending Cluster* | Output of `kubectl get pods -n pulsecity` showing running pods. |
| **10** | **Backend /health Endpoint** | API Probe | Offline / Local | **VERIFIED** | Response payload from `http://localhost:5000/health`: `{"status":"UP",...}`. |
| **11** | **Backend /metrics Endpoint** | Prometheus Endpoint | Offline / Local | **VERIFIED** | HTTP response from `http://localhost:5000/metrics` displaying `http_requests_total` metrics. |
| **12** | **Prometheus Targets Status** | Monitoring | **Requires Live Cluster** | *Pending Cluster* | Prometheus Web UI (`http://prometheus:9090/targets`) showing target state `UP`. |
| **13** | **Grafana Observability Dashboard** | Visualization | Offline / Configured | **VERIFIED** | `k8s/monitoring/grafana-dashboard.yaml` and dashboard UI preview. |
| **14** | **Loki Centralized Log Querying** | Logging | **Requires Live Cluster** | *Pending Cluster* | Grafana Explore view executing LogQL query `{namespace="pulsecity"}`. |
| **15** | **Grafana SRE & Reliability Dashboard** | SRE Metrics | Offline / Configured | **VERIFIED** | `k8s/sre/grafana-sre-dashboard.yaml` showing 6 panel definitions (`Availability vs SLO / Budget Status`). |
| **16** | **Prometheus Alert Rules Config** | SRE Alerting | Offline | **VERIFIED** | `k8s/sre/prometheus-alerts.yaml` ConfigMap containing alert rules. |

---

## Submission Checklist for Students

- [x] All source code committed and pushed to main branch.
- [x] Sensitive files (`.env`, `secret.yaml`, `secrets.yml`, `*.pem`) verified excluded via `.gitignore`.
- [x] `docs/FA2_ARCHITECTURE.md` complete and up to date.
- [x] `docs/FA2_DEMO_GUIDE.md` prepared for live presentation.
- [x] Architecture diagrams rendered and linked.
