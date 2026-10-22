# 07. GitHub Actions Workflow Guide

`[MUST KNOW]`

---

## 1. What is GitHub Actions?

**GitHub Actions** is a built-in CI/CD automation tool. It runs predefined tasks inside temporary virtual machines hosted by GitHub whenever specified events occur (such as pushing code to `main`).

---

## 2. Workflow File Structure (`.github/workflows/ci.yml`)

### A. Triggers (`on:`)
```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  workflow_dispatch:
```
- `push`: Triggers automatic execution when code is pushed to `main`.
- `pull_request`: Runs tests on pull requests before merging.
- `workflow_dispatch`: Enables manual trigger button in GitHub UI.

---

### B. Security & Token Permissions (`permissions:`)
```yaml
permissions:
  contents: read
  packages: write
```
- `contents: read`: Allows cloning repository code.
- `packages: write`: Grants permission to publish Docker container images to GitHub Container Registry (GHCR).

---

### C. Active Automated Jobs

#### Job 1: `backend-test`
```yaml
  backend-test:
    name: Backend Test Suite
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: ./backend
      - run: npm test
        working-directory: ./backend
```
- Runs 18 Jest unit tests covering authentication and issue REST endpoints.

#### Job 2: `frontend-lint-and-build`
```yaml
  frontend-lint-and-build:
    name: Frontend Lint & Build
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        working-directory: ./frontend
      - run: npm run lint
        working-directory: ./frontend
      - run: npm run build
        working-directory: ./frontend
```
- Runs ESLint quality checks and compiles production Vite distribution bundle.

#### Job 3: `security-scan`
```yaml
  security-scan:
    name: Security & Vulnerability Audit
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high || true
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'HIGH,CRITICAL'
```
- Performs static security audit of npm packages and filesystem using Trivy.

#### Job 4: `docker-build-push`
```yaml
  docker-build-push:
    name: Docker Build & Push to GHCR
    needs: [backend-test, frontend-lint-and-build, security-scan]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
```
- Depends on all 3 preceding quality gates.
- Logs into GHCR using `${{ secrets.GITHUB_TOKEN }}`.
- Builds & pushes backend image: `ghcr.io/vltxjoyboy/pulsecity-backend`.
- Builds & pushes frontend image: `ghcr.io/vltxjoyboy/pulsecity-frontend`.

#### Job 5: `deploy-kubernetes` (Optional / Manual Trigger)
```yaml
  deploy-kubernetes:
    name: Continuous Deployment to Kubernetes (Manual Trigger Only)
    needs: [backend-test, frontend-lint-and-build, security-scan, docker-build-push]
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
```
- Configured as an optional manual step so the automatic push pipeline completes without requiring Kubernetes cluster credentials (`KUBE_CONFIG`).

---

## 3. Why `GITHUB_TOKEN` is Used for Authentication

- **Automatic Generation**: GitHub creates a fresh `GITHUB_TOKEN` secret for every single workflow run.
- **Short-Lived & Secure**: The token expires immediately after the job finishes.
- **Zero Secrets Leak**: Eliminates the danger of committing Personal Access Tokens (PATs) or passwords into code.
