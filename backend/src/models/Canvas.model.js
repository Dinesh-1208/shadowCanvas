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
        roomCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
    },
    {
        timestamps: true, // auto createdAt, updatedAt
    }
);

export default mongoose.model('Canvas', canvasSchema);
