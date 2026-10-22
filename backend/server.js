const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { metricsMiddleware, register } = require('./middleware/metrics');
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for simplicity in dev
        methods: ["GET", "POST", "PUT"]
    }
});

// Metrics Middleware
app.use(metricsMiddleware);

// Core Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    const dbStatus = dbStatusMap[dbState] || 'unknown';
    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'pulsecity-backend',
        timestamp: new Date().toISOString(),
        database: dbStatus
    });
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.setHeader('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Share io instance with routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Database & Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        server.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

