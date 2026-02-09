
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import authService from "../../../services/authService";
import "../../../styles/auth.css";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await authService.forgotPassword(email);
            setStep(2);
            setSuccessMsg("OTP sent to your email.");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to send OTP");
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
        try {
            await authService.verifyOtp({ email, otp });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await authService.resetPassword({ email, otp, password });
            setSuccessMsg("Password reset successfully! Redirecting...");
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        }
    };

    const footerContent = (
        <>
            Remember your password? <Link to="/login" className="auth-link">Log in</Link>
        </>
    );

    return (
        <div className="auth-container auth-centered">
            <div className="auth-card-wrapper">
                <AuthCard
                    title={step === 1 ? "Reset Password" : step === 2 ? "Verify OTP" : "New Password"}
                    subtitle={step === 1 ? "Enter your email for OTP." : step === 2 ? "Enter the 6-digit code." : "Set your new password."}
                    footer={footerContent}
                >
                    {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}
                    {successMsg && <div style={{ color: "green", textAlign: "center", marginBottom: "1rem" }}>{successMsg}</div>}

                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit}>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">✉️</span>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Send OTP</button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleOtpSubmit}>
                            <div className="form-group">
                                <label className="form-label">Enter OTP</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔑</span>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        maxLength={6}
                                        style={{ letterSpacing: "0.5rem", textAlign: "center", fontSize: "1.2rem" }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Verify OTP</button>
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => setStep(1)}
                                style={{ display: "block", margin: "1rem auto 0", background: "none", border: "none", cursor: "pointer" }}
                            >
                                Change Email?
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary">Update Password</button>
                        </form>
                    )}
                </AuthCard>
            </div>
        </div>
    );
};

export default ForgotPassword;
