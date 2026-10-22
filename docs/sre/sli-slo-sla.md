# PulseCity Service Level Indicators, Objectives, & Agreements (SLI / SLO / SLA)

> **Academic / Project Context Notice**: This document defines SRE operational metrics, SLO targets, SLA commitments, and error budget calculations for the PulseCity (PulseCity) system. The SLA defined herein is an academic project example and is not a contractual production SLA. PulseCity does not currently have commercial paying customers.

---

## 1. Service Level Indicators (SLI)

Service Level Indicators (SLIs) measure real-time operational performance across four core dimensions using existing Prometheus metrics exposed by the PulseCity backend (`/metrics` via `prom-client`):

| SLI Dimension | Underlying Metric / Measurement Method | PromQL Query Formula | Concept / Definition |
|---------------|-----------------------------------------|----------------------|----------------------|
| **1. Service Availability** | `up{job="pulsecity-backend"}` | `avg_over_time(up{job="pulsecity-backend"}[30m])` | Proportion of successful scrape / healthy service time divided by total observed service time over a 30-minute window. |
| **2. HTTP Success Rate** | `http_requests_total` | `sum(rate(http_requests_total{status_code=~"2.."}[5m])) / sum(rate(http_requests_total[5m]))` | Proportion of successful HTTP 2xx responses relative to total HTTP requests over 5 minutes. |
| **3. HTTP 5xx Error Rate** | `http_requests_total` | `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | Proportion of HTTP 5xx server error responses relative to total HTTP requests over 5 minutes. |
| **4. p95 Request Latency** | `http_request_duration_seconds` (histogram) | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | 95th percentile HTTP request duration in seconds calculated across histogram duration buckets over 5 minutes. |

---

## 2. Service Level Objectives (SLO Targets)

SLO targets represent realistic internal engineering targets for system performance. They are **SLO Targets**, not measured production historical results:

| Objective Area | SLO Target | Evaluation Window | Target Rationale |
|----------------|------------|-------------------|------------------|
| **Backend Availability Target** | **>= 99.0%** | 30-day rolling window | Ensures high reliability and uptime for civic issue reporting. |
| **HTTP Success Rate Target** | **>= 99.0%** | 5-minute evaluation rate | Ensures reliable client-backend API interactions. |
| **HTTP 5xx Error Rate Target** | **< 1.0%** | 5-minute evaluation rate | Prevents unhandled server exceptions and backend crashes. |
| **p95 Request Latency Target** | **< 500 ms** (0.5s) | 5-minute evaluation rate | Maintains responsive user interface interactions. |

*Note: All SLO thresholds represent internal targets for operational baseline measurement.*

---

## 3. Service Level Agreement (SLA)

An **SLA (Service Level Agreement)** is an explicit commitment or agreement made with users, clients, or stakeholders regarding service availability and performance, often tied to remedies or penalties if unfulfilled.

### PulseCity Demo SLA Example:
- **Monthly Availability Target**: 99.0% availability target over any calendar month.
- **Performance Commitment**: 95% of API requests served within 500 ms under normal load.
- **Incident Response Expectations**: Initial triage within 15 minutes for critical outages (`SEV-1`) and resolution within 2 hours.

> **IMPORTANT DISCLAIMER**: *This SLA is an academic/project example for demonstration purposes and is not a contractual production SLA. PulseCity does not have commercial SLA obligations or paying customers.*

---

## 4. Error Budget Calculation

The **Error Budget** represents the maximum allowable threshold of unreliability or downtime permitted before feature development is halted in favor of reliability engineering.

$$\text{Error Budget} = 100\% - \text{SLO Target}$$

For an **Availability SLO of 99.0%**:
- **Allowable Unavailability**: `100% - 99.0% = 1.0%`

### Monthly Interpretation (30-day Month):
- Total minutes in a 30-day month:
  $$30 \text{ days} \times 24 \text{ hours/day} \times 60 \text{ minutes/hour} = 43,200 \text{ total minutes}$$
- Allowable Downtime / Unavailability Allowance:
  $$1.0\% \times 43,200 \text{ minutes} = 432 \text{ minutes } (\approx 7.2 \text{ hours})$$

*Note: This calculation represents an allowable target budget, not actual measured downtime.*

---

## 5. Operational SRE Metrics Definitions

Operational reliability is tracked using key SRE performance indicators:

1. **Availability**: The percentage of time that the PulseCity backend is operational and serving valid HTTP responses (`up == 1`).
2. **Error Rate**: The ratio of failed requests (HTTP status `5xx`) to total incoming requests.
3. **Latency**: The time taken by the server to process and return a response, evaluated at the 95th percentile (p95).
4. **Error Budget**: The remaining allowable downtime/error capacity before violating the SLO.
5. **Incident Count**: The number of declared operational incidents (categorized by SEV-1, SEV-2, SEV-3) during a given period.
6. **MTTD (Mean Time To Detect)**: The average time elapsed from when an issue or outage occurs until it is detected by automated Prometheus alerts or health probes.
7. **MTTR (Mean Time To Recovery / Resolve)**: The average time elapsed from incident detection until complete service restoration and operational stabilization.

*(Note: In this academic/demo setup, historical values for MTTD and MTTR are hypothetical examples used for framework demonstration.)*

---

## 6. Dashboard & Alerting Operational Clarifications

1. **Grafana SRE Dashboard Panel ("Availability vs SLO / Budget Status")**:
   - Formula: `(avg_over_time(up{job="pulsecity-backend"}[30m]) - 0.99) / 0.01 * 100`
   - **Semantics**: This panel represents current 30-minute rolling availability relative to the 99% SLO target. It indicates immediate operational margin and is **NOT** a cumulative monthly error-budget measurement (which requires multi-week long-term metric persistence).

2. **HighActiveRequests Alert Threshold (`http_active_requests > 100`)**:
   - **Nature**: The threshold of `100` concurrent active requests is an illustrative academic/demo baseline.
   - **Production Requirement**: In a production deployment, this threshold must be calibrated using real capacity planning and load testing based on Node.js process benchmarking and cluster pod scaling limits.

