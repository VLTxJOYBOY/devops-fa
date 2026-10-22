# PulseCity

A full-stack civic issue reporting platform that enables citizens to report, track, and resolve community problems such as road damage, garbage, broken streetlights, and other civic concerns — with real-time updates and an interactive map view.

---

## Live Demo

| Service     | URL                              |
|-------------|----------------------------------|
| Frontend    | http://13.233.33.151:3000        |
| Backend API | http://13.233.33.151:5000        |

---

## Tech Stack

### Frontend

| Technology     | Purpose                  |
|----------------|--------------------------|
| React (Vite)   | UI framework             |
| React Router   | Client-side routing      |
| Socket.IO Client | Real-time updates      |
| CSS Modules    | Component styling        |

### Backend

| Technology       | Purpose                    |
|------------------|----------------------------|
| Node.js + Express | REST API server           |
| MongoDB Atlas    | Cloud database             |
| Mongoose         | MongoDB ODM                |
| JWT              | Authentication tokens      |
| bcryptjs         | Password hashing           |
| Socket.IO        | Real-time WebSocket events |

### DevOps / Deployment

| Technology       | Purpose                                      |
|------------------|----------------------------------------------|
| Docker           | Containerization                             |
| Docker Compose   | Multi-container orchestration                |
| Terraform        | AWS infrastructure provisioning              |
| Ansible          | Automated server configuration and deployment |
| AWS EC2          | Cloud virtual machine (Ubuntu 24.04, t3.micro) |
| AWS Security Groups | Firewall and port management             |

---

## Features

- User Authentication — Register and login with JWT-based authentication
- Issue Reporting — Submit civic issues with title, category, location, and image URL
- Map View — View all reported issues on an interactive map using latitude/longitude pins
- List View — Browse all issues in a card layout with status badges
- Upvoting — Community members can upvote issues to help prioritize them
- Real-time Updates — Socket.IO pushes live notifications when issues are created or updated
- Issue Status Tracking — `Reported` > `In Progress` > `Resolved` > `Re-opened`
- Representative Tagging — Link issues to specific representatives for accountability
- Resolution Proof — Representatives can close issues with a resolution message and image

---

## Project Structure

```
PulseCity/
│
├── docker-compose.yml          # Runs backend and frontend containers together
│
├── backend/                    # Node.js REST API
│   ├── Dockerfile
│   ├── server.js               # Entry point — Express and Socket.IO setup
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth — login, register
│   │   └── issueRoutes.js      # /api/issues — CRUD and upvote
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Issue.js            # Issue schema
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   └── api/
│       └── index.js            # Serverless entry point (alternate)
│
├── frontend/                   # React application (Vite)
│   ├── Dockerfile
│   ├── src/
│   │   ├── App.jsx             # Routes and auth protection
│   │   ├── pages/
│   │   │   ├── Auth.jsx        # Login and register page
│   │   │   ├── ListView.jsx    # Issue list page
│   │   │   ├── MapView.jsx     # Map page
│   │   │   └── ReportIssue.jsx # Report new issue page
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── IssueCard.jsx
│   │   │   └── ThemeSwitcher.jsx
│   │   └── utils/
│   │       ├── api.js          # Axios API calls
│   │       └── AuthContext.jsx # Global authentication state
│   └── vite.config.js
│
├── terraform/                  # AWS infrastructure as code
│   ├── main.tf                 # EC2 instance and Security Group
│   ├── variables.tf
│   └── terraform.tfvars        # key_name = "pulsecity-key"
│
└── ansible/                    # Automated deployment
    ├── deploy.yml              # Full deployment playbook
    └── inventory               # EC2 server IP address
```

---

## Deployment Architecture

```
Local Machine
    |
    |-- Terraform -----------> AWS EC2 (Ubuntu 24.04, t3.micro, ap-south-1)
    |                               |
    |-- Ansible ------------>       |-- Docker installed
                                    |-- Code cloned from GitHub
                                    |-- .env created with MONGO_URI
                                    |-- docker compose up --build
                                              |
                                   ┌──────────┴──────────┐
                                   |                     |
                          pulsecity-backend      pulsecity-frontend
                          (Node.js : 5000)      (Nginx : 3000 -> 80)
                                   |
                                   └-----> MongoDB Atlas (Cloud)
```

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Route       | Description                     |
|--------|-------------|---------------------------------|
| POST   | `/register` | Register a new user             |
| POST   | `/login`    | Login and receive a JWT token   |

### Issues — `/api/issues`

| Method | Route          | Description                              |
|--------|----------------|------------------------------------------|
| GET    | `/`            | Retrieve all issues                      |
| POST   | `/`            | Create a new issue (authentication required) |
| PUT    | `/:id`         | Update issue status (authentication required) |
| PUT    | `/:id/upvote`  | Upvote an issue (authentication required) |

---

## Docker Configuration

### backend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### frontend/Dockerfile (Multi-stage build)

```dockerfile
# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:5000/api
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Infrastructure — Terraform

`terraform/main.tf` provisions the following AWS resources:

- **EC2 Instance** — `t3.micro`, Ubuntu 24.04, 20GB gp3 storage, `ap-south-1` (Mumbai) region
- **Security Group** — Opens inbound ports: `22` (SSH), `80` (HTTP), `3000` (Frontend), `5000` (Backend)
- **AMI** — Automatically discovers the latest Ubuntu 24.04 LTS image (no hardcoded AMI ID)

```bash
cd terraform/
terraform init
terraform apply -auto-approve

# Output:
# instance_public_ip  = "x.x.x.x"
# instance_public_dns = "ec2-x-x-x-x.ap-south-1.compute.amazonaws.com"
```

---

## Deployment — Ansible

`ansible/deploy.yml` executes the following steps on the EC2 server:

| Step | Task                                              |
|------|---------------------------------------------------|
| 1    | Update Ubuntu apt package cache                   |
| 2    | Install git, curl, ca-certificates                |
| 3    | Install docker.io and docker-compose-v2           |
| 4    | Start and enable the Docker service               |
| 5    | Add ubuntu user to the docker group               |
| 6    | Clone the repository from GitHub                  |
| 7    | Copy docker-compose.yml and Dockerfiles to server |
| 8    | Create backend `.env` file with MONGO_URI         |
| 9    | Create 2GB swap file for memory management        |
| 10   | Run `docker compose up -d --build`                |
| 11   | Display running container status                  |

```bash
cd ansible/
ANSIBLE_CONFIG=./ansible.cfg ansible-playbook -i inventory deploy.yml --extra-vars "@secrets.yml" -v
```

---

## Local Development Setup

### Prerequisites

- Node.js >= 18
- MongoDB (local instance or Atlas URI)

### Backend

```bash
cd backend/
npm install
echo "MONGO_URI=your_mongodb_uri" > .env
npm start
# Runs on http://localhost:5000
```

### Frontend

```bash
cd frontend/
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

Create `backend/.env` with the following content:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/pulsecity
```

In production, this file is created automatically by Ansible using the value stored in `ansible/secrets.yml`, which is not committed to this repository.

---

## Files Excluded from Repository

The following files exist locally but are not committed to version control for security reasons:

| File                          | Reason                              |
|-------------------------------|-------------------------------------|
| `*.pem`                       | SSH private key                     |
| `ansible/secrets.yml`         | Contains MongoDB credentials        |
| `ansible/ansible.cfg`         | Contains local machine file paths   |
| `terraform/terraform.tfstate` | Contains AWS account and resource IDs |

---

## Author

**om** — [github.com/VLTxJOYBOY](https://github.com/VLTxJOYBOY)
