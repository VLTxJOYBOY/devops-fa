# PulseCity Minimal Monitoring & Observability Guide

## 1. Overview & Architecture

This document details the minimal monitoring architecture implemented for PulseCity on a resource-constrained K3s cluster (1.9 GiB RAM total, ~856 MiB available).

The setup runs entirely inside a dedicated `monitoring` namespace using lightweight standalone Kubernetes Deployments and internal ClusterIP services:

- **Prometheus** (`prom/prometheus:v2.49.1`): Collects and stores time-series metrics. Resource footprint: 50m CPU / 64Mi RAM request, 250m CPU / 256Mi RAM limit.
- **Grafana** (`grafana/grafana:10.2.3`): Visualizes metrics via provisioned dashboards. Resource footprint: 50m CPU / 64Mi RAM request, 250m CPU / 256Mi RAM limit.
- **Internal ClusterIP Services**: Prometheus exposed on `prometheus.monitoring.svc.cluster.local:9090`, Grafana on `grafana.monitoring.svc.cluster.local:3000`. No NodePorts, Ingress, or public ports are exposed.

---

## 2. Verified Backend Metrics Endpoint (`/metrics`)

The PulseCity Express backend exports metrics using `prom-client` at `GET /metrics` (port 5000). The endpoint returns HTTP 200 with standard Prometheus text formatting.

### Verified Metrics Matrix

| Metric Name | Type | Labels | Description |
| :--- | :---: | :--- | :--- |
| `up` | Gauge | `job`, `instance` | Scrape target health (1 = healthy/reachable, 0 = down). |
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests received by the Express application. |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code`, `le` | Duration of HTTP requests in seconds across configured buckets. |
| `http_active_requests` | Gauge | *None* | Number of HTTP requests currently being processed. |
| `nodejs_heap_size_used_bytes` | Gauge | *None* | Memory RAM consumed by the Node.js process heap. |
| `process_cpu_seconds_total` | Counter | *None* | Total user and system CPU time consumed in seconds. |

---

## 3. Prometheus Scrape Configuration

Prometheus is configured via `k8s/monitoring/prometheus-config.yaml` to scrape the backend service every 15 seconds:

```yaml
scrape_configs:
  - job_name: 'pulsecity-backend'
    metrics_path: '/metrics'
    scrape_interval: 15s
    static_configs:
      - targets: ['pulsecity-backend.pulsecity.svc.cluster.local:5000']
        labels:
          app: pulsecity-backend
```

---

## 4. Grafana Provisioning & Dashboard

Grafana automatically provisions the Prometheus datasource and loads the `PulseCity Backend Observability Dashboard` from `/var/lib/grafana/dashboards/pulsecity-dashboard.json`.

### Dashboard Panels & PromQL Queries

1. **Backend Target Health (`stat`)**:
   - Query: `up{job="pulsecity-backend"}`
   - Purpose: Displays real-time reachability of the backend (1 = UP, 0 = DOWN).
2. **Active In-Flight Requests (`stat`)**:
   - Query: `http_active_requests`
   - Purpose: Monitors concurrent request processing.
3. **Node.js Heap Memory (`stat`)**:
   - Query: `nodejs_heap_size_used_bytes`
   - Purpose: Tracks memory consumption of the backend Node.js runtime.
4. **HTTP Request Rate (`timeseries`)**:
   - Query: `sum(rate(http_requests_total[5m]))`
   - Purpose: Displays total incoming requests per second (RPS).
5. **HTTP Status Code Breakdown (`timeseries`)**:
   - Query: `sum(rate(http_requests_total[5m])) by (status_code)`
   - Purpose: Isolates 2xx success rates vs 4xx/5xx error rates.
6. **p95 HTTP Request Latency (`timeseries`)**:
   - Query: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
   - Purpose: Tracks the 95th percentile response latency in seconds.

---

## 5. Application Logging via `kubectl logs`

Log aggregation tools (Loki and Promtail) are omitted to conserve memory. Container stdout and stderr logs are inspected using native `kubectl` CLI commands:

```bash
# 1. Stream real-time logs from the backend container
kubectl logs -f -n pulsecity -l app=pulsecity-backend

# 2. View the last 100 log lines with timestamps
kubectl logs -n pulsecity -l app=pulsecity-backend --tail=100 --timestamps

# 3. Search for error stack traces or MongoDB connection issues
kubectl logs -n pulsecity -l app=pulsecity-backend --tail=500 | grep -iE "error|exception|mongo"

# 4. Inspect previous container logs if a pod crashed (OOMKilled/CrashLoopBackOff)
kubectl logs -n pulsecity -l app=pulsecity-backend --previous
```

---

## 6. Canonical Deployment Commands

To deploy the monitoring stack using canonical Kustomize manifests:

```bash
# 1. Create the monitoring namespace
kubectl apply -f k8s/monitoring/namespace.yaml

# 2. Apply SRE ConfigMap resources (Alert rules & SRE Dashboard)
kubectl apply -k k8s/sre

# 3. Apply Monitoring infrastructure manifests
kubectl apply -k k8s/monitoring

# 4. Verify all monitoring pods are Running
kubectl get pods -n monitoring
```

To access Grafana securely via SSH tunnel:
```bash
# On EC2:
kubectl port-forward -n monitoring svc/grafana 3001:3000

# On Laptop:
ssh -i /path/to/key.pem -N -L 3002:127.0.0.1:3001 ubuntu@<EC2_IP>
# Open http://127.0.0.1:3002
```
