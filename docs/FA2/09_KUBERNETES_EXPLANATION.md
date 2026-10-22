# 09. PulseCity Kubernetes Manifests & Orchestration Guide

`[GOOD TO KNOW]`

> **Current Implementation Note**:
> Kubernetes manifests are prepared for container orchestration and deployment, while the current automatic CI pipeline publishes images to GHCR. Kubernetes deployment is maintained as an optional/manual stage.

---

## 1. Kubernetes Basics Explained Simply

### What is Kubernetes (K8s)?
Kubernetes is an open-source system that automates the deployment, scaling, and management of containerized applications across a cluster of server nodes.

### Key Concepts & Terminology

| Concept | Simple Definition | What it does in PulseCity |
|:---|:---|:---|
| **Namespace** | A virtual cluster partition. | Isolates all PulseCity resources inside `namespace.yaml` (`pulsecity`). |
| **Pod** | The smallest deployable unit in K8s (contains one or more containers). | Runs an instance of backend Node.js or frontend Nginx container. |
| **Deployment** | Manages a set of identical Pods, handling restarts, scaling, and updates. | `backend-deployment.yaml` ensures 2 backend replicas run continuously. |
| **Service** | An abstract way to expose an application running on a set of Pods. | Connects internal network traffic between frontend and backend pods. |
| **ClusterIP** | An internal-only K8s IP address. | `backend-service.yaml` exposes backend internally on port 5000. |
| **NodePort** | Exposes a Service on each Node's IP at a static port. | `frontend-service.yaml` exposes frontend to external user traffic. |
| **ConfigMap** | Stores non-confidential configuration data as key-value pairs. | `configmap.yaml` stores `PORT=5000` and environment configuration. |
| **Secret** | Stores sensitive data like passwords or tokens securely. | `secret.yaml.example` provides template for `MONGO_URI` and `JWT_SECRET`. |
| **Kustomize** | A configuration management tool built into `kubectl`. | `kustomization.yaml` dynamically replaces image tags with Git commit SHAs. |

---

## 2. Manifest File Breakdown (`/k8s`)

```
k8s/
├── namespace.yaml                # Creates 'pulsecity' namespace
├── configmap.yaml                # Stores non-secret environment variables
├── secret.yaml.example           # Template for MongoDB URI and JWT secrets
├── backend-deployment.yaml       # Backend Pods (2 Replicas, Health/Readiness Probes)
├── backend-service.yaml          # Internal ClusterIP Service (Port 5000)
├── frontend-deployment.yaml      # Frontend Pods (Nginx React Static Assets)
├── frontend-service.yaml         # External NodePort Service (Port 3000/80)
└── kustomization.yaml            # Kustomize manifest bundle & SHA tag manager
```

---

## 3. Detailed Manifest Analysis

### A. `backend-deployment.yaml`
- **Replicas**: 2 (Ensures high availability if one pod crashes).
- **Probes**:
  - **Liveness Probe**: Periodically calls `GET /health`. If it fails, K8s restarts the container.
  - **Readiness Probe**: Checks `GET /health` before sending user traffic to the pod.
- **Resource Limits**: Restricts CPU and Memory consumption to prevent pod runaway.

### B. `backend-service.yaml`
- **Type**: `ClusterIP`
- **Selector**: `app: pulsecity-backend`
- **Port Mapping**: Port 5000 mapped to container targetPort 5000.

### C. `frontend-deployment.yaml` & `frontend-service.yaml`
- Deploys Nginx pods serving React frontend static files.
- `frontend-service.yaml` maps external traffic on port 3000 to Nginx port 80 inside the container.

---

## 4. How Frontend Communicates with Backend in K8s

Inside the Kubernetes cluster:
1. Citizen sends HTTP request to `http://<Node-IP>:3000`.
2. Traffic reaches **Frontend Service** $\rightarrow$ routed to **Frontend Pod**.
3. Frontend Nginx proxies `/api/*` requests to `http://pulsecity-backend.pulsecity.svc.cluster.local:5000`.
4. **Backend Service** balances traffic across active **Backend Pods**.
5. Backend Pod queries **MongoDB Atlas** database over cloud HTTPS.
