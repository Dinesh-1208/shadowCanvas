import mongoose from 'mongoose';

const canvasEventSchema = new mongoose.Schema(
    {
        canvasId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Canvas',
            required: true,
            index: true,
        },
        userId: {
            type: String, // Kept as String to support 'single-user' or ID
            default: 'single-user',
            ref: 'User',
        },
        eventType: {
            type: String,
            required: true,
            enum: [
                'ADD_ELEMENT',
                'UPDATE_ELEMENT',
                'DELETE_ELEMENT',
                'MOVE_ELEMENT',
                'RESIZE_ELEMENT',
                'REORDER_ELEMENT',
                'CLEAR_CANVAS',
                'CHANGE_BACKGROUND',
            ],
        },
        eventData: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        eventOrder: {
            type: Number,
            required: true,
        },
    },
    {
        // Disable mongoose auto-timestamps since we manage timestamp manually
        timestamps: false,
    }
);

// Compound index for fast event replay ordered by eventOrder
canvasEventSchema.index({ canvasId: 1, eventOrder: 1 });

export default mongoose.model('CanvasEvent', canvasEventSchema);
