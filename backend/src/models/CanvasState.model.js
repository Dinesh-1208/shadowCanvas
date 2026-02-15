import mongoose from 'mongoose';

const CanvasStateSchema = new mongoose.Schema({
    canvasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canvas', required: true },
    elements: { type: Array, default: [] }, // The full list of elements at this snapshot
    backgroundColor: { type: String, default: '#fafafa' }, // Background color at this snapshot
    lastEventOrder: { type: Number, required: true }, // The eventOrder corresponding to this state
    createdAt: { type: Date, default: Date.now },
});

// Create compound index for efficient querying
CanvasStateSchema.index({ canvasId: 1, lastEventOrder: -1 });

export default mongoose.model('CanvasState', CanvasStateSchema);
