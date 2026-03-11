import { jest } from '@jest/globals';

// Setup Mock for nodemailer
const mockSendMail = jest.fn().mockResolvedValue(true);
jest.unstable_mockModule('nodemailer', () => ({
    default: {
        createTransport: jest.fn().mockReturnValue({
            sendMail: mockSendMail,
        })
    }
}));

const { default: sendEmail } = await import('../src/utils/sendEmail.js');
const { default: nodemailer } = await import('nodemailer');

describe('utils/sendEmail', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'password123';
    });

    it('should send email with correct options', async () => {
        const options = {
            email: 'user@example.com',
            subject: 'Test Subject',
            message: '<p>Test Message</p>'
        };

        await sendEmail(options);

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            service: 'gmail',
            auth: { user: 'test@example.com', pass: 'password123' },
        });

        expect(mockSendMail).toHaveBeenCalledWith({
            from: 'test@example.com',
            to: 'user@example.com',
            subject: 'Test Subject',
            html: '<p>Test Message</p>',
        });
    });
});
