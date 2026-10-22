# 13. Comprehensive Viva Voce Question Bank

`[MUST KNOW]`

---

## 🅰️ Section A: Project & General DevOps Questions

### Q1: What is DevOps?
- **Simple Answer**: DevOps is a culture and set of practices that combines Software Development (Dev) and IT Operations (Ops) to shorten the software development lifecycle and deliver high-quality software continuously.
- **Project-Specific Answer**: In PulseCity, DevOps automates testing, security scanning, container building, and registry publishing using GitHub Actions and Docker.
- **Deep Explanation**: Traditional software teams built code separately and handed it to Ops engineers to deploy manually. DevOps uses automation tools (CI/CD, containers, monitoring) so developers can release safe code updates automatically multiple times a day.

### Q2: What is Continuous Integration (CI)?
- **Simple Answer**: Automatically building and testing code every time a developer pushes changes to a shared repository.
- **Project-Specific Answer**: Whenever we push to `main`, GitHub Actions automatically runs 18 Jest backend tests, ESLint checks, Vite frontend builds, and Trivy security scans.

### Q3: What is Continuous Delivery (CD)?
- **Simple Answer**: Automatically packaging tested code into deployable artifacts (like Docker images) and publishing them to a registry so they are ready for deployment.
- **Project-Specific Answer**: Our pipeline builds Docker images for backend and frontend and pushes them to GHCR tagged as `:latest` and `:<git-commit-sha>`.

---

## 🅱️ Section B: Docker & Containerization Questions

### Q4: What is the difference between a Docker Image and a Docker Container?
- **Simple Answer**: A Docker Image is a read-only blueprint template. A Docker Container is a running instance of that image.
- **Project-Specific Answer**: `ghcr.io/vltxjoyboy/pulsecity-backend:latest` is the Docker Image. `pulsecity-backend` running on port 5000 is the Docker Container.

### Q5: What is the difference between Docker and a Virtual Machine (VM)?
- **Simple Answer**: VMs virtualize entire hardware and run full operating systems (heavy). Docker containers share the host operating system kernel and run isolated user spaces (lightweight).

### Q6: What is a Multi-Stage Docker Build and why do we use it?
- **Simple Answer**: A Dockerfile that uses multiple `FROM` statements to separate the build environment from the final runtime environment.
- **Project-Specific Answer**: In `frontend/Dockerfile`, Stage 1 uses Node.js (~180MB) to build React static files. Stage 2 copies only the compiled `dist/` into Nginx Alpine (~25MB), reducing final container size by over 85%.

### Q7: What is Docker Compose?
- **Simple Answer**: A tool for defining and running multi-container Docker applications locally using a single YAML file.
- **Project-Specific Answer**: `docker-compose.yml` links our React frontend and Express backend containers with one command (`docker compose up --build`).

---

## 🅲 Section C: GitHub Actions & GHCR Questions

### Q8: What is GitHub Actions?
- **Simple Answer**: An automated CI/CD platform integrated directly into GitHub repositories.
- **Project-Specific Answer**: Defined in `.github/workflows/ci.yml`, running workflow jobs on `ubuntu-latest` virtual environments.

### Q9: Why do we use `GITHUB_TOKEN` instead of a Personal Access Token (PAT)?
- **Simple Answer**: `GITHUB_TOKEN` is automatically created for each workflow run and expires immediately after the run, preventing secret leakage in code.

### Q10: What is GHCR and why push images there?
- **Simple Answer**: GitHub Container Registry (`ghcr.io`) is a cloud registry hosted by GitHub to store and version Docker container images.

### Q11: Why do we push both `:latest` and `:<commit-sha>` tags?
- **Simple Answer**: `:latest` allows pulling the newest release quickly. `:<commit-sha>` ensures immutable versioning tied back to the exact Git commit history.

---

## 🅳 Section D: Kubernetes & Orchestration Questions

### Q12: What is Kubernetes (K8s)?
- **Simple Answer**: An open-source container orchestration platform that automates deployment, scaling, health monitoring, and management of containerized applications.

### Q13: What is a Pod in Kubernetes?
- **Simple Answer**: The smallest deployable unit in Kubernetes, wrapping one or more containers sharing network and storage.

### Q14: What is the difference between a Deployment and a Service?
- **Simple Answer**: A Deployment manages Pod creation, scaling, and rolling updates. A Service provides a stable network IP address and load balancer to access those Pods.

### Q15: What is the status of Kubernetes in PulseCity?
- **Project-Specific Answer**: Kubernetes manifests (`k8s/`) are prepared and validated for container orchestration. The automatic GitHub Actions pipeline publishes images to GHCR, while Kubernetes deployment is maintained as an optional/manual stage.

---

## 🅴 Section E: Application, Observability & Database Questions

### Q16: How does the backend connect to MongoDB Atlas?
- **Simple Answer**: Express uses Mongoose ORM to connect via the `MONGO_URI` environment variable over encrypted cloud HTTPS connections.

### Q17: What is `/health` and why is it important?
- **Simple Answer**: An HTTP endpoint that returns `200 OK` and JSON status (`"database":"connected"`) used by Kubernetes liveness probes and load balancers to check service health.

### Q18: What is `/metrics` and what does it expose?
- **Simple Answer**: An endpoint instrumented with `prom-client` that exposes Prometheus-format counters and histograms (`http_requests_total`, response latency, active requests) for observability.

### Q19: What is Prometheus and Grafana?
- **Simple Answer**: Prometheus scrapes and stores time-series metric data from `/metrics`. Grafana converts those metrics into visual graphs and monitoring dashboards.

### Q20: What happens if a unit test fails in GitHub Actions?
- **Simple Answer**: GitHub Actions immediately stops the workflow, marks the run as FAILED (red cross), and prevents the Docker build and GHCR push jobs from executing.
