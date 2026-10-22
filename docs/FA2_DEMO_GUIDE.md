# PulseCity FA2 Live Demonstration Guide

> **Project Target**: FA2 Final Evaluation & Demonstration  
> **Estimated Duration**: 10 – 15 Minutes  
> **System Context**: PulseCity (PulseCity) DevOps & SRE Pipeline Demonstration

---

## Executive Summary

This guide outlines a structured, 18-step presentation sequence for demonstrating the end-to-end DevOps, Monitoring, Centralized Logging, and Site Reliability Engineering (SRE) implementation for PulseCity.

---

## Recommended 18-Step Live Demo Sequence

```
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 1. Git Repo    │ ──► │ 2. GitHub CI   │ ──► │ 3. Unit Tests  │
 └────────────────┘     └────────────────┘     └────────────────┘
         │
         ▼
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 4. Build/Lint  │ ──► │ 5. Security    │ ──► │ 6. Docker/GHCR │
 └────────────────┘     └────────────────┘     └────────────────┘
         │
         ▼
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 7. Kubernetes  │ ──► │ 8. /health     │ ──► │ 9. /metrics    │
 └────────────────┘     └────────────────┘     └────────────────┘
         │
         ▼
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 10. Prometheus │ ──► │ 11. Grafana    │ ──► │ 12. Loki/Logs  │
 └────────────────┘     └────────────────┘     └────────────────┘
         │
         ▼
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 13. Log Dash   │ ──► │ 14. SLI/SLO    │ ──► │ 15. Alerts     │
 └────────────────┘     └────────────────┘     └────────────────┘
         │
         ▼
 ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
 │ 16. Runbook    │ ──► │ 17. Post-Mortem│ ──► │ 18. CD Pipeline│
 └────────────────┘     └────────────────┘     └────────────────┘
```

---

### Step-by-Step Presentation Script

| Step # | Presentation Focus | Key Actions / Commands / URLs | Expected Output / Key Talking Points |
|--------|--------------------|-------------------------------|--------------------------------------|
| **1** | **Repository Structure & Security** | View root directory and `.gitignore`. | Show strict ignore rules for secrets (`.env`, `secret.yaml`, `secrets.yml`, `*.pem`). |
| **2** | **GitHub Actions CI Workflow** | View `.github/workflows/ci.yml`. | Explain multi-stage pipeline: `backend-test`, `frontend-lint-and-build`, `security-scan`, `docker-build-push`, `deploy-kubernetes`. |
| **3** | **Automated Backend Testing** | Run `npm test` in `/backend`. | Show **18/18 passing tests** covering authentication, health, metrics, and issue management. |
| **4** | **Frontend Linting & Production Build** | Run `npm run lint` & `npm run build` in `/frontend`. | Show **0 errors** ESLint pass and Vite production bundle generation in `dist/`. |
| **5** | **Security & Vulnerability Audit** | Review CI workflow step for Trivy filesystem scan. | Demonstrate vulnerability scanning before container build. |
| **6** | **Containerization & GHCR Registry** | Show `Dockerfile` in `/backend` & `/frontend` and GHCR image tags. | Highlight multi-stage Docker builds and tagging strategy (`:latest` and `:<git-sha>`). |
| **7** | **Kubernetes Architecture Manifests** | Review `k8s/` directory and `kustomization.yaml`. | Point out declarative resources, readiness/liveness probes, resource limits, and namespace isolation. |
| **8** | **Application Health Probe** | Query `GET http://localhost:5000/health` (or k8s pod IP). | Returns `{"status":"UP","timestamp":"...","uptime":...}`. |
| **9** | **Prometheus Metrics Endpoint** | Query `GET http://localhost:5000/metrics`. | Displays standard Node.js process metrics and custom HTTP counters/histograms (`http_requests_total`). |
| **10** | **Prometheus Monitoring Setup** | Review `k8s/monitoring/prometheus-config.yaml`. | Show scrape target configuration (`pulsecity-backend.pulsecity.svc.cluster.local:5000/metrics`). |
| **11** | **Grafana Observability Dashboard** | Open Grafana (`pulsecity-observability` dashboard). | Show visualization panels for Request Rates, Error Status Codes, Latency, and Active Requests. |
| **12** | **Loki & Promtail Centralized Logging** | Review `k8s/logging/loki-config.yaml` & Promtail DaemonSet. | Explain stdout/stderr log harvesting by Promtail and ingestion into Loki log store. |
| **13** | **Grafana Centralized Logging Dashboard** | View Grafana Loki Explore & `pulsecity-logs` dashboard. | Demonstrate LogQL query `{namespace="pulsecity"} |= "error"` for instant log filtering. |
| **14** | **SRE Framework (SLI / SLO / SLA)** | Open `docs/sre/sli-slo-sla.md`. | Explain 4 core SLIs (Availability, Success Rate, 5xx Error Rate, p95 Latency), SLO Targets (99% availability, <500ms latency), and academic SLA disclaimer. |
| **15** | **Prometheus Alert Rules** | Review `k8s/sre/prometheus-alerts.yaml`. | Show alert rules: `BackendDown`, `HighErrorRate`, `HighLatency`, and `HighActiveRequests` with runbook annotations. |
| **16** | **Operational Troubleshooting Runbook** | Open `docs/sre/runbook.md`. | Review step-by-step remediation commands for 5 real failure scenarios. |
| **17** | **Incident Post-Mortem Report** | Open `docs/sre/postmortem-example.md`. | Walk through 13-section simulated incident analysis, root cause, and corrective action items. |
| **18** | **Continuous Deployment Pipeline** | Review CD job in `.github/workflows/ci.yml`. | Explain automated Kustomize image tag substitution with Git SHA (`kustomize edit set image ...`) and `kubectl rollout status` verification. |

---

## Demo Tips for Evaluators

1. **Academic Environment Note**: If live Kubernetes cluster is not active during presentation, reference static manifest validation and unit/build test execution.
2. **Security**: Emphasize that all secrets are injected dynamically via environment variables / Kubernetes Secrets and never checked into Git.
