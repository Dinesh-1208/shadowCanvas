import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import authService from "../../../services/authService";
import "../../../styles/auth.css";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            navigate("/home");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    const footerContent = (
        <>
            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </>
    );

    return (
        <div className="auth-container auth-centered">
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1 className="auth-title" style={{ fontSize: "2.5rem" }}>SHADOW CANVAS</h1>
            </div>

            <div className="auth-card-wrapper">
                <AuthCard
                    footer={footerContent}
                >
                    {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <span className="input-icon">✉️</span>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <span className="input-icon">✶</span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="secure-badge">
                            <span>✅</span> Securely hashed passwords (8+ chars recommended).
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: "1.5rem" }}>CREATE ACCOUNT →</button>


                    </form>
                </AuthCard>

                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                    <div className="feature-pill" style={{ display: "inline-flex", fontSize: "0.8rem" }}>
                        🛡️ Secure authentication using JWT
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
