import express from "express";
import passport from "passport";
import { register, login, oauthCallback, forgotPassword, resetPassword, verifyOtp, getProfile, updateProfile, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Local Auth
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", session: false }),
    oauthCallback
);

// GitHub Auth
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
    "/github/callback",
    passport.authenticate("github", { failureRedirect: "/login", session: false }),
    oauthCallback
);

// Profile
router.get("/me", protect, getProfile);
router.put("/update-profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

export default router;
