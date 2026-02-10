import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import './Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, logic for authentication would go here
        console.log('Logging in with:', email, password);
        // Redirect to dashboard for now
        navigate('/dashboard');
    };

    return (
        <div className="auth-page">
            <div className="auth-card glass">
                <div className="auth-header">
                    <div className="lp-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', justifyContent: 'center', marginBottom: '32px' }}>
                        <Box size={32} />
                        SHADOWCANVAS
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Continue your creative journey</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <div className="label-row">
                            <label>Password</label>
                            <a href="#" className="forgot-link">Forgot?</a>
                        </div>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-submit">
                        Sign In <ArrowRight size={18} />
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button type="button" className="auth-social">
                        <Github size={18} /> Continue with GitHub
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <span onClick={() => navigate('/signup')} className="auth-link">Sign Up</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
