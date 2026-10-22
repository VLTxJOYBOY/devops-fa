# Incident Post-Mortem: PulseCity Backend Service Outage (Simulated Academic Example)

> **DISCLAIMER & ACADEMIC CONTEXT**: *This post-mortem report is an example / simulated academic incident created for SRE demonstration purposes. This incident DID NOT actually happen in a production environment and no real customer data or services were affected.*

---

## 1. Incident Summary
- **Incident Title**: PulseCity Backend High Latency and Scrape Failure
- **Date & Time**: October 5, 2026, 14:10 UTC – 14:28 UTC
- **Duration**: 18 minutes
- **Severity**: SEV-1 (Critical)
- **Incident Commander**: On-Call SRE Lead (Simulated Role)
- **Primary Affected Component**: `pulsecity-backend` service in `pulsecity` namespace.

---

## 2. Impact
- **Service Availability Impact**: 18 minutes of backend unavailability (`up == 0`).
- **User Impact**: Citizens were unable to submit new civic issues or check status of existing reports via the web frontend. HTTP requests returned 504 Gateway Timeout errors.
- **Error Budget Consumed**: 18 minutes out of monthly 432 minutes error budget (4.16% of monthly budget consumed).

---

## 3. Timeline (UTC)
- **14:10**: Automated load test scenario initiated rapid request spike to `/api/issues/search`.
- **14:11**: Backend event-loop lag increased to > 1.2 seconds due to unindexed database regex queries.
- **14:12**: Prometheus alert `BackendDown` triggered as `/metrics` endpoint timed out.
- **14:13**: On-call engineer acknowledged `BackendDown` alert in alert channel.
- **14:15**: Triage confirmed pod Liveness and Readiness probes failed, triggering Kubernetes container restarts.
- **14:18**: Restarted pods immediately encountered connection pool exhaustion on startup due to accumulated pending client connections.
- **14:22**: SRE team executed temporary pod scaling (`kubectl scale deployment/pulsecity-backend --replicas=3`) and restarted database connection pool handlers.
- **14:25**: Latency returned to baseline (< 45 ms) and HTTP status codes normalized to `200 OK`.
- **14:28**: All Prometheus alerts resolved (`BackendDown`, `HighLatency`). Incident officially declared resolved.

---

## 4. Detection
The incident was detected automatically within **2 minutes** by Prometheus monitoring:
- Alert **BackendDown** fired at 14:12 UTC when `up{job="pulsecity-backend"} == 0` for 2 minutes.
- Mean Time To Detect (MTTD): **2 minutes**.

---

## 5. Root Cause
An unindexed regex search query on the `/api/issues/search` route caused severe MongoDB collection scans. When request volume spiked, the single-threaded Node.js event loop became blocked by synchronous data formatting, preventing HTTP health check (`/health`) and metrics (`/metrics`) endpoints from responding within configured probe timeouts.

---

## 6. Contributing Factors
1. **Missing Database Index**: Text search fields on `issues` collection lacked a compound text index.
2. **Missing Request Rate Limiting**: Search endpoint had no rate limiting per IP or token.
3. **Tight Probe Timeouts**: Kubernetes liveness probe timeout was set to 2 seconds without adequate initial delay buffer.

---

## 7. Resolution
The on-call SRE scaled the backend deployment from 1 replica to 3 replicas to immediately distribute pending requests, applied temporary query caching in backend middleware, and restarted database sockets to flush hanging handles.

---

## 8. Recovery
Service recovery was verified using:
- Prometheus metric `up{job="pulsecity-backend"}` returning `1`.
- Grafana SRE Dashboard showing p95 latency dropping below **50 ms**.
- 5xx Error Rate returning to **0.00%**.
- Mean Time To Recovery (MTTR): **16 minutes** from detection (18 minutes total outage duration).

---

## 9. What Went Well
- Prometheus alerting fired promptly within 2 minutes of endpoint failure.
- Kubernetes liveness probes correctly identified unresponding pods and attempted container recovery.
- Operational runbook (`docs/sre/runbook.md`) provided clear escalation and diagnostic commands.

---

## 10. What Went Poorly
- Pod restarts caused a thundering herd effect on the database connection pool.
- Lack of query caching allowed repetitive expensive search queries to reach the database directly.

---

## 11. Corrective Actions
- [x] Added compound database index on `Issue` title and description fields.
- [x] Updated Express route handler to enforce maximum search result limits (`limit=50`).

---

## 12. Preventive Actions
- [ ] Implement rate limiting middleware (`express-rate-limit`) on search endpoints.
- [ ] Add explicit index check in automated CI pipeline tests (`tests/healthAndMetrics.test.js`).
- [ ] Tune Kubernetes liveness probe `timeoutSeconds` from 2s to 5s to prevent unnecessary probe failure cascades during minor load bursts.

---

## 13. Lessons Learned
1. **Event-loop Health**: Node.js event-loop lag is a critical early indicator of performance degradation before total pod failure occurs.
2. **Graceful Degradation**: Unindexed search endpoints must fail fast or return paginated results rather than blocking the main server thread.
