import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import Canvas from '../src/models/Canvas.model.js';
import User from '../src/models/User.model.js';

describe('Share Link System', () => {
    let ownerToken;
    let otherToken;
    let canvasId;
    let shareToken;

    beforeAll(async () => {
        // Wait for mongoose to connect
        while (mongoose.connection.readyState !== 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Cleanup and Setup
        try {
            await User.deleteMany({});
            await Canvas.deleteMany({});
        } catch (e) { }

        // Create owner
        const ownerRes = await request(app)
            .post('/auth/register')
            .send({ name: 'Owner', email: 'owner@test.com', password: 'password123' });
        ownerToken = ownerRes.body.token;

        // Create other user
        const otherRes = await request(app)
            .post('/auth/register')
            .send({ name: 'Joiner', email: 'joiner@test.com', password: 'password123' });
        otherToken = otherRes.body.token;

        // Create canvas
        const canvasRes = await request(app)
            .post('/api/canvas/create')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ title: 'Share Test Canvas' });
        canvasId = canvasRes.body.canvas._id;
    }, 20000);

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should generate an edit share link', async () => {
        const res = await request(app)
            .post('/api/canvas/generate-share-link')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ canvasId, role: 'edit' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.shareLink).toContain('/canvas/shared/');
        shareToken = res.body.token;
    });

    it('should allow another user to join as an editor via token', async () => {
        const res = await request(app)
            .get(`/api/canvas/shared/${shareToken}`)
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('edit access');

        // Verify in DB
        const canvas = await Canvas.findById(canvasId);
        expect(canvas.editors.length).toBe(1);
    });

    it('should return 404 for invalid token', async () => {
        const res = await request(app)
            .get('/api/canvas/shared/invalidtoken')
            .set('Authorization', `Bearer ${otherToken}`);

        expect(res.statusCode).toBe(404);
    });
});
