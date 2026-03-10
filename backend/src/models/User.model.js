import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  bio: {
    type: String,
    default: ""
  },

  profilePicture: {
    type: String,
    default: ""
  },

  location: {
    type: String,
    default: ""
  },

  socialLinks: {
    github: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" }
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);
