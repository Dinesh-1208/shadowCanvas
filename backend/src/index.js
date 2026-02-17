import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import authRoutes from "./routes/auth.routes.js";
import "./config/passport.js"; // Import passport config to load strategies

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
  credentials: true
}));
app.use(passport.initialize());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shadowCanvas", {
    // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+ but harmless if included, omitting for cleanliness
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("ShadowCanvas Backend is running");
});

import { createServer } from "http";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
