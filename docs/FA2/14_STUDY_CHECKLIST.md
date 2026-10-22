# 14. Pre-Viva & Presentation Study Checklist

`[MUST KNOW]`

---

## 📌 Categorized Study Priorities

### 🔴 1. MUST STUDY (High Priority - Evaluators Will Ask)
- [ ] **DevOps Definition**: Ability to explain CI/CD in 2 simple sentences.
- [ ] **CI/CD Pipeline Flow**: Know the 4 automatic jobs (`backend-test` $\rightarrow$ `frontend-lint-and-build` $\rightarrow$ `security-scan` $\rightarrow$ `docker-build-push`).
- [ ] **Docker Basics**: Difference between Docker Image vs Container vs Dockerfile.
- [ ] **Multi-Stage Build**: Why `frontend/Dockerfile` uses Node.js for building and Nginx for serving.
- [ ] **Docker Compose**: How `docker compose up --build` launches local containers on ports 3000 and 5000.
- [ ] **GHCR Tagging**: Why we use both `:latest` and `:<commit-sha>` tags.
- [ ] **Health & Metrics**: Purpose of `/health` (`200 OK`) and `/metrics` (`prom-client` metrics).

### 🟡 2. GOOD TO STUDY (Medium Priority)
- [ ] **Kubernetes Core Terms**: Difference between Pod, Deployment, Service, ClusterIP, and NodePort.
- [ ] **K8s Status**: Explain that K8s manifests are prepared under `k8s/` for manual deployment.
- [ ] **Security Scanning**: How Trivy static scanning detects filesystem package vulnerabilities.
- [ ] **GitHub Token**: Why `${{ secrets.GITHUB_TOKEN }}` is used for GHCR authentication.

### 🟢 3. CAN SKIP IF TIME IS LOW (Low Priority / Advanced)
- [ ] Complex Loki Promtail LogQL queries.
- [ ] Advanced Grafana JSON panel syntax.
- [ ] Terraform AWS cloud infrastructure files.

---

## ⏰ 2 HOURS BEFORE VIVA CHECKLIST

1. [ ] **Run Application Locally**:
   ```bash
   docker compose up --build -d
   docker compose ps
   ```
2. [ ] **Test Endpoints**:
   - Open `http://localhost:3000` (React Frontend).
   - Open `http://localhost:5000/health` (Confirm `"database":"connected"`).
   - Open `http://localhost:5000/metrics` (Confirm Prometheus text output).
3. [ ] **Verify Tests**:
   - Run `npm test` inside `backend/` (Confirm 18/18 PASS).
4. [ ] **Review Demo Script**: Read 1-minute pitch in `12_DEMO_SCRIPT.md` out loud twice.

---

## ⚡ 10 MINUTES BEFORE PRESENTATION CHECKLIST

- [ ] Ensure Docker containers are running (`docker compose ps`).
- [ ] Keep browser tabs open to:
  - `http://localhost:3000` (Frontend Web Portal)
  - `http://localhost:5000/health` (JSON Health Status)
  - `https://github.com/AshVortex404/PulseCity/actions` (GitHub Actions Green Checks)
  - `https://github.com/AshVortex404/PulseCity/pkgs/container/pulsecity-backend` (GHCR Packages)
- [ ] Keep terminal window open with `docker compose ps` ready.
- [ ] Take a deep breath — your pipeline is 100% verified and working!
