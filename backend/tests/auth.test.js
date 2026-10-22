const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./testApp');
const User = require('../models/User');

process.env.JWT_SECRET = 'test_secret_key_12345';

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

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Auth API Routes', () => {

    describe('POST /api/auth/register', () => {
        it('should register a new citizen user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testcitizen',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('message', 'User created successfully');

            const userInDb = await User.findOne({ username: 'testcitizen' });
            expect(userInDb).not.toBeNull();
            expect(userInDb.role).toBe('citizen');
        });

        it('should return 400 when registering a duplicate username', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'duplicateuser',
                    password: 'password123'
                });

            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'duplicateuser',
                    password: 'differentpassword'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'User already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'validuser',
                    password: 'correctpassword'
                });
        });

        it('should log in successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'validuser',
                    password: 'correctpassword'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('role', 'citizen');
            expect(res.body).toHaveProperty('userId');
        });

        it('should return 400 for invalid password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'validuser',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'Invalid credentials');
        });

        it('should return 400 for non-existent user', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistentuser',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('GET /api/auth/representatives', () => {
        it('should fetch list of representative users', async () => {
            await User.create([
                { username: 'rep1', password: 'hashpassword', role: 'representative', designation: 'Corporator', area: 'Ward 1' },
                { username: 'citizen1', password: 'hashpassword', role: 'citizen' }
            ]);

            const res = await request(app).get('/api/auth/representatives');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('username', 'rep1');
            expect(res.body[0]).toHaveProperty('designation', 'Corporator');
            expect(res.body[0]).toHaveProperty('area', 'Ward 1');
        });
    });
});
