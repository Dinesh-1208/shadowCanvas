import mongoose from 'mongoose';

const canvasSchema = new mongoose.Schema(
    {
        ownerId: {
            // Modified to Mixed to allow 'single-user' string for prototype AND ObjectId for auth
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: 'single-user',
            ref: 'User',
        },
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'Untitled Canvas',
        },
        thumbnail: {
            type: String, // Base64 data URL
            default: '',
        },
        roomCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        editors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        viewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        shareLinks: [{
            token: { type: String, required: true },
            role: { type: String, enum: ['view', 'edit'], required: true },
            createdAt: { type: Date, default: Date.now }
        }],
        editRequests: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            createdAt: { type: Date, default: Date.now }
        }]
    },
    {
        timestamps: true, // auto createdAt, updatedAt
    }
);

export default mongoose.model('Canvas', canvasSchema);
