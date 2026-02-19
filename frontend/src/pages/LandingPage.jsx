import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { MoveRight, Zap, Cpu, MousePointer2, Layout } from "lucide-react";
import { motion } from "framer-motion";

const LandingPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("token");

    const handleGetStarted = () => {
        // Explicitly navigate to the lobby. Do NOT create a canvas here.
        navigate(isAuthenticated ? "/multi-canvas" : "/login");
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#b2a4ff] relative overflow-hidden flex flex-col font-sans">
            {/* Background blobs for depth */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9281ff] rounded-full blur-[120px] opacity-60 pointer-events-none"
            ></motion.div>
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, -5, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c7bdff] rounded-full blur-[120px] opacity-60 pointer-events-none"
            ></motion.div>

            <div className="relative z-10 flex-grow">
                <Navbar />

                {/* Hero Section */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="pt-40 pb-16 px-6 text-center max-w-5xl mx-auto"
                >
                    <motion.h1
                        variants={itemVariants}
                        className="text-6xl md:text-8xl font-bold text-white tracking-tight mb-8 leading-[1.1]"
                    >
                        Visualize, Build & <br />
                        <span className="text-[#1a103d]">Co-Create with AI</span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed"
                    >
                        The vibrant, high-performance whiteboard for modern teams.
                        Transform complex ideas into beautiful layouts instantly with ShadowCanvas.
                    </motion.p>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24"
                    >
                        <button
                            onClick={handleGetStarted}
                            className="px-10 py-4 bg-[#1a103d] text-white rounded-2xl font-bold text-lg shadow-2xl hover:bg-[#251854] transition-all transform hover:-translate-y-1 active:scale-95"
                        >
                            {isAuthenticated ? "Open Canvas" : "Get Started"}
                        </button>
                    </motion.div>

                    {/* App Preview Mockup */}
                    <motion.div
                        variants={itemVariants}
                        className="relative mx-auto max-w-6xl aspect-[16/9] bg-white/40 backdrop-blur-2xl rounded-[32px] border border-white/40 shadow-2xl overflow-hidden group"
                    >
                        <div className="absolute inset-4 bg-white/30 rounded-[22px] border border-white/20 overflow-hidden flex items-center justify-center">
                            {/* Floating Toolbar Elements */}
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-14 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-4 items-center">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Layout size={20} /></div>
                                <div className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 transition-colors"><MousePointer2 size={20} /></div>
                                <div className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 transition-colors"><Cpu size={20} /></div>
                                <div className="w-10 h-10 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 transition-colors"><Zap size={20} /></div>
                            </div>

                            {/* Canvas Content Content Mockup */}
                            <div className="flex gap-8 items-center scale-90 md:scale-100">
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-48 h-32 bg-white/80 rounded-2xl shadow-md border border-white/50"
                                ></motion.div>
                                <div className="flex flex-col gap-6">
                                    <div className="w-64 h-24 bg-indigo-600/10 rounded-2xl border-2 border-indigo-600/30 flex items-center justify-center">
                                        <div className="w-full px-4 text-center text-xs font-semibold text-indigo-900 leading-tight">Complex architecture flows generated by AI...</div>
                                    </div>
                                    <div className="w-48 h-24 bg-white/80 rounded-2xl shadow-md border border-white/50 ml-12"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.section>

                {/* Features Section */}
                <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Unleash Your <span className="text-[#1a103d]">Creative Edge</span></h2>
                        <p className="text-white/70 text-lg">Professional tools rendered in a stunning, light-filled environment.</p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        {[
                            { title: "Instant Sync", desc: "Collaborate in real-time with flawless latency and precision.", icon: <Zap className="text-indigo-600" size={24} /> },
                            { title: "Generative AI", desc: "Turn text into functional UI components and logic flows instantly.", icon: <Cpu className="text-indigo-600" size={24} /> },
                            { title: "Vector Precision", desc: "Scale your ideas infinitely without losing clarity or detail.", icon: <MousePointer2 className="text-indigo-600" size={24} /> },
                            { title: "Boundless Space", desc: "An infinite workspace designed for the biggest of dreams.", icon: <Layout className="text-indigo-600" size={24} /> }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05 }}
                                className="p-8 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 hover:bg-white/30 transition-all group cursor-default shadow-lg"
                            >
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-indigo-50 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/70 leading-relaxed text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>

                {/* Process Section */}
                <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-white/10 backdrop-blur-2xl rounded-[48px] border border-white/20 p-12 md:p-20 relative overflow-hidden"
                    >
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold text-[#1a103d] tracking-widest uppercase mb-4 block">The Workflow</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12">Simple. Fast. Powerful.</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { step: "1", title: "Start Instantly", desc: "Drop into a canvas and start creating with zero friction. Just focus on your work." },
                                { step: "2", title: "Augmented Ideation", desc: "Let ShadowCanvas guide your brainstorming sessions with smart suggestions." },
                                { step: "3", title: "Ship with Ease", desc: "Sync your designs directly into development or export in multiple high-fidelity formats." }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    viewport={{ once: true }}
                                    className="text-center group"
                                >
                                    <div className="w-16 h-16 bg-[#1a103d] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform">
                                        {item.step}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                                    <p className="text-white/60 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </section >
                {/* Security Section */}
                < section id="security" className="py-24 px-6 max-w-7xl mx-auto" >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Security by <span className="text-[#1a103d]">Design</span></h2>
                            <p className="text-white/70 text-lg mb-10">Your intellectual property is sacred. We provide the strongest encryption and control mechanisms in the industry.</p>

                            <div className="space-y-4">
                                {[
                                    "Military Grade 256-bit Encryption",
                                    "SOC2 Type II & GDPR Compliant",
                                    "Granular Access Control Policies"
                                ].map((text, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-white font-medium">{text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[
                                { title: "RBAC & MFA", icon: "🔑" },
                                { title: "Biometrics", icon: "👤" },
                                { title: "Audit Logs", icon: "📋" },
                                { title: "Data Privacy", icon: "🛡️" }
                            ].map((item, i) => (
                                <div key={i} className="aspect-square bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30 flex flex-col items-center justify-center p-6 text-center group hover:bg-white/30 transition-all">
                                    <span className="text-4xl mb-4 group-hover:scale-125 transition-transform">{item.icon}</span>
                                    <span className="text-white font-bold">{item.title}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </section >

                {/* Final CTA Section */}
                < section className="py-32 px-6" >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto bg-white/20 backdrop-blur-3xl rounded-[60px] border border-white/30 p-16 md:p-24 text-center relative overflow-hidden"
                    >
                        {/* Decorative elements */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px]"></div>
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>

                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">Ready to Evolve?</h2>
                            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">Join thousands of teams redefining creative workflows on ShadowCanvas.</p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGetStarted}
                                className="px-12 py-5 bg-[#1a103d] text-white rounded-2xl font-bold text-xl shadow-2xl hover:bg-[#251854] transition-all flex items-center gap-3 mx-auto mb-8"
                            >
                                {isAuthenticated ? "Open Canvas" : "Get Started"} <MoveRight size={24} />
                            </motion.button>

                            <p className="text-white/40 text-sm font-bold tracking-widest uppercase">
                                NO CREDIT CARD REQUIRED • FREE TIER FOR TEAMS
                            </p>
                        </div>
                    </motion.div>
                </section >
            </div >
            <Footer />
        </div >
    );
};

export default LandingPage;
