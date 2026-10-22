# 06. PulseCity Docker & Containerization Guide

`[MUST KNOW]`

---

## 1. Docker Basics Explained Simply

### What is Docker?
Docker is a tool that packages an application along with all its required dependencies (Node.js runtime, Nginx web server, libraries) into a self-contained unit called a **container**.

### Key Terminology
- **Docker Image**: A read-only template containing code, libraries, and instructions (like a blueprint).
- **Docker Container**: A running instance of an image (like a building created from the blueprint).
- **Dockerfile**: A plain-text script containing step-by-step instructions to assemble a Docker image.
- **Docker Compose**: A tool to launch and connect multiple containers using a single configuration file (`docker-compose.yml`).

---

## 2. Backend Dockerfile Explanation (`backend/Dockerfile`)

```dockerfile
# 1. Base Image: Use official lightweight Node.js 20 on Alpine Linux
FROM node:20-alpine

# 2. Work Directory: Set container working directory to /app
WORKDIR /app

# 3. Copy Dependencies: Copy package manifests first for efficient caching
COPY package*.json ./

# 4. Install Dependencies: Install production npm packages only
RUN npm ci --omit=dev

# 5. Copy Application Source Code
COPY . .

# 6. Expose Port: Inform Docker that container listens on port 5000
EXPOSE 5000

# 7. Start Command: Command executed when container boots up
CMD ["node", "server.js"]
```

---

## 3. Frontend Dockerfile Explanation (`frontend/Dockerfile`)

The frontend uses a **Multi-Stage Build** to minimize container image size:

```dockerfile
# ─── STAGE 1: Build Stage ───
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compiles React code into static HTML/CSS/JS dist bundle
RUN npm run build

# ─── STAGE 2: Production Stage ───
FROM nginx:alpine
# Copy compiled static files from build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html
# Copy custom Nginx proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Why Multi-Stage Builds?
- Stage 1 uses Node.js (~180MB) to compile React code.
- Stage 2 copies ONLY the static `dist/` files into a tiny Nginx Alpine web server (~25MB).
- **Benefit**: Reduces final container image size by over 85%, improving security and deployment speed.

---

## 4. Docker Compose Explanation (`docker-compose.yml`)

`docker-compose.yml` orchestrates local execution:

```yaml
services:

  backend:
    build: ./backend
    image: ghcr.io/vltxjoyboy/pulsecity-backend:latest
    container_name: pulsecity-backend
    env_file:
      - ./backend/.env
    ports:
      - "5000:5000"
    restart: unless-stopped

  frontend:
    build: ./frontend
    image: ghcr.io/vltxjoyboy/pulsecity-frontend:latest
    container_name: pulsecity-frontend
    ports:
      - "80:80"
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### Key Compose Directives:
- `build`: Specifies source folder containing `Dockerfile`.
- `ports`: Maps host computer ports to container ports (`"3000:80"` maps host port 3000 to Nginx port 80 inside container).
- `env_file`: Injects environment variables (`MONGO_URI`, `PORT`, `JWT_SECRET`) from `./backend/.env`.
- `depends_on`: Ensures `pulsecity-backend` starts before `pulsecity-frontend`.

---

## 5. Essential Docker Commands for Viva

| Command | Action / Purpose |
|:---|:---|
| `docker compose up --build -d` | Builds images, creates containers, and starts them in detached (background) mode. |
| `docker compose ps` | Displays status of all running containers. |
| `docker compose logs --tail=100 backend` | Displays last 100 log lines from backend container. |
| `docker compose logs --tail=100 frontend` | Displays last 100 log lines from frontend container. |
| `docker compose down` | Stops and removes running containers and virtual networks. |
