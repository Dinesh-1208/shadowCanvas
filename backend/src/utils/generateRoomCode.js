/**
 * Generates a random short alphanumeric room code.
 * @param {number} length - Length of the code (default 6)
 * @returns {string} - Generated room code
 */
export const generateRoomCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
