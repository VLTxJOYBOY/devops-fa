# PulseCity Incident Management Framework

> **Academic / Project Context**: This document defines the incident response procedures and lifecycle management for the PulseCity system.

---

## 1. Incident Severity Classifications

Incidents are classified based on operational impact and urgency:

| Severity Level | Description & Operational Impact | Response SLA Target | Notification / Escalation |
|----------------|----------------------------------|----------------------|---------------------------|
| **SEV-1 (Critical)** | **Major Service Outage**: Total backend failure (`BackendDown`), database disconnection, or complete loss of issue reporting functionality affecting all users. | Initial triage within **15 minutes**; continuous active remediation. | On-call SRE lead, lead developer, status page update. |
| **SEV-2 (High)** | **Significant Degradation**: High error rate (`HighErrorRate` > 1% 5xx) or high latency (`HighLatency` > 500ms p95) affecting key features without complete service loss. | Initial triage within **30 minutes**; resolution target within **4 hours**. | On-call engineer, team lead. |
| **SEV-3 (Minor)** | **Minor Issue / Limited Impact**: Non-critical route failure, cosmetic UI defect, or low-impact background job failure with working workarounds. | Initial triage within **24 hours**; addressed in normal sprint cycle. | Engineering backlog / issue tracker. |

---

## 2. Nine-Step Incident Lifecycle

When an anomaly or alert occurs, engineers follow this 9-step incident lifecycle:

```
  [ 1. Detection ] ──► [ 2. Triage ] ──► [ 3. Severity Classification ]
                                                       │
  [ 6. Recovery ]  ◄── [ 5. Mitigation ] ◄── [ 4. Investigation ]
        │
        ▼
  [ 7. Verification ] ──► [ 8. Communication ] ──► [ 9. Post-Mortem ]
```

### Step 1: Detection
- **Mechanism**: Automated Prometheus alerts (`BackendDown`, `HighErrorRate`, `HighLatency`), Kubernetes liveness/readiness probe failures, or user-submitted bug reports.
- **Action**: Alert triggered and recorded in monitoring logs.

### Step 2: Triage
- **Action**: On-call engineer acknowledges the alert, reviews baseline metrics in the Grafana Observability and SRE dashboards, and confirms whether the issue represents a true incident or a false positive.

### Step 3: Severity Classification
- **Action**: Assign severity level (`SEV-1`, `SEV-2`, or `SEV-3`) based on user impact and baseline SLO violation criteria.

### Step 4: Investigation
- **Action**: Use diagnostic tools to identify root cause:
  - Query Loki logs: `{namespace="pulsecity", app="pulsecity-backend"} |= "error"`
  - Check Kubernetes pod status: `kubectl get pods -n pulsecity` and `kubectl describe pod <pod_name> -n pulsecity`
  - Review Node.js heap memory, CPU utilization, and MongoDB database query performance.

### Step 5: Mitigation
- **Action**: Take rapid action to stabilize the system and stop customer impact before full root cause fix:
  - Roll back to previous container image version (`kubectl rollout undo deployment/pulsecity-backend -n pulsecity`)
  - Scale deployment replicas to handle load (`kubectl scale deployment/pulsecity-backend --replicas=3 -n pulsecity`)
  - Restart pod instances if deadlocked or out of memory.

### Step 6: Recovery
- **Action**: Ensure application services resume normal operation, response status codes return to HTTP `2xx`, and p95 latency drops below 500ms.

### Step 7: Verification
- **Action**: Validate recovery using automated backend health probes (`GET /health`), metric checks (`GET /metrics`), and Prometheus alert resolution verification (`up{job="pulsecity-backend"} == 1`).

### Step 8: Communication
- **Action**: Inform team stakeholders and update incident tracking ticket with timeline, resolution summary, and impact assessment.

### Step 9: Post-Mortem
- **Action**: For all `SEV-1` and `SEV-2` incidents, schedule a blameless post-mortem meeting within 48 hours to document root cause, lessons learned, and preventive action items (`docs/sre/postmortem-example.md`).
