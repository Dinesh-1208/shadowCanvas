import axios from 'axios';
import { createCanvas, getUserCanvases, deleteCanvas } from './api';

// Mock axios
jest.mock('axios');

describe('API Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    test('getAuthHeaders uses token from localStorage', async () => {
        localStorage.setItem('token', 'test-token');
        axios.get.mockResolvedValue({ data: [] });

        await getUserCanvases();

        expect(axios.get).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: { Authorization: 'Bearer test-token' }
            })
        );
    });

    test('createCanvas sends correct data', async () => {
        axios.post.mockResolvedValue({ data: { id: '123' } });

        const result = await createCanvas('Test Title', 'ROOM123');

        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/create'),
            { title: 'Test Title', roomCode: 'ROOM123' },
            expect.any(Object)
        );
        expect(result.id).toBe('123');
    });

    test('getUserCanvases returns data from server', async () => {
        const mockData = [{ id: '1', title: 'Canvas 1' }];
        axios.get.mockResolvedValue({ data: mockData });

        const result = await getUserCanvases();

        expect(result).toEqual(mockData);
    });

    test('deleteCanvas uses correct ID in URL', async () => {
        axios.delete.mockResolvedValue({ data: { success: true } });

        await deleteCanvas('canvas-abc');

        expect(axios.delete).toHaveBeenCalledWith(
            expect.stringContaining('/canvas-abc'),
            expect.any(Object)
        );
    });
});
