import request from 'supertest';
import app from '../src/index.js'; // Ensure app is exported from index.js
import mongoose from 'mongoose';

describe('Auth API', () => {
    beforeAll(async () => {
        // Connect to a test database if possible, or mock
        // For this simple setup, we might hit the real DB if not careful.
        // Ideally, we use mongodb-memory-server, but excluding it for simplicity as per instructions.
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should return 401 for protected route without token', async () => {
        const res = await request(app).get('/api/canvas/user-canvases');
        expect(res.statusCode).toEqual(401);
    });
});
