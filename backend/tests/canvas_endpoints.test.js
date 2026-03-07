import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import Canvas from '../src/models/Canvas.model.js';
import User from '../src/models/User.model.js';
import CanvasAccess from '../src/models/CanvasAccess.model.js';

describe('Canvas Endpoints', () => {
    let token;
    let userId;
    let roomCode;

    beforeAll(async () => {
        // Clear collections for clean test
        try {
            if (mongoose.connection.readyState === 1) {
                await User.deleteMany({});
                await Canvas.deleteMany({});
                await CanvasAccess.deleteMany({});
            }
        } catch (e) {
            console.warn('Could not clear database during beforeAll. MongoDB might be offline.');
        }

        // Register a test user
        const regRes = await request(app)
            .post('/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

        if (regRes.body.success) {
            token = regRes.body.token;
            userId = regRes.body.user.id;
        } else {
            // Try login if register failed (e.g. user exists)
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            token = loginRes.body.token;
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('POST /api/canvas/create', () => {
        it('should create a canvas and auto-generate a room code', async () => {
            const res = await request(app)
                .post('/api/canvas/create')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Test Canvas'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.success).toBe(true);
            expect(res.body.canvas.title).toBe('Test Canvas');
            expect(res.body.canvas.roomCode).toBeDefined();
            expect(res.body.canvas.roomCode.length).toBe(6);
            roomCode = res.body.canvas.roomCode;
        });

        it('should return existing canvas if room code already exists', async () => {
            const res = await request(app)
                .post('/api/canvas/create')
                .send({
                    title: 'Duplicate Canvas',
                    roomCode: roomCode
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('already exists');
            expect(res.body.canvas.roomCode).toBe(roomCode);
        });
    });

    describe('POST /api/canvas/join', () => {
        it('should allow a user to join a canvas with a room code', async () => {
            // Create a second user to join
            const user2Res = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Joiner User',
                    email: 'joiner@example.com',
                    password: 'password123'
                });

            const joinerToken = user2Res.body.token;

            const res = await request(app)
                .post('/api/canvas/join')
                .set('Authorization', `Bearer ${joinerToken}`)
                .send({
                    roomCode: roomCode
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Successfully joined canvas');
            expect(res.body.canvas.roomCode).toBe(roomCode);

            // Verify access in DB
            const access = await CanvasAccess.findOne({
                canvasId: res.body.canvas._id,
                userId: user2Res.body.user.id
            });
            expect(access).toBeDefined();
            expect(access.role).toBe('VIEW');
        });

        it('should return 404 for invalid room code', async () => {
            const res = await request(app)
                .post('/api/canvas/join')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    roomCode: 'INVALID'
                });

            expect(res.statusCode).toEqual(404);
            expect(res.body.success).toBe(false);
        });

        it('should return error if room code is missing', async () => {
            const res = await request(app)
                .post('/api/canvas/join')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toEqual(400);
        });
    });
});
