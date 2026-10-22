const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./testApp');
const { register, httpRequestsTotal } = require('../middleware/metrics');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Health and Metrics Endpoints', () => {

    describe('GET /health', () => {
        it('should return HTTP 200 and expected health status structure without authentication', async () => {
            const res = await request(app).get('/health');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'healthy');
            expect(res.body).toHaveProperty('service', 'pulsecity-backend');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('database', 'connected');

            // Verify no sensitive info is leaked
            expect(res.body).not.toHaveProperty('mongoUri');
            expect(res.body).not.toHaveProperty('MONGO_URI');
            expect(res.body).not.toHaveProperty('jwtSecret');
            expect(res.body).not.toHaveProperty('JWT_SECRET');
        });
    });

    describe('GET /metrics', () => {
        it('should return HTTP 200 and Prometheus text format without authentication', async () => {
            const res = await request(app).get('/metrics');

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('text/plain');
            expect(res.text).toContain('http_requests_total');
            expect(res.text).toContain('http_request_duration_seconds');
            expect(res.text).toContain('http_active_requests');
        });

        it('should increment http_requests_total metric when a normal API request is made', async () => {
            // Make a request to GET /api/issues
            await request(app).get('/api/issues');

            // Fetch /metrics
            const res = await request(app).get('/metrics');

            expect(res.statusCode).toBe(200);
            // Verify metrics response contains the route label /api/issues and GET method
            expect(res.text).toContain('http_requests_total{method="GET",route="/api/issues",status_code="200"}');
        });
    });
});
