import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthCard from "../../auth/components/AuthCard";
import "../../../styles/auth.css";

const MultiCanvasJoin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        sessionId: "",
        password: ""
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // TODO: Backend Verification Logic
        // 1. Send POST request to /api/sessions/join with { sessionId, password }
        // 2. If valid, backend returns session details and token
        // 3. If invalid, set error message

        console.log("Verifying session credentials...", formData);

        // Mock verification for UI demo
        if (formData.sessionId.length < 3) {
            setError("Invalid Session ID");
            return;
        }

        // Navigate to canvas on "success"
        navigate("/canvas", {
            state: {
                sessionConfig: {
                    sessionName: `Session ${formData.sessionId}`, // Mock name
                    isJoin: true,
                    sessionId: formData.sessionId,
                    password: formData.password
                }
            }
        });
    };

    return (
        <div className="auth-container auth-centered">
            <div className="auth-card-wrapper" style={{ maxWidth: "450px" }}>
                <AuthCard
                    title="Join Session"
                    subtitle="Enter the session details shared with you."
                >
                    <form onSubmit={handleSubmit}>
                        {error && <div style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Session ID / Code</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔑</span>
                                <input
                                    type="text"
                                    name="sessionId"
                                    className="form-input"
                                    placeholder="e.g., room-123"
                                    value={formData.sessionId}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password (Optional)</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="If required"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary">
                            Enter Canvas
                        </button>

                        <div className="auth-footer">
                            <Link to="/multi-canvas-lobby" className="auth-link" style={{ marginLeft: 0 }}>
                                ← Back to Lobby
                            </Link>
                        </div>
                    </form>
                </AuthCard>
            </div>
        </div>
    );
};

export default MultiCanvasJoin;
