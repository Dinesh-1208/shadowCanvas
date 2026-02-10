import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Mail, Lock, User, ArrowRight, Github } from 'lucide-react';
import './Auth.css';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Signing up with:', name, email, password);
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
                    <h1>Create Account</h1>
                    <p>Start co-creating with AI today</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                        <label>Password</label>
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
                        Create Account <ArrowRight size={18} />
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <button type="button" className="auth-social">
                        <Github size={18} /> Sign up with GitHub
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <span onClick={() => navigate('/login')} className="auth-link">Login</span>
                </p>
            </div>
        </div>
    );
};

export default Signup;
