import { formatDate } from './formatDate';

describe('formatDate utility', () => {
    test('formats a valid date string correctly', () => {
        const input = '2025-03-11';
        const result = formatDate(input);
        // Robust check for year, day, and month (either Mar or 03/3)
        expect(result).toMatch(/2025/);
        expect(result).toMatch(/11/);
        expect(result).toMatch(/(Mar|3|03)/);
    });

    test('returns an empty string if no date is provided', () => {
        expect(formatDate('')).toBe('');
        expect(formatDate(null)).toBe('');
    });

    test('handles invalid date strings gracefully', () => {
        const result = formatDate('invalid-date');
        expect(result).toBe('Invalid Date');
    });

    test('handles numeric timestamps', () => {
        const timestamp = 1735689600000; // 2025-01-01
        const result = formatDate(timestamp);
        expect(result).toMatch(/2025/);
        expect(result).toMatch(/(Jan|1|01)/);
    });
});
