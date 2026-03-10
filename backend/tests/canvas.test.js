import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import Canvas from '../src/models/Canvas.model.js';
import CanvasState from '../src/models/CanvasState.model.js';
import CanvasEvent from '../src/models/CanvasEvent.model.js';

describe('Canvas API Integration Tests', () => {
    let token = '';
    let testUserId = '';

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shadowCanvas_test");
        }
        // Clean test DB
        await User.deleteMany({});
        await Canvas.deleteMany({});
        await CanvasState.deleteMany({});
        await CanvasEvent.deleteMany({});

        // Create test user and get token
        const res = await request(app)
            .post('/auth/register')
            .send({
                name: 'Canvas Tester',
                email: 'canvastester@example.com',
                password: 'password123'
            });
        
        token = res.body.token;
        testUserId = res.body.user._id;
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Canvas.deleteMany({});
        await CanvasState.deleteMany({});
        await CanvasEvent.deleteMany({});
        await mongoose.connection.close();
    });

    let canvasId = '';
    const roomCode = 'TESTROOM';

    it('should create a new canvas when authenticated', async () => {
        const res = await request(app)
            .post('/api/canvas/create')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Canvas',
                roomCode: roomCode
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.canvas).toHaveProperty('roomCode', roomCode);
        canvasId = res.body.canvas._id;
    });

    it('should not create a canvas without roomCode', async () => {
        const res = await request(app)
            .post('/api/canvas/create')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Test Canvas'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
    });

    it('should return user canvases', async () => {
        const res = await request(app)
            .get('/api/canvas/user-canvases')
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.canvases)).toBe(true);
        expect(res.body.canvases.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 401 for user canvases without token', async () => {
        const res = await request(app).get('/api/canvas/user-canvases');
        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty('message');
    });

    it('should save a canvas snapshot', async () => {
        const res = await request(app)
            .post('/api/canvas/snapshot')
            .send({
                canvasId: canvasId,
                elements: [{ type: 'rectangle', x: 10, y: 10, width: 100, height: 100 }],
                lastEventOrder: 1
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
    });

    it('should get canvas by room code', async () => {
        const res = await request(app).get(`/api/canvas/room/${roomCode}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.canvas).toHaveProperty('roomCode', roomCode);
    });

    it('should delete canvas if user is owner', async () => {
        const res = await request(app)
            .delete(`/api/canvas/${canvasId}`)
            .set('Authorization', `Bearer ${token}`);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
    });
});
