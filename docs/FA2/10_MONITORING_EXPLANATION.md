# 10. PulseCity Monitoring & Observability Guide

`[MUST KNOW]`

> **Implementation Status**:
> - **VERIFIED WORKING ON EC2**: Express `/metrics` and `/health` endpoints in Node.js backend.
> - **VERIFIED WORKING ON EC2**: Prometheus server scraping `/metrics` every 15s in the `monitoring` namespace.
> - **VERIFIED WORKING ON EC2**: Grafana server displaying Observability & SRE Dashboards via SSH port-forwarding.
> - **NOT INSTALLED**: Loki & Promtail are **not installed** (container logs are inspected directly using `kubectl logs`).
>
> 📖 *For the complete step-by-step examiner setup and demo guide, see [00_ZERO_TO_GRAFANA.md](./00_ZERO_TO_GRAFANA.md).*

---

## 1. What is Observability & Monitoring?

- **Monitoring**: Collecting quantitative metrics (CPU, memory, request counts) to tell you *when* a system is failing.
- **Logging**: Inspecting application text log outputs (`stdout`/`stderr`) using `kubectl logs` to understand *why* a system failed.
- **Observability**: Combining metrics, health probes (`/health`), and log streams to gain visibility into application behavior.

---

## 2. Metrics Instrumentation (`backend/middleware/metrics.js`)

Our Express backend uses the official Node.js `prom-client` library to record and expose metrics at `GET /metrics`:

### Metrics Table

| Metric Name | Metric Type | Purpose / Description |
|:---|:---:|:---|
| `http_requests_total` | **Counter** | Cumulative count of HTTP requests labeled by method (`GET`, `POST`), route (`/api/issues`), and status code (`200`, `500`). |
| `http_request_duration_seconds` | **Histogram** | Measures response latency distribution across configurable time buckets. |
| `http_active_requests` | **Gauge** | Real-time measurement of currently processing HTTP requests. |
| `process_cpu_seconds_total` | **Counter** | Process CPU time consumption. |
| `nodejs_heap_size_used_bytes` | **Gauge** | Memory RAM consumption of the Node.js process heap. |

---

## 3. Monitoring Infrastructure Components

### 📊 1. Prometheus
- **What is it?**: A metrics collector and time-series database.
- **How it works**: HTTP scrapes `/metrics` from `pulsecity-backend.pulsecity.svc.cluster.local:5000` every 15 seconds.
- **Configuration**: Defined in `k8s/monitoring/prometheus-config.yaml` and deployed via `k8s/monitoring/prometheus-deployment.yaml`.

### 📈 2. Grafana
- **What is it?**: A visualization platform that creates graphs and alert dashboards.
- **Dashboards Configured**:
  - `grafana-dashboard.yaml`: Displays request rates, status codes, p95 latency, active requests, and heap memory.
  - `grafana-sre-dashboard.yaml`: Displays 30-minute rolling availability vs 99.0% SLO targets.

### 📝 3. Container Logging (`kubectl logs`)
- **Strategy**: Loki and Promtail are not installed to conserve system RAM on EC2 (~856 MiB available).
- **Log Inspection**: Container logs are inspected directly using native Kubernetes CLI commands:
  ```bash
  kubectl logs -n pulsecity -l app=pulsecity-backend --tail=100
  ```

---

## 4. SRE Alert Rules (`k8s/sre/prometheus-alerts.yaml`)

We configured 3 core Prometheus alert rules for site reliability:

1. **`BackendTargetDown`**: Fires if `up{job="pulsecity-backend"} == 0` for 1 minute (Critical).
2. **`High5xxErrorRate`**: Fires if HTTP 5xx error rate exceeds 1% over 5 minutes (Warning).
3. **`HighRequestLatencyP95`**: Fires if 95th percentile response time exceeds 500ms for 5 minutes (Warning).
