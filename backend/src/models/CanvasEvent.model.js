import mongoose from "mongoose";

const canvasEventSchema = new mongoose.Schema({
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

  type: {
    type: String,
    enum: ["DRAW", "ERASE", "MOVE", "TEXT", "SHAPE", "UNDO", "REDO"],
    required: true
  },

  payload: {
    type: Object,
    required: true
  },

  version: {
    type: Number,
    required: true
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

canvasEventSchema.index({ canvasId: 1, version: 1 });

export default mongoose.model("CanvasEvent", canvasEventSchema);
