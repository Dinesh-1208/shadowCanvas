import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/utils/sendEmail.js', () => ({
    default: jest.fn().mockResolvedValue(true)
}));

const { forgotPassword, updateProfile, changePassword } = await import('../src/controllers/auth.controller.js');
const { default: User } = await import('../src/models/User.model.js');
const { default: PasswordResetToken } = await import('../src/models/PasswordResetToken.model.js');
const { default: bcrypt } = await import('bcryptjs');

describe('Auth Controller Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, user: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        jest.spyOn(User, 'findOne');
        jest.spyOn(User, 'findById');
        jest.spyOn(PasswordResetToken, 'deleteMany');
        jest.spyOn(PasswordResetToken, 'create');
        jest.spyOn(bcrypt, 'hash');
        jest.spyOn(bcrypt, 'compare');
        jest.spyOn(bcrypt, 'genSalt');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('forgotPassword', () => {
        it('should return 404 if email not registered', async () => {
            req.body.email = 'nonexistent@example.com';
            User.findOne.mockResolvedValue(null);

            await forgotPassword(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "Email not registered" });
        });

        it('should execute successfully if user exists', async () => {
            req.body.email = 'user@example.com';
            const mockUser = { _id: '12345', email: 'user@example.com' };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.hash.mockResolvedValue('hashed_otp');
            PasswordResetToken.deleteMany.mockResolvedValue();
            PasswordResetToken.create.mockResolvedValue();

            await forgotPassword(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'user@example.com' });
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateProfile', () => {
        it('should update user profile fields', async () => {
            req.user._id = '12345';
            req.body = { name: 'New Name', bio: 'New Bio' };

            const mockUser = {
                _id: '12345',
                name: 'Old Name',
                bio: 'Old Bio',
                save: jest.fn().mockResolvedValue({
                    _id: '12345',
                    name: 'New Name',
                    bio: 'New Bio',
                    toObject: () => ({ _id: '12345', name: 'New Name', bio: 'New Bio' })
                })
            };

            User.findById.mockResolvedValue(mockUser);

            await updateProfile(req, res);

            expect(mockUser.name).toBe('New Name');
            expect(mockUser.bio).toBe('New Bio');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ _id: '12345', name: 'New Name', bio: 'New Bio' });
        });

        it('should return 404 if user not found for updateProfile', async () => {
            req.user._id = '12345';
            User.findById.mockResolvedValue(null);

            await updateProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
        });
    });

    describe('changePassword', () => {
        it('should perfectly update if current passwords match', async () => {
            req.user._id = '12345';
            req.body = { currentPassword: 'oldpassword', newPassword: 'newpassword' };

            const mockUser = {
                _id: '12345',
                password: 'hashed_oldpassword',
                save: jest.fn().mockResolvedValue()
            };

            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashed_newpassword');

            await changePassword(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith('oldpassword', 'hashed_oldpassword');
            expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 'salt');
            expect(mockUser.password).toBe('hashed_newpassword');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: "Password updated successfully" });
        });

        it('should return 400 if current passwords mismatch', async () => {
            req.user._id = '12345';
            req.body = { currentPassword: 'wrongpassword', newPassword: 'newpassword' };

            const mockUser = {
                _id: '12345',
                password: 'hashed_oldpassword',
                save: jest.fn().mockResolvedValue()
            };

            User.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            await changePassword(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Current password is incorrect" });
        });
    });
});
