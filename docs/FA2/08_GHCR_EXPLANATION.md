# 08. GitHub Container Registry (GHCR) Guide

`[MUST KNOW]`

---

## 1. What is GHCR?

**GitHub Container Registry (GHCR)** is a private and public container registry service provided directly by GitHub (`ghcr.io`). It allows developers and CI/CD systems to store, version, and share compiled Docker container images alongside source code repositories.

---

## 2. Why Do We Use GHCR in PulseCity?

1. **Seamless Integration**: Authenticates natively with GitHub Actions using the automatic `GITHUB_TOKEN`.
2. **Centralized Package Storage**: Keeps source code and container images within the same GitHub organization (`AshVortex404`).
3. **Immutability & Version Control**: Stores every built version tagged with the exact Git commit SHA.

---

## 3. PulseCity GHCR Package Specifications

Our project publishes two container image packages:

| Service | GHCR Package URL | Description |
|:---|:---|:---|
| **Backend REST API** | `ghcr.io/vltxjoyboy/pulsecity-backend` | Containerized Express server runtime. |
| **Frontend Web App** | `ghcr.io/vltxjoyboy/pulsecity-frontend` | Containerized static Nginx web server. |

---

## 4. Image Tagging Strategy Explained

Whenever the pipeline builds Docker images, it applies **two distinct tags** to each image:

1. **`:latest` Tag**:
   - **Example**: `ghcr.io/vltxjoyboy/pulsecity-backend:latest`
   - **Purpose**: Points to the most recently built production image on the `main` branch.
   - **Use Case**: Allows local developers or deployment scripts to pull the current release quickly.

2. **`:<git-commit-sha>` Tag**:
   - **Example**: `ghcr.io/vltxjoyboy/pulsecity-backend:9a7a11353f3b38b6ab00ac8c1ef16b2dcde07555`
   - **Purpose**: A unique, immutable tag tied to the specific Git commit hash that triggered the build.
   - **Use Case**: Enables rollbacks, version auditing, and prevents caching bugs in Kubernetes deployments.

---

## 5. End-to-End Image Delivery Flow

```
[ Developer Push ]
       │
       ▼
[ GitHub Actions Pipeline ]
       │
       ├─► 1. Authenticate with GHCR via docker/login-action@v3
       │      username: ${{ github.actor }}
       │      password: ${{ secrets.GITHUB_TOKEN }}
       │
       ├─► 2. Build Docker Images (Backend & Frontend)
       │
       └─► 3. Push Tags to ghcr.io:
              - ghcr.io/vltxjoyboy/pulsecity-backend:latest
              - ghcr.io/vltxjoyboy/pulsecity-backend:<git-sha>
              - ghcr.io/vltxjoyboy/pulsecity-frontend:latest
              - ghcr.io/vltxjoyboy/pulsecity-frontend:<git-sha>
```
