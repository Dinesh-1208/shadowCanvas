import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthCard from "../../auth/components/AuthCard";
import "../../../styles/auth.css";

const MultiCanvasInitialization = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        sessionName: "",
        maxParticipants: 5,
        isPrivate: false,
        password: ""
    });

    const handleChange = (e) => {
        const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Generate a random 6-character alphanumeric room code
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // In a real app, we would make an API call to create the session here.
        // For now, we'll navigate directly to the canvas page with the room code.
        navigate(`/canvas/${roomCode}`, { state: { sessionConfig: { ...formData, roomCode } } });
    };

    return (
        <div className="auth-container auth-centered">
            <div className="auth-card-wrapper" style={{ maxWidth: "500px" }}>
                <AuthCard
                    title="Start Collaboration"
                    subtitle="Set up your shared canvas session."
                >
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Session Name</label>
                            <div className="input-wrapper">
                                <span className="input-icon">🏷️</span>
                                <input
                                    type="text"
                                    name="sessionName"
                                    className="form-input"
                                    placeholder="e.g., Team Brainstorming"
                                    value={formData.sessionName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Max Participants</label>
                            <div className="input-wrapper">
                                <span className="input-icon">👥</span>
                                <select
                                    name="maxParticipants"
                                    className="form-input"
                                    value={formData.maxParticipants}
                                    onChange={handleChange}
                                >
                                    {[2, 3, 4, 5, 10, 15, 20].map(num => (
                                        <option key={num} value={num}>{num} People</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-options">
                                <div className="remember-me">
                                    <input
                                        type="checkbox"
                                        name="isPrivate"
                                        checked={formData.isPrivate}
                                        onChange={handleChange}
                                    />
                                    Private Session (Password Protected)
                                </div>
                            </label>

                            {formData.isPrivate && (
                                <div className="input-wrapper animate-in fade-in slide-in-from-top-2 duration-200">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="Set a session password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={formData.isPrivate}
                                    />
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-primary">
                            Create Session
                        </button>

                        <div className="auth-footer">
                            <Link to="/" className="auth-link" style={{ marginLeft: 0 }}>
                                ← Back to Home
                            </Link>
                        </div>
                    </form>
                </AuthCard>
            </div>
        </div>
    );
};

export default MultiCanvasInitialization;
