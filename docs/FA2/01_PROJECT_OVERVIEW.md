# 01. PulseCity Project Overview

`[MUST KNOW]`

---

## 1. What is PulseCity?

**PulseCity** (also known as *PulseCity*) is a civic issue reporting web platform that allows citizens to report municipal problems (such as potholes, street light outages, waste management issues) directly to local ward members and municipal authorities.

### Problem Statement
In traditional municipal complaint systems:
- Citizens have no real-time status tracking for reported issues.
- Authorities lack a centralized dashboard to prioritize and assign incoming civic issues.
- Software releases and updates to municipal portals are slow, manual, and prone to server downtime.

### PulseCity Solution
- **Web Application**: Citizens can view reported issues, filter by status, and report new issues with location details.
- **DevOps Pipeline**: Automated testing, security auditing, containerization, and registry publishing ensure rapid, reliable, and zero-downtime updates.

---

## 2. Why is PulseCity Suitable for DevOps?

PulseCity is a modern **microservices-ready full-stack application** with decoupled components (React frontend, Express REST API, MongoDB database). 

It is ideal for DevOps because:
1. **Decoupled Architecture**: Frontend and backend can be built, tested, and containerized independently.
2. **Automated Quality Checks**: Unit tests and security scans run automatically before code can be published.
3. **Container Consistency**: Docker ensures the application runs identically on developer laptops, CI servers, and Kubernetes clusters.

---

## 3. Technology Stack Breakdown

Below is a simple explanation of every technology used in PulseCity:

### 🛠️ 1. Git
- **What is it?**: A distributed version control system that tracks changes in source code.
- **Why do we use it?**: Allows developer team members to collaborate safely without overwriting each other's code.
- **Where is it used?**: Manages all source code history in the project repository.

### 🌐 2. GitHub
- **What is it?**: A cloud-based platform for hosting Git repositories.
- **Why do we use it?**: Serves as the central code repository and triggers automated pipelines.
- **Where is it used?**: Hosted at `https://github.com/AshVortex404/PulseCity`.

### ⚡ 3. GitHub Actions
- **What is it?**: An automated Continuous Integration and Continuous Delivery (CI/CD) platform built into GitHub.
- **Why do we use it?**: Automatically runs tests, builds frontend code, scans for security bugs, and builds Docker images on every code push.
- **Where is it used?**: Defined in `.github/workflows/ci.yml`.

### 🟢 4. Node.js
- **What is it?**: An open-source, cross-platform JavaScript runtime environment.
- **Why do we use it?**: Executes backend server code efficiently using event-driven, non-blocking I/O.
- **Where is it used?**: Powers the backend server located in `/backend`.

### 🚂 5. Express.js
- **What is it?**: A lightweight web framework for Node.js.
- **Why do we use it?**: Simplifies handling HTTP requests, creating REST API routes (`/api/issues`), and middleware logging.
- **Where is it used?**: Backend routing in `backend/server.js` and `backend/routes/`.

### ⚛️ 6. React (with Vite)
- **What is it?**: A frontend JavaScript library for building component-based user interfaces.
- **Why do we use it?**: Delivers a fast, interactive single-page application (SPA) experience for citizens.
- **Where is it used?**: Located in `/frontend`.

### 🍃 7. MongoDB Atlas
- **What is it?**: A fully managed cloud NoSQL database service.
- **Why do we use it?**: Stores civic issue records and user credentials flexibly as JSON-like documents without managing database hardware.
- **Where is it used?**: External database connected via `MONGO_URI` environment variable.

### 🐳 8. Docker
- **What is it?**: A platform that packages applications and dependencies into lightweight containers.
- **Why do we use it?**: Eliminates "it works on my machine" bugs by bundling runtime code, Node.js, and Nginx.
- **Where is it used?**: Defined in `backend/Dockerfile` and `frontend/Dockerfile`.

### 🐙 9. Docker Compose
- **What is it?**: A tool for defining and running multi-container Docker applications locally using a single YAML file.
- **Why do we use it?**: Launches both backend and frontend containers locally with one command (`docker compose up --build`).
- **Where is it used?**: Defined in `docker-compose.yml`.

### 📦 10. GitHub Container Registry (GHCR)
- **What is it?**: A cloud container image registry hosted by GitHub.
- **Why do we use it?**: Stores and versions compiled Docker container images securely.
- **Where is it used?**: Receives images tagged as `ghcr.io/vltxjoyboy/pulsecity-backend` and `ghcr.io/vltxjoyboy/pulsecity-frontend`.

### ☸️ 11. Kubernetes (K8s)
- **What is it?**: An open-source container orchestration system for automating application deployment, scaling, and management.
- **Why do we use it?**: Manages container Pods, load balancing, zero-downtime rolling updates, and self-healing.
- **Where is it used?**: Declarative manifests configured under `k8s/` *(Maintained as an optional/manual stage)*.

### 📊 12. Prometheus
- **What is it?**: An open-source systems monitoring and alerting toolkit.
- **Why do we use it?**: Scrapes `/metrics` from the backend to monitor memory usage, HTTP request counts, and response latency.
- **Where is it used?**: Endpoint exposed in `backend/middleware/metrics.js`; K8s configuration in `k8s/monitoring/`.

### 📈 13. Grafana
- **What is it?**: An open-source visualization dashboard tool.
- **Why do we use it?**: Converts raw Prometheus metrics and Loki logs into visual graphs and SRE dashboards.
- **Where is it used?**: Dashboard manifests configured in `k8s/sre/grafana-sre-dashboard.yaml`.

---

## 4. Current Status Matrix

| Component | Status | Description |
|:---|:---:|:---|
| **Core Web App** | **VERIFIED WORKING** | React frontend + Express backend connected to MongoDB Atlas. |
| **Testing & Linting** | **VERIFIED WORKING** | 18/18 Jest backend tests pass; ESLint 0 errors. |
| **CI/CD Automation** | **VERIFIED WORKING** | GitHub Actions builds, audits, and pushes to GHCR automatically. |
| **Local Containerization** | **VERIFIED WORKING** | Runs seamlessly via `docker compose up --build`. |
| **Kubernetes & SRE** | **CONFIGURED (OPTIONAL)** | Declarative manifests prepared under `k8s/` for manual deployment. |
