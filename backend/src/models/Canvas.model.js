import mongoose from "mongoose";

const canvasSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Canvas", canvasSchema);
