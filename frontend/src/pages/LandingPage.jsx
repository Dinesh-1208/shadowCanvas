import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    ArrowRight,
    Play,
    Layers,
    Zap,
    Shield,
    Maximize,
    MousePointer2,
    Box,
    Fingerprint,
    Key,
    FileSearch,
    Database,
    Twitter,
    Instagram,
    Linkedin,
    Github
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const fadeInUp = {
        hidden: { y: 40, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
        }
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <motion.nav
                className="lp-navbar"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="lp-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <Box size={32} />
                    SHADOWCANVAS
                </div>
                <div className="lp-nav-links">
                    <motion.a whileHover={{ scale: 1.05 }} href="#features">Features</motion.a>
                    <motion.a whileHover={{ scale: 1.05 }} href="#how-it-works">How it Works</motion.a>
                    <motion.a whileHover={{ scale: 1.05 }} href="#security">Security</motion.a>
                    <motion.a whileHover={{ scale: 1.05 }} href="#stats">Stats</motion.a>
                </div>
                <div className="lp-nav-actions">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="lp-btn-login"
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        className="lp-btn-start"
                        onClick={() => navigate('/signup')}
                    >
                        Get Started <ArrowRight size={18} />
                    </motion.button>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="lp-hero">
                <motion.div
                    style={{ opacity, scale }}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants} className="lp-badge">
                        <Zap size={14} fill="currentColor" /> AS SEEN ON PRODUCT HUNT
                    </motion.div>
                    <motion.h1 variants={itemVariants}>
                        Visualize, Build & <span>Co-Create</span> with AI
                    </motion.h1>
                    <motion.p variants={itemVariants} className="lp-hero-desc">
                        The vibrant, high-performance whiteboard for modern teams.
                        Transform complex ideas into beautiful layouts instantly.
                    </motion.p>
                    <motion.div variants={itemVariants} className="lp-hero-btns">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="lp-btn-primary"
                        >
                            Create Free Canvas
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="lp-btn-secondary"
                        >
                            <Play size={18} fill="currentColor" /> Watch Demo
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Hero Mockup */}
                <motion.div
                    className="lp-hero-mockup"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                >
                    <div className="mockup-toolbar">
                        {[MousePointer2, Box, Layers, Zap, Maximize].map((Icon, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.2, backgroundColor: "rgba(177, 151, 252, 0.1)" }}
                                className={`mockup-tool ${idx === 0 ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                            </motion.div>
                        ))}
                    </div>
                    <div className="mockup-content">
                        <motion.div
                            animate={{
                                x: [0, 10, 0],
                                y: [0, -10, 0]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="mockup-card mockup-card-1"
                        ></motion.div>
                        <motion.div
                            animate={{
                                x: [0, -10, 0],
                                y: [0, 10, 0]
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="mockup-card mockup-card-2"
                        ></motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                            className="mockup-card mockup-card-3"
                        ></motion.div>

                        <motion.div
                            className="mockup-cursor"
                            animate={{
                                x: [0, 100, -50, 0],
                                y: [0, -50, 50, 0]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="cursor-pointer">
                                <MousePointer2 size={24} fill="#1a1a2e" stroke="white" />
                                <motion.div
                                    className="cursor-label"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 2 }}
                                >
                                    Dynamic visualization for the whole team!
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section id="features" className="lp-features">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                >
                    <motion.h2 variants={fadeInUp}>Unleash Your <span>Creative Edge</span></motion.h2>
                    <motion.p variants={fadeInUp} className="lp-features-desc">
                        Professional tools rendered in a stunning, light-filled environment.
                    </motion.p>

                    <div className="features-grid">
                        {[
                            { icon: Zap, title: "Instant Sync", desc: "Experience zero-latency collaboration. Watch your ideas take shape in real-time." },
                            { icon: Box, title: "Generative AI", desc: "Paste text to convert components into structured layouts with our AI engine." },
                            { icon: Layers, title: "Vector Precision", desc: "Full mouse editing palette directly on the canvas. Scale your ideas without quality loss." },
                            { icon: Maximize, title: "Boundless Space", desc: "An infinite workspace that grows with your project. No limits, no constraints." }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={fadeInUp}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="feature-card"
                            >
                                <div className="feature-icon"><feature.icon size={24} /></div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Process Section */}
            <section id="how-it-works" className="lp-process">
                <motion.div
                    className="process-container"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible">Simple. Fast. Powerful.</motion.h2>
                    <div className="process-steps">
                        {[
                            { num: 1, title: "Start Instantly", desc: "Drop into a canvas and write ideas with ease. No friction, just focus." },
                            { num: 2, title: "Augmented Ideation", desc: "Let ShadowAI analyze your concepts and suggest creative directions in real-time." },
                            { num: 3, title: "Ship with Ease", desc: "Sync your designs directly into your codebase or export to high-fidelity assets." }
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.2 }}
                                className="process-step"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="step-num"
                                >
                                    {step.num}
                                </motion.div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* Security Section */}
            <section id="security" className="lp-security">
                <motion.div
                    className="security-left"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>Security by Design</h2>
                    <p>Your intellectual property is sacred. We provide the strongest encryption and control mechanisms in the industry.</p>
                    <div className="security-list">
                        {[
                            { icon: Shield, text: "Military-Grade 256-bit Encryption" },
                            { icon: Key, text: "SOC2 Type II & GDPR Compliant" },
                            { icon: FileSearch, text: "Granular Access Control Policies" }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ x: 10 }}
                                className="security-item"
                            >
                                <item.icon size={20} /> {item.text}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
                <div className="security-grid">
                    {[
                        { icon: Key, label: "SSO/SAML" },
                        { icon: Fingerprint, label: "Biometrics" },
                        { icon: FileSearch, label: "Audit Logs" },
                        { icon: Database, label: "Data Governance" }
                    ].map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.4)" }}
                            className="security-card"
                        >
                            <card.icon size={32} />
                            {card.label}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="lp-cta">
                <motion.div
                    className="cta-container"
                    whileInView={{
                        boxShadow: ["0 0 0px rgba(177,151,252,0)", "0 0 50px rgba(177,151,252,0.3)", "0 0 0px rgba(177,151,252,0)"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        Ready to Evolve?
                    </motion.h2>
                    <p>Join thousands of teams redefining creative workflows on ShadowCanvas.</p>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="lp-cta-btn"
                    >
                        Claim Your Free Canvas <ArrowRight size={24} />
                    </motion.button>
                    <div className="cta-note">NO CREDIT CARD REQUIRED. FREE FOREVER PLAN.</div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="lp-footer">
                <div className="footer-brand">
                    <div className="lp-logo">
                        <Box size={24} />
                        SHADOWCANVAS
                    </div>
                    <p>The innovative final example for high-velocity product teams.</p>
                    <div className="social-links">
                        {[Twitter, Instagram, Linkedin, Github].map((Icon, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5, color: "#fff", backgroundColor: "var(--lp-primary)" }}
                                className="social-icon"
                            >
                                <Icon size={18} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="footer-col">
                    <h4>PLATFORM</h4>
                    <ul>
                        {["Feature Docs", "Asset Library", "API Access", "Integrations"].map((item, idx) => (
                            <li key={idx}><motion.a whileHover={{ x: 5 }} href="#">{item}</motion.a></li>
                        ))}
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>ECOSYSTEM</h4>
                    <ul>
                        {["SaaS & Estate", "Community Forum", "Become a Partner", "Events"].map((item, idx) => (
                            <li key={idx}><motion.a whileHover={{ x: 5 }} href="#">{item}</motion.a></li>
                        ))}
                    </ul>
                </div>

                <div className="footer-col newsletter">
                    <h4>UPDATES</h4>
                    <p>Stay ahead of the curve with our weekly UI insights.</p>
                    <form className="newsletter-form">
                        <input type="email" placeholder="Enter your email" />
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-newsletter"
                        >
                            Join Newsletter
                        </motion.button>
                    </form>
                </div>

                <div className="footer-bottom">
                    <div>© 2025 ShadowCanvas Inc. Visualize your imagination to reality.</div>
                    <div className="footer-legal">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Cookie Statement</a>
                        <a href="#">Terms & Services</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
