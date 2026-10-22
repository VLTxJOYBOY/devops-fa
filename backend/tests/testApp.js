const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { metricsMiddleware, register } = require('../middleware/metrics');

const authRoutes = require('../routes/authRoutes');
const issueRoutes = require('../routes/issueRoutes');

const app = express();

app.use(metricsMiddleware);
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

// Mock socket.io instance
const mockIo = {
    emit: () => {}
};
app.set('io', mockIo);

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Global Error Handler matching server.js
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;

