const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./testApp');
const User = require('../models/User');
const Issue = require('../models/Issue');

process.env.JWT_SECRET = 'test_secret_key_12345';

let mongoServer;
let citizenToken, citizenId;
let repToken, repId;
let otherRepToken, otherRepId;

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
    await Issue.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    const citizen = await User.create({
        username: 'testcitizen',
        password: hashedPassword,
        role: 'citizen'
    });
    citizenId = citizen._id.toString();
    citizenToken = jwt.sign({ id: citizenId, role: citizen.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const rep = await User.create({
        username: 'rep_ward1',
        password: hashedPassword,
        role: 'representative',
        designation: 'Corporator',
        area: 'Ward 1'
    });
    repId = rep._id.toString();
    repToken = jwt.sign({ id: repId, role: rep.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const otherRep = await User.create({
        username: 'rep_ward2',
        password: hashedPassword,
        role: 'representative',
        designation: 'Corporator',
        area: 'Ward 2'
    });
    otherRepId = otherRep._id.toString();
    otherRepToken = jwt.sign({ id: otherRepId, role: otherRep.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
});

describe('Issue API Routes', () => {

    describe('GET /api/issues', () => {
        it('should return a list of all issues without authentication', async () => {
            await Issue.create({
                title: 'Pothole on Main St',
                description: 'Deep pothole causing traffic issues',
                category: 'Road',
                location: { lat: 19.9975, lng: 73.7898 },
                status: 'Reported',
                taggedRepresentative: repId
            });

            const res = await request(app).get('/api/issues');

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0]).toHaveProperty('title', 'Pothole on Main St');
            expect(res.body[0].taggedRepresentative).toHaveProperty('username', 'rep_ward1');
        });
    });

    describe('POST /api/issues', () => {
        it('should create an issue when user is authenticated', async () => {
            const issueData = {
                title: 'Broken Streetlight',
                description: 'Streetlight out near corner',
                category: 'Light',
                lat: 19.99,
                lng: 73.78,
                imageUrl: 'http://example.com/light.jpg',
                taggedRepresentative: repId
            };

            const res = await request(app)
                .post('/api/issues')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send(issueData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'Broken Streetlight');
            expect(res.body).toHaveProperty('status', 'Reported');

            const issueInDb = await Issue.findById(res.body._id);
            expect(issueInDb).not.toBeNull();
            expect(issueInDb.category).toBe('Light');
        });

        it('should return 401 when request is unauthorized (no token)', async () => {
            const issueData = {
                title: 'Unauthenticated issue',
                description: 'No token provided',
                category: 'Garbage',
                lat: 19.99,
                lng: 73.78
            };

            const res = await request(app)
                .post('/api/issues')
                .send(issueData);

            expect(res.statusCode).toBe(401);
            expect(res.body).toHaveProperty('message', 'No token, authorization denied');
        });
    });

    describe('PUT /api/issues/:id/status', () => {
        let issue;

        beforeEach(async () => {
            issue = await Issue.create({
                title: 'Garbage overflow',
                description: 'Trash bin overflowing',
                category: 'Garbage',
                location: { lat: 19.99, lng: 73.78 },
                status: 'Reported',
                taggedRepresentative: repId
            });
        });

        it('should allow the tagged representative to update status and resolution', async () => {
            const res = await request(app)
                .put(`/api/issues/${issue._id}/status`)
                .set('Authorization', `Bearer ${repToken}`)
                .send({
                    status: 'Resolved',
                    message: 'Trash cleaned up',
                    imageUrl: 'http://example.com/clean.jpg'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'Resolved');
            expect(res.body.resolution).toHaveProperty('message', 'Trash cleaned up');

            const updatedInDb = await Issue.findById(issue._id);
            expect(updatedInDb.status).toBe('Resolved');
        });

        it('should return 403 if a different representative tries to update status', async () => {
            const res = await request(app)
                .put(`/api/issues/${issue._id}/status`)
                .set('Authorization', `Bearer ${otherRepToken}`)
                .send({
                    status: 'Resolved',
                    message: 'Unauthorized resolution'
                });

            expect(res.statusCode).toBe(403);
            expect(res.body).toHaveProperty('message', 'Not authorized: You are not the tagged representative');
        });
    });

    describe('PUT /api/issues/:id/upvote', () => {
        let issue;

        beforeEach(async () => {
            issue = await Issue.create({
                title: 'Water pipe leak',
                description: 'Water leaking on road',
                category: 'Water',
                location: { lat: 19.99, lng: 73.78 },
                status: 'Reported',
                taggedRepresentative: repId
            });
        });

        it('should allow an authenticated user to upvote an issue', async () => {
            const res = await request(app)
                .put(`/api/issues/${issue._id}/upvote`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.upvotes).toContain(citizenId);
        });

        it('should return 400 if user tries to upvote the same issue twice', async () => {
            // First upvote
            await request(app)
                .put(`/api/issues/${issue._id}/upvote`)
                .set('Authorization', `Bearer ${citizenToken}`);

            // Second upvote
            const res = await request(app)
                .put(`/api/issues/${issue._id}/upvote`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'Already upvoted');
        });
    });

    describe('PUT /api/issues/:id/reopen', () => {
        let resolvedIssue, reportedIssue;

        beforeEach(async () => {
            resolvedIssue = await Issue.create({
                title: 'Fixed drainage',
                description: 'Drain cleared',
                category: 'Drainage',
                location: { lat: 19.99, lng: 73.78 },
                status: 'Resolved',
                taggedRepresentative: repId
            });

            reportedIssue = await Issue.create({
                title: 'Open manhole',
                description: 'Manhole missing cover',
                category: 'Drainage',
                location: { lat: 19.99, lng: 73.78 },
                status: 'Reported',
                taggedRepresentative: repId
            });
        });

        it('should allow authenticated user to reopen a resolved issue', async () => {
            const res = await request(app)
                .put(`/api/issues/${resolvedIssue._id}/reopen`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'Re-opened');

            const issueInDb = await Issue.findById(resolvedIssue._id);
            expect(issueInDb.status).toBe('Re-opened');
        });

        it('should return 400 if user tries to reopen an issue that is not resolved', async () => {
            const res = await request(app)
                .put(`/api/issues/${reportedIssue._id}/reopen`)
                .set('Authorization', `Bearer ${citizenToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'Only resolved issues can be re-opened');
        });
    });
});
