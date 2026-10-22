# 12. Presentation & Demo Script for Evaluators

`[MUST KNOW]`

---

## 1. Quick Presentation Pitch Scripts

### ⏱️ 30-Second Pitch (Elevator Summary)
> *"Respected Ma'am/Sir, **PulseCity** is a full-stack civic issue reporting web application built using a React frontend, Node.js/Express backend, and MongoDB database. 
> 
> Our primary DevOps implementation automates software delivery. Whenever code is pushed to GitHub, GitHub Actions automatically executes 18 unit tests, lints and builds the React frontend, performs a security vulnerability audit, compiles Docker images, and publishes them to the GitHub Container Registry (GHCR)."*

---

### ⏱️ 1-Minute Summary
> *"Respected Ma'am/Sir, our project **PulseCity** enables citizens to report and track municipal complaints while providing municipal authorities with a management dashboard.
> 
> For our FA2 DevOps project, we focused on automated quality assurance and containerized deployment. We implemented a complete CI/CD pipeline in GitHub Actions. On every push to `main`, our pipeline automatically runs 18 backend Jest unit tests, lints and compiles the React application, executes a Trivy security vulnerability audit, builds multi-stage Docker images, and pushes them to the GitHub Container Registry (GHCR). 
> 
> The application is fully containerized using Docker Compose for local deployment, and we have instrumented `/health` and `/metrics` endpoints for observability with Prometheus and Grafana."*

---

## 2. 5-Minute Evaluation Presentation Script

### Step 1: Introduction & Problem Statement (1 Minute)
> *"Good morning/afternoon Ma'am/Sir. Today we are presenting **PulseCity** (PulseCity). Traditional municipal complaint systems suffer from lack of transparency and slow software updates. PulseCity solves this by combining a modern web portal with an automated DevOps delivery pipeline."*

### Step 2: Architecture & Stack (1 Minute)
> *"Our tech stack consists of:
> - **Frontend**: React 18 single-page application built with Vite and served by Nginx.
> - **Backend**: Node.js and Express REST API.
> - **Database**: MongoDB Atlas cloud database.
> - **DevOps**: Docker, Docker Compose, GitHub Actions, and GitHub Container Registry."*

### Step 3: CI/CD Pipeline Demo (2 Minutes)
> *"Let us demonstrate our automated CI/CD pipeline in GitHub Actions:
> 1. **Testing**: Runs 18 unit tests verifying authentication, issue creation, `/health`, and `/metrics` routes.
> 2. **Quality**: ESLint validates frontend code, followed by Vite production bundle compilation.
> 3. **Security**: Trivy static analysis scans for high/critical filesystem vulnerabilities.
> 4. **Delivery**: Docker Buildx packages the code and pushes tagged container images to GHCR."*

### Step 4: Local Demo & Endpoint Verification (1 Minute)
> *"Using `docker compose up --build -d`, we can launch the complete system locally:
> - Frontend running on `http://localhost:3000`.
> - Backend running on `http://localhost:5000`.
> - Health Endpoint `GET /health` returning `200 OK` with database connection status.
> - Metrics Endpoint `GET /metrics` exposing Prometheus request counts and latency histograms."*

---

## 3. 10-Minute Deep-Dive Presentation Script

1. **Slide/Section 1: Problem & Solution** (Explain citizen pain points and PulseCity solution).
2. **Slide/Section 2: Architecture Overview** (Show ASCII diagram of Frontend $\rightarrow$ Backend $\rightarrow$ MongoDB).
3. **Slide/Section 3: Continuous Integration (CI)** (Explain Jest testing, ESLint, and Trivy security scanning).
4. **Slide/Section 4: Continuous Delivery (CD)** (Explain Docker multi-stage builds and GHCR image tagging with `:latest` and `:<commit-sha>`).
5. **Slide/Section 5: Container Orchestration & K8s** (Explain prepared K8s manifests under `k8s/`).
6. **Slide/Section 6: Observability** (Explain Express `/metrics` endpoint and Prometheus/Grafana dashboard setups).
7. **Slide/Section 7: Live Demonstration** (Run `docker compose ps` and `curl http://localhost:5000/health`).

---

## 4. "What Did You Personally Implement?" (Viva Answer)

If the teacher asks: *"What was your exact contribution to this project?"*

> *"Ma'am/Sir, I worked on the **DevOps and Pipeline Engineering**:
> 1. Configured the automated **GitHub Actions CI/CD pipeline** (`.github/workflows/ci.yml`) covering testing, linting, security audits, and GHCR publishing.
> 2. Created the **multi-stage Dockerfiles** for Node.js and React Nginx to optimize container size.
> 3. Configured **Docker Compose** for seamless single-command local multi-container development.
> 4. Implemented the Express **Prometheus metrics middleware** (`backend/middleware/metrics.js`) exposing `/metrics` and `/health` endpoints.
> 5. Authored declarative **Kubernetes manifests** (`k8s/`) for container orchestration."*
