# 15. FA2 Quick Revision Cheat Sheet

`[MUST KNOW]` *(Read this 5–10 minutes before entering your viva)*

---

## 🚀 1. Executive Summary

- **Project**: PulseCity (PulseCity) — Civic Issue Reporting Web Application.
- **Tech Stack**: React 18 (Vite) + Node.js Express + MongoDB Atlas + Docker + GitHub Actions + GHCR + Kubernetes (Optional).
- **Core Automation**:
  $$\text{Git Push} \longrightarrow \text{18 Jest Tests} \longrightarrow \text{Vite Build} \longrightarrow \text{Trivy Scan} \longrightarrow \text{Docker Build} \longrightarrow \text{GHCR Push}$$

---

## 📊 2. Key Numbers & Metrics to Remember

- **18/18**: Backend unit tests passing across 3 test suites.
- **0**: ESLint frontend errors.
- **2**: Docker container services (`pulsecity-backend`, `pulsecity-frontend`).
- **4**: Automated jobs in GitHub Actions CI pipeline.
- **2**: Image tags pushed to GHCR (`:latest` and `:<git-sha>`).
- **5000**: Backend Express port.
- **3000**: Frontend Nginx port.

---

## 🛠️ 3. Essential Commands Cheat Sheet

```bash
# Local Launch
docker compose up --build -d

# Check Status & Logs
docker compose ps
docker compose logs --tail=100 backend

# Stop Application
docker compose down

# Run Tests
cd backend && npm test
```

---

## 🌐 4. Essential Endpoints

- `http://localhost:3000` $\rightarrow$ React Citizen Frontend.
- `http://localhost:5000/health` $\rightarrow$ JSON Health (`"database":"connected"`).
- `http://localhost:5000/metrics` $\rightarrow$ Prometheus metrics (`http_requests_total`).

---

## ⚡ 5. Top 20 One-Line Viva Answers

1. **What is DevOps?** Automating software delivery processes between development and operations.
2. **What is CI?** Automatically testing code on every Git push.
3. **What is CD?** Automatically packaging and publishing deployable container images to a registry.
4. **What is Docker?** A platform that packages applications and runtime dependencies into isolated containers.
5. **What is a Docker Image?** A read-only blueprint containing code, libraries, and instructions.
6. **What is a Container?** A running instance of a Docker image.
7. **What is Multi-Stage Docker Build?** Separating build tools from final runtime to minimize container image size.
8. **What is Docker Compose?** Tool for running multi-container applications locally using `docker-compose.yml`.
9. **What is GitHub Actions?** Built-in GitHub tool for running automated CI/CD workflows.
10. **What is GHCR?** GitHub Container Registry (`ghcr.io`) for storing Docker container images.
11. **Why push `:latest` and `:<commit-sha>`?** `:latest` for convenient deployment; `:<commit-sha>` for immutable traceability.
12. **Why use `GITHUB_TOKEN`?** Automatically generated, short-lived, and prevents secret leakage.
13. **What is Kubernetes?** Container orchestration platform for scaling, self-healing, and load balancing.
14. **What is a Pod?** The smallest deployable object in Kubernetes running container(s).
15. **What is a Deployment?** K8s object managing replica Pod creation and rolling updates.
16. **What is a Service?** K8s networking object exposing Pods via stable IP or port.
17. **What is ClusterIP vs NodePort?** `ClusterIP` is internal to cluster; `NodePort` exposes traffic externally.
18. **What is `/health`?** Endpoint returning `200 OK` for K8s liveness probes and status checks.
19. **What is `/metrics`?** Endpoint exposing Prometheus request counts and latency metrics.
20. **What is MongoDB Atlas?** Cloud-hosted NoSQL database storing JSON-like issue documents.
