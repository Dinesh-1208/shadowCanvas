import mongoose from "mongoose";

const canvasAccessSchema = new mongoose.Schema({
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

  role: {
    type: String,
    enum: ["VIEW", "EDIT"],
    default: "VIEW"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

canvasAccessSchema.index({ canvasId: 1, userId: 1 }, { unique: true });

export default mongoose.model("CanvasAccess", canvasAccessSchema);
