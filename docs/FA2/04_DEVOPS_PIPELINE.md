# 04. PulseCity DevOps Pipeline Guide

`[MUST KNOW]`

---

## 1. What is the CI/CD Pipeline?

A **CI/CD Pipeline** is an automated assembly line for software. Whenever code is updated:
1. **Continuous Integration (CI)** automatically tests, lints, and scans the code for security vulnerabilities.
2. **Continuous Delivery (CD)** automatically builds container images and publishes them to a container registry (GHCR) so they can be deployed to production servers.

---

## 2. PulseCity Pipeline Stages

Our pipeline is defined in `.github/workflows/ci.yml` and consists of **4 active automatic jobs**:

```
[ Push to Main Branch ]
           │
           ├─────────────────────────┬─────────────────────────┐
           ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ 1. Backend Test     │   │ 2. Frontend Lint    │   │ 3. Security Scan    │
│    (Jest/Supertest) │   │    (ESLint/Vite)    │   │    (npm / Trivy)    │
└──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘
           │                         │                         │
           └─────────────────────────┴─────────────────────────┘
                                     │ (All Must Pass)
                                     ▼
                          ┌─────────────────────┐
                          │ 4. Docker Build &   │
                          │    Push to GHCR     │
                          └─────────────────────┘
```

---

## 3. Job-by-Job Breakdown

### Job 1: `backend-test` (Backend Unit Tests)
- **Goal**: Ensures all backend API routes and authentication logic work correctly.
- **Steps**:
  1. Check out repository code (`actions/checkout@v4`).
  2. Setup Node.js version 20 (`actions/setup-node@v4`).
  3. Install backend dependencies (`npm ci`).
  4. Run Jest test suite (`npm test`).
- **Result**: **18/18 PASS**.

### Job 2: `frontend-lint-and-build` (Frontend Quality Check)
- **Goal**: Verifies frontend code format and confirms Vite builds without errors.
- **Steps**:
  1. Check out repository code.
  2. Install frontend dependencies (`npm ci`).
  3. Run ESLint code checks (`npm run lint`).
  4. Compile production distribution bundle (`npm run build`).
- **Result**: **0 Errors, Vite dist bundle generated in ~3.5s**.

### Job 3: `security-scan` (Vulnerability Audit)
- **Goal**: Audits third-party packages and filesystem for security vulnerabilities.
- **Steps**:
  1. Run `npm audit` on backend and frontend packages.
  2. Run `aquasecurity/trivy-action@master` static filesystem vulnerability scanner.
- **Result**: **Clean security scan**.

### Job 4: `docker-build-push` (Container Build & Registry Delivery)
- **Goal**: Packages backend and frontend into Docker images and uploads them to GHCR.
- **Dependencies**: `needs: [backend-test, frontend-lint-and-build, security-scan]` (only runs if all 3 previous jobs succeed).
- **Permissions**: `packages: write`, `contents: read`.
- **Steps**:
  1. Set up Docker Buildx (`docker/setup-buildx-action@v3`).
  2. Log into GHCR using `${{ secrets.GITHUB_TOKEN }}`.
  3. Build & push `ghcr.io/vltxjoyboy/pulsecity-backend`.
  4. Build & push `ghcr.io/vltxjoyboy/pulsecity-frontend`.
- **Image Tags Created**:
  - `:latest` (Points to current production release).
  - `:<git-commit-sha>` (e.g., `:9a7a1135...` for exact version traceability).

---

## 4. Key Pipeline Concepts Explained

### 🔑 1. Why use `GITHUB_TOKEN` instead of a Personal Access Token (PAT)?
- `GITHUB_TOKEN` is automatically created by GitHub for every workflow run.
- It expires automatically after the run finishes, avoiding hardcoded secrets or leaked credentials in code files.

### 🏷️ 2. Why do we push two tags (`:latest` and `:<commit-sha>`)?
- `:latest` allows servers to always pull the newest release easily.
- `:<commit-sha>` ensures **immutable deployments** — developers can trace any running container back to the exact Git commit that produced it.

### 🛡️ 3. How are secrets protected?
- Sensitive values like `MONGO_URI` or `JWT_SECRET` are stored as GitHub Repository Secrets or environment variables and injected at runtime.
- No real credentials exist in source code files or workflow definitions.
