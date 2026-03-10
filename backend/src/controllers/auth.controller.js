import User from "../models/User.model.js";
import PasswordResetToken from "../models/PasswordResetToken.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: passwordHash,
        });

        const token = generateToken(newUser);

        res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const oauthCallback = (req, res) => {
    if (!req.user) {
        console.error("OAuth Error: No user data found in request.");
        return res.redirect("/login?error=OAuthFailed");
    }

    // Pass user from passport middleware to generate token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?token=${token}`);
};



import sendEmail from "../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Email not registered" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before saving
        const hash = await bcrypt.hash(otp, 10);

        // Delete existing token/otp if any
        await PasswordResetToken.deleteMany({ userId: user._id });

        await PasswordResetToken.create({
            userId: user._id,
            token: hash,
            createdAt: Date.now(),
        });

        // Send Email
        const message = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #6d28d9;">Password Reset Request</h2>
                <p>You requested a password reset. Use the OTP below to proceed:</p>
                <h1 style="background: #f3f4f6; padding: 10px; border-radius: 5px; display: inline-block;">${otp}</h1>
                <p>This OTP is valid for 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "ShadowCanvas Password Reset OTP",
                message,
            });
            console.log(`OTP sent to ${user.email}: ${otp}`); // Log for dev/debug even with real email
            res.status(200).json({ message: "OTP sent to your email" });
        } catch (emailError) {
            console.error("Email send failed:", emailError);
            // Cleanup the token since email failed
            await PasswordResetToken.deleteMany({ userId: user._id });
            return res.status(500).json({ message: "Email could not be sent", error: emailError.message });
        }

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const resetToken = await PasswordResetToken.findOne({ userId: user._id });
        if (!resetToken) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const isValid = await bcrypt.compare(otp, resetToken.token);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        res.status(200).json({ message: "OTP Verified" });
    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordResetToken = await PasswordResetToken.findOne({ userId: user._id });
        if (!passwordResetToken) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const isValid = await bcrypt.compare(otp, passwordResetToken.token);
        if (!isValid) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(user._id, {
            $set: { password: passwordHash }
        });

        await PasswordResetToken.deleteOne({ _id: passwordResetToken._id });

        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
