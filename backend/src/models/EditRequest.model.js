import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema({
    canvasId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Canvas",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING"
    },
    nextAllowedRequestAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

editRequestSchema.index({ canvasId: 1, userId: 1 }, { unique: true });

export default mongoose.model("EditRequest", editRequestSchema);
