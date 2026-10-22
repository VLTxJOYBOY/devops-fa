# PulseCity Site Reliability Engineering (SRE) Runbook

## 1. Service Level Indicators (SLIs) & Objectives (SLOs)

SRE targets for PulseCity are based exclusively on verified backend metrics exported by `prom-client` at `GET /metrics`:

| SLI Dimension | Measured Metric / PromQL | SLO Target | Evaluation Window | Rationale |
| :--- | :--- | :---: | :---: | :--- |
| **1. Target Availability** | `up{job="pulsecity-backend"}` | **>= 99.0%** | 30-minute rolling | Ensures backend scrape target is reachable and healthy. |
| **2. HTTP Success Rate** | `(sum(rate(http_requests_total{status_code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100` | **>= 99.0%** (5xx < 1%) | 5-minute rolling | Ensures HTTP 5xx server exceptions remain under 1% of total traffic. |
| **3. Request Latency** | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | **< 500 ms** (0.5s) | 5-minute rolling | Guarantees 95% of API requests complete in less than 500 ms. |

---

## 2. Prometheus Alert Rules Configuration

The alert rules are configured directly in `k8s/monitoring/prometheus-config.yaml` under `alerts.yml`:

### Alert 1: `BackendTargetDown`
- **Expression**: `up{job="pulsecity-backend"} == 0`
- **Duration**: `for: 1m`
- **Severity**: `critical`
- **Description**: Triggers if Prometheus cannot scrape the `pulsecity-backend` service for more than 1 minute.

### Alert 2: `High5xxErrorRate`
- **Expression**: `(sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100 > 1`
- **Duration**: `for: 5m`
- **Severity**: `warning`
- **Description**: Triggers if HTTP 5xx responses exceed 1% of total requests over a 5-minute window.

### Alert 3: `HighRequestLatencyP95`
- **Expression**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5`
- **Duration**: `for: 5m`
- **Severity**: `warning`
- **Description**: Triggers if the 95th percentile response time exceeds 0.5 seconds (500 ms) over a 5-minute window.

---

## 3. Incident Response Runbooks

### Scenario A: Backend Unreachable (`BackendTargetDown`)

**Trigger**: Alert `BackendTargetDown` fires (`up == 0`).

**Step-by-Step Response**:
1. **Check Pod Status in Kubernetes**:
   ```bash
   kubectl get pods -n pulsecity -l app=pulsecity-backend
   ```
2. **Inspect Pod Events**:
   ```bash
   kubectl describe pod -n pulsecity -l app=pulsecity-backend
   ```
   *Check for status `CrashLoopBackOff`, `OOMKilled`, or `ImagePullBackOff`.*
3. **Inspect Application Logs**:
   ```bash
   kubectl logs -n pulsecity -l app=pulsecity-backend --tail=100
   ```
4. **Remediation**:
   - **If pod is deadlocked or stuck**: Restart deployment:
     ```bash
     kubectl rollout restart deployment/pulsecity-backend -n pulsecity
     ```
   - **If bad code deployment**: Roll back to previous working revision:
     ```bash
     kubectl rollout undo deployment/pulsecity-backend -n pulsecity
     ```
5. **Verify Recovery**:
   Check health endpoint:
   ```bash
   kubectl exec -n pulsecity deploy/pulsecity-backend -- wget -qO- http://localhost:5000/health
   ```

---

### Scenario B: High Server Error Rate (`High5xxErrorRate`)

**Trigger**: Alert `High5xxErrorRate` fires (5xx error rate > 1%).

**Step-by-Step Response**:
1. **Check Status Code Breakdown**:
   Determine if 500 internal server errors or MongoDB connection errors are occurring:
   ```bash
   kubectl logs -n pulsecity -l app=pulsecity-backend --tail=200 | grep -iE "500|MongoNetworkError|MongooseError"
   ```
2. **Verify Database Connectivity**:
   Ensure MongoDB service or external connection is reachable:
   ```bash
   kubectl exec -n pulsecity deploy/pulsecity-backend -- wget -qO- http://localhost:5000/health
   ```
   *Response must report `"database": "connected"`.*
3. **Remediation**:
   - If database disconnected, check database pod/URI configuration.
   - If unhandled application exception, roll back deployment:
     ```bash
     kubectl rollout undo deployment/pulsecity-backend -n pulsecity
     ```

---

### Scenario C: High Request Latency (`HighRequestLatencyP95`)

**Trigger**: Alert `HighRequestLatencyP95` fires (p95 latency > 500ms).

**Step-by-Step Response**:
1. **Check Process Resource Usage**:
   Check if Node.js container memory or CPU usage is throttled:
   ```bash
   kubectl top pod -n pulsecity -l app=pulsecity-backend
   ```
2. **Inspect Active Request Count**:
   Check if request concurrency is abnormally high:
   ```bash
   kubectl logs -n pulsecity -l app=pulsecity-backend --tail=50
   ```
3. **Remediation**:
   - If container CPU/memory is saturated, restart pod to flush event loop lag:
     ```bash
     kubectl rollout restart deployment/pulsecity-backend -n pulsecity
     ```
   - Scale backend deployment if traffic load increased:
     ```bash
     kubectl scale deployment/pulsecity-backend --replicas=2 -n pulsecity
     ```
