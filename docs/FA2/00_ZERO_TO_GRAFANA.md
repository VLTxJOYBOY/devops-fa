# Complete Zero-to-Grafana Setup & Deployment Guide

> **Purpose**: A comprehensive, step-by-step guide for B.Tech CSE students to deploy, monitor, and present the **PulseCity** platform from scratch to a college examiner.

---

## A. What We Are Building

PulseCity is a full-stack civic complaint reporting platform built with a **React (Vite) frontend**, a **Node.js (Express) backend**, and a **MongoDB Atlas database**. 

To ensure high availability and continuous deployment, the app is containerized with **Docker**, pushed to **GitHub Container Registry (GHCR)** via **GitHub Actions**, deployed on **Kubernetes (K3s)**, and monitored using **Prometheus** and **Grafana**.

### End-to-End System Architecture

```
+------------------+      git push      +--------------------+
| Developer Laptop |  ----------------> | GitHub Repository  |
+------------------+                    +--------------------+
                                                  |
                                                  v
+------------------+    pull image      +--------------------+
| Kubernetes (K3s) | <----------------- | GitHub Actions CI  |
|  (AWS EC2 Node)  |                    |  Build & GHCR Push |
+------------------+                    +--------------------+
   |            |
   |            v
   |     +-------------------------+
   |     | Express Backend API     |
   |     | Exposes GET /metrics    |
   |     +-------------------------+
   |            | (scrapes every 15s)
   v            v
+------------------------------------+
| Prometheus (Metrics Storage & Rules)|
+------------------------------------+
                |
                v (query via PromQL)
+------------------------------------+
| Grafana (Observability & SRE)      |
+------------------------------------+
                | (SSH Tunnel)
                v
+------------------------------------+
| Examiner Laptop Browser UI         |
+------------------------------------+
```

### Why Monitoring & SRE Are Required
1. **Proactive Failure Detection**: Alerts detect if the backend pod crashes (`up == 0`) before users complain.
2. **Performance Visibility**: Tracks API latency at the 95th percentile (p95) to ensure responses complete within 500 ms.
3. **Reliability Guarantees**: Measures HTTP success rate against an internal Service Level Objective (SLO) target of 99.0%.

---

## B. Prerequisites

Before starting, ensure you have:
1. **Laptop**: Installed with Git, SSH client, and access to the GitHub repository (`AshVortex404/PulseCity`).
2. **AWS EC2 Instance**: Running Ubuntu 22.04 LTS with at least 2 GB RAM.
3. **K3s Cluster**: Lightweight Kubernetes cluster installed and active on EC2.
4. **Command Line Tools**: `kubectl` and `kustomize` installed on the EC2 server.
5. **Security Configuration**: Port 22 (SSH) open to your IP address. **Do NOT open Kubernetes port 6443 or Grafana port 3000 publicly to the internet.**

---

## C. Understand the Repository Layout

The clean, canonical repository layout is structured as follows:

```
PulseCity/
├── .github/workflows/ci.yml       # Automated GitHub Actions test, build & GHCR push pipeline
├── backend/                       # Express Node.js API server & prom-client metrics
│   ├── middleware/metrics.js      # Prometheus HTTP metrics collector
│   ├── server.js                  # Entrypoint exposing /health and /metrics
│   └── tests/                     # Jest unit tests verifying metrics & endpoints
├── frontend/                      # React Vite Single Page Application & Nginx proxy
├── k8s/                           # Declarative Kubernetes Manifests
│   ├── backend-deployment.yaml    # Application backend deployment
│   ├── frontend-deployment.yaml   # Application frontend deployment
│   ├── monitoring/                # Canonical Monitoring Manifests
│   │   ├── namespace.yaml         # Dedicated 'monitoring' namespace
│   │   ├── prometheus-config.yaml # Scrape rules & Prometheus alert definitions
│   │   ├── prometheus-deployment.yaml
│   │   ├── prometheus-service.yaml# Internal ClusterIP service (port 9090)
│   │   ├── grafana-deployment.yaml
│   │   ├── grafana-service.yaml   # Internal ClusterIP service (port 3000)
│   │   ├── grafana-datasource.yaml# Auto-provisioned Prometheus datasource
│   │   ├── grafana-dashboard-provider.yaml
│   │   └── grafana-dashboard.yaml # Observability Dashboard ConfigMap
│   └── sre/                       # Dedicated SRE Manifests
│       ├── prometheus-alerts.yaml # SRE Alert Rules ConfigMap
│       └── grafana-sre-dashboard.yaml # SRE & Reliability Dashboard ConfigMap
└── docs/FA2/                      # Comprehensive Documentation Hub
```

