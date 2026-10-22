# PulseCity FA2 DevOps Project Documentation

Welcome to the official FA2 DevOps & Observability documentation hub for **PulseCity** (PulseCity). This documentation set is designed to be **simple, comprehensive, and easy to explain** to evaluators during presentations and viva examinations.

---

## 📚 Documentation Index

| Module | Title | Topic & Purpose | Priority Level |
|:---:|:---|:---|:---:|
| **00** | [Zero-to-Grafana Guide](./00_ZERO_TO_GRAFANA.md) | **PRIMARY STEP-BY-STEP EXAMINER DEMO GUIDE** | `[CRITICAL / MUST READ]` |
| **01** | [Project Overview](./01_PROJECT_OVERVIEW.md) | What PulseCity is, problem statement, and technology stack | `[MUST KNOW]` |
| **02** | [Folder & File Guide](./02_FOLDER_FILE_GUIDE.md) | Complete directory layout and file-by-file explanation | `[MUST KNOW]` |
| **03** | [System Architecture](./03_ARCHITECTURE.md) | ASCII diagrams, data flow, and component interactions | `[MUST KNOW]` |
| **04** | [DevOps Pipeline](./04_DEVOPS_PIPELINE.md) | End-to-end CI/CD workflow explanation | `[MUST KNOW]` |
| **05** | [Application Code Explanation](./05_APPLICATION_CODE_EXPLANATION.md) | Backend API, Express routes, React frontend, database | `[MUST KNOW]` |
| **06** | [Docker & Containerization](./06_DOCKER_EXPLANATION.md) | Dockerfiles, multi-stage builds, and Docker Compose | `[MUST KNOW]` |
| **07** | [GitHub Actions Workflow](./07_GITHUB_ACTIONS_EXPLANATION.md) | Detailed breakdown of `.github/workflows/ci.yml` | `[MUST KNOW]` |
| **08** | [GitHub Container Registry (GHCR)](./08_GHCR_EXPLANATION.md) | Container registry, image tagging (`:latest`, `:<sha>`) | `[MUST KNOW]` |
| **09** | [Kubernetes Manifests](./09_KUBERNETES_EXPLANATION.md) | Declarative K8s manifests, deployments, services | `[GOOD TO KNOW]` |
| **10** | [Monitoring & Observability](./10_MONITORING_EXPLANATION.md) | Prometheus metrics & Grafana dashboards | `[GOOD TO KNOW]` |
| **11** | [How to Run Locally](./11_HOW_TO_RUN.md) | Step-by-step guide to launch, test, and view endpoints | `[MUST KNOW]` |
| **12** | [Presentation & Demo Script](./12_DEMO_SCRIPT.md) | 30s, 1m, 5m, and 10m scripts for viva & presentation | `[MUST KNOW]` |
| **13** | [Comprehensive Viva Questions](./13_VIVA_QUESTIONS.md) | 40+ Q&A categorized by topic and difficulty | `[MUST KNOW]` |
| **14** | [Study Checklist](./14_STUDY_CHECKLIST.md) | Pre-viva preparation checklist | `[MUST KNOW]` |
| **15** | [FA2 Quick Revision Sheet](./15_FA2_QUICK_REVISION.md) | Single-page summary of key concepts, commands & numbers | `[MUST KNOW]` |
| **—** | [Minimal Monitoring Guide](./MONITORING.md) | Concise resource-optimized monitoring setup guide | `[MUST KNOW]` |
| **—** | [SRE Runbook](./SRE-RUNBOOK.md) | Operational SLI/SLO definitions & alert runbook | `[MUST KNOW]` |

---

# 📊 FINAL PROJECT STATUS

| Component / Subsystem | Implementation & Verification Status | Notes / Operational Mode |
|:---|:---:|:---|
| **React Frontend** | **WORKING** | Single-page app built with Vite & React (`/frontend`). |
| **Node.js Backend** | **WORKING** | Express REST API serving `/api/issues`, `/health`, `/metrics`. |
| **Database Integration** | **WORKING** | Connected to MongoDB Atlas managed database. |
| **Docker Compose** | **WORKING** | Local composition running frontend (3000) & backend (5000). |
| **Backend Unit Tests** | **WORKING** | **18/18 PASS** across 3 test suites (`Jest` / `Supertest`). |
| **Frontend Linter** | **WORKING** | **0 Errors** (ESLint verified). |
| **Frontend Production Build** | **WORKING** | Bundles cleanly to `frontend/dist/`. |
| **Security Scanning** | **WORKING** | Automated `npm audit` and `Trivy` static vulnerability scan. |
| **GitHub Actions Pipeline** | **WORKING** | Continuous Integration automated workflow on `push` to `main`. |
| **Docker Image Build** | **WORKING** | Multi-stage Docker builds for backend and frontend. |
| **GHCR Package Publishing** | **WORKING** | Images published to `ghcr.io/vltxjoyboy/pulsecity-*`. |
| **Kubernetes Deployment** | **WORKING** | Running in `pulsecity` namespace on K3s. |
| **Prometheus Metrics** | **WORKING** | Express `/metrics` endpoint active via `prom-client`. |
| **Prometheus Server** | **WORKING** | Running in `monitoring` namespace, scraping backend `/metrics`. |
| **Grafana Dashboards** | **WORKING** | Running in `monitoring` namespace, displaying Observability & SRE dashboards. |
| **Loki & Promtail Logging** | **NOT INSTALLED** | Log inspection performed using native `kubectl logs`. |

---

# 🗣️ HOW TO EXPLAIN THIS PROJECT TO A TEACHER

> *"Ma'am/Sir, our project is **PulseCity** (PulseCity), a web application built using a **React frontend**, a **Node.js/Express backend**, and a **MongoDB Atlas database**.
>
> For our FA2 DevOps implementation, we automated the entire software delivery pipeline. Whenever code is pushed to GitHub, **GitHub Actions** automatically runs 18 unit tests, lints and builds the React frontend, performs a security vulnerability audit, compiles Docker images, and publishes them to the **GitHub Container Registry (GHCR)**.
>
> We containerized the application using **Docker** and **Docker Compose** for local deployment, and deployed declarative **Kubernetes** manifests to a K3s cluster on AWS EC2. We also instrumented the backend with a `/metrics` and `/health` endpoint for live observability with **Prometheus** and **Grafana**."*
