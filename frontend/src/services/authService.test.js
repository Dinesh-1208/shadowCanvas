import axios from 'axios';
import authService from './authService';

jest.mock('axios');

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('login sets token in localStorage', async () => {
        const mockResponse = { data: { token: 'test-token', user: { id: '1' } } };
        axios.post.mockResolvedValue(mockResponse);

        const result = await authService.login({ email: 'test@example.com', password: 'password' });

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/auth/login'),
            { email: 'test@example.com', password: 'password' }
        );
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(result.user.id).toBe('1');
    });

    test('logout removes token', () => {
        localStorage.setItem('token', 'old-token');
        authService.logout();
        expect(localStorage.getItem('token')).toBeNull();
    });

    test('getProfile sends auth header', async () => {
        localStorage.setItem('token', 'valid-token');
        axios.get.mockResolvedValue({ data: { name: 'Test User' } });

        const profile = await authService.getProfile();

        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/auth/me'),
            { headers: { Authorization: 'Bearer valid-token' } }
        );
        expect(profile.name).toBe('Test User');
    });

    test('getProfile returns null if no token is present', async () => {
        const profile = await authService.getProfile();
        expect(profile).toBeNull();
        expect(axios.get).not.toHaveBeenCalled();
    });
});
