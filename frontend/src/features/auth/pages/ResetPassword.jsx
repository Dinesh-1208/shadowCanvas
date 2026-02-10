import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import authService from "../../../services/authService";
import "../../../styles/auth.css";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");
    const userId = searchParams.get("id");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await authService.resetPassword({ userId, token, password });
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        }
    };

    if (success) {
        return (
            <div className="auth-container auth-centered">
                <div className="auth-card-wrapper">
                    <AuthCard title="Password Reset Successful" subtitle="Redirecting to login...">
                        <div style={{ textAlign: "center", padding: "2rem" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
                            <p>Your password has been updated.</p>
                        </div>
                    </AuthCard>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container auth-centered">
            <div className="auth-card-wrapper">
                <AuthCard
                    title="Set New Password"
                    subtitle="Please create a strong password."
                >
                    {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
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
                </AuthCard>
            </div>
        </div>
    );
};

export default ResetPassword;
