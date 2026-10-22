# 05. PulseCity Application Code Guide

`[MUST KNOW]`

---

## 1. Application Architecture Overview

PulseCity is built as a decoupled **Client-Server Application**:

```
 ┌────────────────────────┐             ┌────────────────────────┐             ┌────────────────────────┐
 │   React Frontend SPA   │───HTTP/REST─►│ Node.js/Express Backend│───Mongoose──►│  MongoDB Atlas Cloud   │
 │   (Port 3000 / Nginx)  │  (/api/*)   │      (Port 5000)       │  (HTTPS/TLS) │  (Document Database)   │
 └────────────────────────┘             └────────────────────────┘             └────────────────────────┘
```

---

## 2. Backend Code Breakdown (`/backend`)

### A. Server Entrypoint (`backend/server.js`)
- **Purpose**: Initializes Express server, connects to database, mounts routes and observability endpoints.
- **Key Code Sections**:
  1. **Database Connection**:
     ```javascript
     mongoose.connect(process.env.MONGO_URI || '<REDACTED>')
       .then(() => console.log('MongoDB Connected'))
       .catch(err => console.error('MongoDB connection error:', err));
     ```
  2. **Health Check Endpoint (`GET /health`)**:
     ```javascript
     app.get('/health', (req, res) => {
       const isDbConnected = mongoose.connection.readyState === 1;
       res.status(200).json({
         status: 'healthy',
         service: 'pulsecity-backend',
         timestamp: new Date().toISOString(),
         database: isDbConnected ? 'connected' : 'disconnected'
       });
     });
     ```
  3. **Route Mounts**:
     - `app.use('/api/auth', authRoutes)`
     - `app.use('/api/issues', issueRoutes)`

---

### B. Metrics Middleware (`backend/middleware/metrics.js`)
- **Purpose**: Collects application observability data in Prometheus format.
- **Key Metrics Exposed (`GET /metrics`)**:
  - `http_requests_total`: Tracks request count by route and HTTP status code.
  - `http_request_duration_seconds`: Measures API response time histograms.
  - `http_active_requests`: Gauges active real-time connections.

---

### C. Data Models (`backend/models/`)
1. **`Issue.js`**: Schema for civic complaint records:
   - `title` (String): e.g., "Pothole on Main Street"
   - `description` (String): Detailed description
   - `category` (String): Waste Management, Roads, Water, Electricity
   - `status` (String): `Pending`, `In Progress`, `Resolved`
   - `location` (String): Ward / Street address
   - `createdAt` (Date): Timestamp
2. **`User.js`**: Schema for system users:
   - `username`, `email`, `password` (Hashed using bcrypt), `role` (`citizen` or `admin`).

---

## 3. Frontend Code Breakdown (`/frontend`)

### A. Technology & Build Tooling
- **React 18**: UI component framework.
- **Vite**: Ultra-fast frontend build tool replacing legacy Create-React-App.
- **Axios**: HTTP client for communicating with backend REST endpoints.

### B. Core Pages & Components (`frontend/src/`)
- `App.jsx`: Main routing setup using `react-router-dom`.
- `pages/ListView.jsx`: Fetches and displays civic issues in a card grid.
- `pages/ReportIssue.jsx`: Form component for citizens to submit a new complaint.
- `components/IssueCard.jsx`: Reusable component displaying status badges and details.

---

## 4. Database Integration (MongoDB Atlas)

- **What is MongoDB Atlas?**: A fully managed cloud database.
- **Why is it external?**: Storing database state inside Docker containers or Kubernetes pods can lead to data loss when containers restart. Connecting to Atlas ensures persistent, secure storage across deployments.
- **How connection works**: The backend reads `process.env.MONGO_URI` injected at runtime.
