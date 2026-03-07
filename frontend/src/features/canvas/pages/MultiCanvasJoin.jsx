import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
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

        try {
            const roomCode = formData.sessionId.trim().toUpperCase();
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/canvas/join',
                { roomCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                navigate(`/canvas/${roomCode}`);
            } else {
                setError(res.data.error || "Failed to join room");
            }
        } catch (err) {
            console.error("Join session error", err);
            setError(err.response?.data?.error || "Invalid Room Code or network error");
        }
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
