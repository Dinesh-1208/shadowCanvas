import { protect } from '../src/middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.model.js';
import { jest } from '@jest/globals';

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.spyOn(jwt, 'verify');
        jest.spyOn(User, 'findById');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call next if token is valid', async () => {
        req.headers.authorization = 'Bearer validtoken123';
        const decoded = { userId: '12345' };
        jwt.verify.mockReturnValue(decoded);

        const mockUser = { _id: '12345', name: 'Test' };
        const mockSelect = jest.fn().mockResolvedValue(mockUser);
        User.findById.mockReturnValue({ select: mockSelect });

        await protect(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith('validtoken123', process.env.JWT_SECRET);
        expect(User.findById).toHaveBeenCalledWith('12345');
        expect(req.user).toEqual(mockUser);
        expect(next).toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
        req.headers.authorization = 'Bearer invalidtoken123';
        jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    });
});