---

## D. Start & Verify the Working Application

### Step 1: Connect to AWS EC2 via SSH
On your laptop terminal, connect to your server:
```bash
ssh -i /path/to/pulsecity-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### Step 2: Navigate to Project Directory & Verify Git Branch
```bash
cd ~/PulseCity
git status
git log -n 1 --oneline
```

### Step 3: Verify Application Pods in Kubernetes
```bash
kubectl get nodes
kubectl get pods -n pulsecity
```
*Expected Output*: Both `pulsecity-backend-*` and `pulsecity-frontend-*` pods should show `STATUS: Running`.

### Step 4: Test Backend Health Endpoint
```bash
curl -s http://localhost:5000/health
```
*Expected Response*:
```json
{
  "status": "healthy",
  "service": "pulsecity-backend",
  "timestamp": "2026-10-09T22:30:00.000Z",
  "database": "connected"
}
```

---

## E. Explain the CI/CD Pipeline

Whenever code is pushed to the `main` branch, **GitHub Actions** automatically runs `.github/workflows/ci.yml`:

1. **Automated Testing**: Runs 18 Jest unit tests in `backend/tests/` (including `/health` and `/metrics` tests).
2. **Lint & Build**: Runs ESLint on frontend code and compiles production static assets.
3. **Security Vulnerability Scanning**: Runs `Trivy` static analysis to audit Docker container security.
4. **Docker Image Packaging & GHCR Push**: Compiles multi-stage Docker images and pushes tagged packages to GitHub Container Registry:
   - `ghcr.io/vltxjoyboy/pulsecity-backend:latest`
   - `ghcr.io/vltxjoyboy/pulsecity-frontend:latest`
5. **Kubernetes Deployment**: Updates the pod deployment image in the `pulsecity` namespace.

---

## F. Deploy Prometheus & SRE Monitoring

Prometheus is a time-series database that scrapes quantitative performance metrics exposed by the Express app at `GET /metrics` every 15 seconds.

### Step 1: Validate Kustomize Manifests
Before applying, test building the Kustomize manifests separately on EC2:
```bash
kustomize build k8s/monitoring
kustomize build k8s/sre
```
*Note: Both commands must output valid compiled YAML without cross-directory import errors.*

### Step 2: Create Monitoring Namespace
```bash
kubectl apply -f k8s/monitoring/namespace.yaml
```

### Step 3: Apply SRE ConfigMaps (Alert Rules & SRE Dashboard)
```bash
kubectl apply -k k8s/sre
```

### Step 4: Apply Core Monitoring Infrastructure
```bash
kubectl apply -k k8s/monitoring
```

### Step 5: Verify Monitoring Pods
```bash
kubectl get pods -n monitoring
```
*Expected Output*: Both `prometheus-*` and `grafana-*` pods should show `STATUS: Running`.

---

## G. Configure Grafana Passwords & Secrets Securely

Grafana requires admin credentials. Security best practices require using a **Kubernetes Secret** so passwords are never stored in tracked Git code.

### Step 1: Create the Secret Interactively (Prior to Grafana Deployment)
Run this command directly on EC2 without saving credentials to any file:
```bash
kubectl create secret generic grafana-secrets \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=YourStrongSecurePasswordHere \
  -n monitoring
