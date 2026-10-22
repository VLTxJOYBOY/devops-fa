const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../routes/authRoutes');
const issueRoutes = require('../routes/issueRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'PulseCity API is running' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'Invalid JSON payload' });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB once (cached across serverless invocations)
let isConnected = false;
async function connectDB() {
    if (isConnected) return;
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('MongoDB Connected');
}

// Serverless handler
module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
};
