import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
import "../styles/auth.css";

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check for token in URL (OAuth redirect)
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        if (token) {
            localStorage.setItem("token", token);
            // Remove query param from URL for cleaner look
            window.history.replaceState({}, document.title, "/home");
        }

        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            navigate("/login");
        } else {
            // In a real app, we would verify token validity here or decode it
            setUser({ name: "User" }); // Placeholder
        }
    }, [navigate, location]);

    const handleLogout = () => {
        authService.logout();
    };

    return (
        <div className="auth-container" style={{ flexDirection: "column", textAlign: "center", color: "white" }}>
            <h1 className="auth-title">Welcome to ShadowCanvas</h1>
            <p className="auth-subtitle">You are successfully logged in.</p>

            <div className="auth-card" style={{ maxWidth: "400px", margin: "0 auto" }}>
                <p style={{ color: "#374151", marginBottom: "2rem" }}>
                    Ready to create something amazing?
                </p>
                <button onClick={handleLogout} className="btn-primary" style={{ background: "#4b5563" }}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Home;