```

### Step 2: Verify Secret Creation
```bash
kubectl get secret grafana-secrets -n monitoring
```

---

## H. Access Grafana Securely from Laptop Browser

Because Grafana runs as an internal **ClusterIP service** (`port 3000`), it is not publicly exposed. We access it using a secure two-stage SSH tunnel.

```
[ K8s Service: 3000 ] --(kubectl port-forward)--> [ EC2 Local: 3001 ] --(SSH Tunnel)--> [ Laptop Browser: 3002 ]
```

### Step-by-Step Connection Instructions:

#### 1. On AWS EC2 Server: Start K8s Port-Forward
Run this command in your EC2 terminal and **leave it running**:
```bash
kubectl port-forward -n monitoring svc/grafana 3001:3000
```
*(Port 3001 on EC2 is now mapped to port 3000 inside Kubernetes).*

#### 2. On Your Laptop Terminal: Start SSH Tunnel
Open a **new terminal window on your laptop** and run:
```bash
ssh -i /path/to/pulsecity-key.pem -N -L 3002:127.0.0.1:3001 ubuntu@<YOUR_EC2_PUBLIC_IP>
```
*(Port 3002 on your laptop is now securely tunneled to port 3001 on EC2).*

#### 3. Open Grafana in Your Laptop Browser
Navigate to:
```
http://127.0.0.1:3002
```
Log in using:
- **Username**: `admin`
- **Password**: The secret password you set in Step G.

---

## I. Verify Prometheus Targets & Metric Queries

To inspect the raw Prometheus web interface:

### Step 1: Start Prometheus Port-Forward on EC2
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

### Step 2: Query Verified Metrics in Prometheus UI
Run an SSH tunnel from your laptop (`9090:127.0.0.1:9090`) and open `http://127.0.0.1:9090/targets`. Verify `pulsecity-backend` status is **UP (1/1)**.

### PromQL Verification Queries:
1. **Target Health**: `up{job="pulsecity-backend"}`
2. **Request Rate (RPS)**: `sum(rate(http_requests_total[5m]))`
3. **p95 Response Latency**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
4. **Node.js Heap Memory**: `nodejs_heap_size_used_bytes`

---

## J. Explain the Grafana Dashboards to Examiner

Navigate to **Dashboards** in Grafana to view two pre-configured dashboards:

### Dashboard 1: PulseCity Observability Dashboard
- **Backend Availability**: Shows real-time binary state (`1` = UP, `0` = DOWN).
- **Active In-Flight Requests**: Displays active processing requests using `http_active_requests`.
- **Node.js Heap Memory**: Displays RAM consumed by backend JavaScript process.
- **HTTP Request Rate**: Displays total requests per second grouped over a 5-minute rate.
- **HTTP Status Code Breakdown**: Isolates `200` success responses vs `4xx`/`5xx` error responses.
- **p95 Response Latency**: Visualizes 95th percentile response time.

### Dashboard 2: PulseCity SRE & Reliability Dashboard
- **30m Availability SLI**: Visualizes target uptime against the **99.0% SLO**.
- **HTTP Success Rate SLI**: Displays ratio of non-5xx responses (`>= 99.0%`).
- **SLO Margin (%)**: Displays operational margin relative to allowable error budget.

> **Examiner Note on "No Data"**: If the **HTTP 5xx Error Rate** panel displays *"No data"*, explain that this is correct: zero server errors have occurred, so no 5xx metric series has been generated by `prom-client`.

---

## K. SRE Alert Rules & Incident Runbook

Alert rules are defined in `k8s/sre/prometheus-alerts.yaml` and loaded into Prometheus:

1. **`BackendDown`** (`up == 0` for 2 min): Critical alert when backend pod is unreachable.
2. **`HighErrorRate`** (`5xx rate > 1%` for 5 min): Warning alert when HTTP server errors exceed 1%.
3. **`HighLatency`** (`p95 latency > 500ms` for 5 min): Warning alert when p95 response time exceeds 0.5s.

### Incident Investigation Workflow (`kubectl logs`):
If an alert fires, investigate using container logs:
```bash
# View backend logs for uncaught exceptions
kubectl logs -n pulsecity -l app=pulsecity-backend --tail=100 | grep -i "error"

# Restart pod if deadlocked
kubectl rollout restart deployment/pulsecity-backend -n pulsecity
```

---

## L. Practical Troubleshooting Guide

