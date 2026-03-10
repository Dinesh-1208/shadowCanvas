import request from 'supertest';
import app from '../src/index.js';
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import dotenv from 'dotenv';
dotenv.config();

describe('Auth API Integration Tests', () => {
    let server;
    beforeAll(async () => {
        // Wait for connection to establish if not already
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shadowCanvas_test");
        }
        await User.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    const testUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.user).toHaveProperty('email', testUser.email);
        expect(res.body).toHaveProperty('token');
    });

    it('should not register user with existing email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(testUser);
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('should not login with invalid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('message');
    });

    it('should get current user profile with valid token', async () => {
        const loginRes = await request(app)
            .post('/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        const token = loginRes.body.token;

        const profileRes = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);
        
        expect(profileRes.statusCode).toEqual(200);
        expect(profileRes.body).toHaveProperty('email', testUser.email);
    });

    it('should deny profile access without token', async () => {
        const profileRes = await request(app).get('/auth/me');
        expect(profileRes.statusCode).toEqual(401);
        expect(profileRes.body).toHaveProperty('message');
    });
});