| Issue | Root Cause | Safe Resolution |
| :--- | :--- | :--- |
| **Git pull fails** | Local modifications on EC2 | Stash changes: `git stash && git pull`. Do NOT use `git reset --hard` blindly. |
| **Kustomize build error** | Invalid path or missing file | Check `k8s/monitoring/kustomization.yaml`. Ensure no relative paths point outside directory (`../sre`). |
| **Pod CrashLoopBackOff** | Application crash or missing secret | Inspect pod logs: `kubectl logs -n pulsecity <pod-name> --previous`. Check secrets: `kubectl get secrets -n pulsecity`. |
| **ImagePullBackOff** | GHCR image or authentication failure | Verify image exists on GHCR and `ghcr-secret` is present in namespace. |
| **Grafana Secret Missing** | Secret not created prior to deploy | Run `kubectl create secret generic grafana-secrets ...` then restart deployment: `kubectl rollout restart deploy/grafana -n monitoring`. |
| **Dashboard Panel "No Data"** | Metric series not yet created | Make HTTP requests to backend API (`curl http://localhost:5000/api/issues`) to populate metric counters. |
| **SSH Tunnel Port Conflict** | Port 3002 already bound on laptop | Change laptop port in SSH tunnel command (e.g., `3003:127.0.0.1:3001`) and open `http://127.0.0.1:3003`. |

---

## M. Clean Shutdown & Restart Procedure

To close the session cleanly without disrupting cluster workloads:

1. **Stop Laptop SSH Tunnel**: Press `Ctrl + C` in the laptop terminal window running the SSH tunnel command.
2. **Stop EC2 Port-Forward**: Press `Ctrl + C` in the EC2 terminal running `kubectl port-forward`.
3. **Cluster State**: Application and monitoring pods remain running safely inside Kubernetes in the background.

---

## N. Final Demonstration Checklist for Examiners

When demonstrating the project to your college examiner, follow this 10-step sequence:

- [ ] 1. **Application Runtime**: Show running application UI in browser.
- [ ] 2. **Kubernetes Pod Status**: Run `kubectl get pods -A` showing `pulsecity` and `monitoring` pods in `Running` state.
- [ ] 3. **Backend Health Endpoint**: Run `curl http://localhost:5000/health` showing `{"status":"healthy","database":"connected"}`.
- [ ] 4. **Backend Metrics Endpoint**: Run `curl http://localhost:5000/metrics` showing raw `http_requests_total` output.
- [ ] 5. **GitHub Actions CI/CD**: Open GitHub Actions tab showing green pipeline checkmarks for 18 automated Jest tests and GHCR push.
- [ ] 6. **Prometheus Scrape Health**: Show Prometheus Targets page displaying `pulsecity-backend` as **UP (1/1)**.
- [ ] 7. **Prometheus Alert Rules**: Show Prometheus Alerts tab displaying loaded rules (`BackendDown`, `HighErrorRate`, `HighLatency`).
- [ ] 8. **Grafana Observability Dashboard**: Display dashboard panels (RPS, p95 latency, Heap memory, active requests).
- [ ] 9. **Grafana SRE Dashboard**: Display 30m Availability SLI vs 99.0% SLO target.
- [ ] 10. **Incident Runbook**: Explain how `kubectl logs` is used to troubleshoot alerts.

---

## O. Frequently Asked Viva Questions & Answers

### Q1: Why did you choose Kubernetes (K3s) for deployment?
> **Answer**: K3s provides declarative container orchestration, automated self-healing (restarting crashed pods), seamless rolling updates, and resource management while using minimal RAM (~512 MiB) on our EC2 instance.

### Q2: What is the difference between `/health` and `/metrics`?
> **Answer**: `/health` is a lightweight status check used by Kubernetes liveness probes to verify database connection and process health. `/metrics` exports detailed quantitative time-series data formatted for Prometheus scraping.

### Q3: What is p95 latency and why is it preferred over average latency?
> **Answer**: Average latency hides extreme outliers. The 95th percentile (p95) latency guarantees that 95% of all user requests complete faster than the threshold (e.g. 500 ms), giving a true measure of user experience.

### Q4: Why did you use SSH tunneling instead of exposing Grafana on a public NodePort?
> **Answer**: Exposing monitoring dashboards publicly increases attack surface and security risks. Using a ClusterIP service combined with SSH tunneling ensures strict access control without opening public firewall ports.

### Q5: What is an SLO and how is it measured in Grafana?
> **Answer**: A Service Level Objective (SLO) is an internal target for reliability (e.g., 99.0% availability). In Grafana, it is calculated by measuring non-5xx responses over total requests over a rolling window.
