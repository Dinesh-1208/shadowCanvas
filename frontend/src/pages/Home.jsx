import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import {
    Plus,
    Settings,
    User,
    History,
    Layout,
    MoreVertical,
    Edit3
} from "lucide-react";

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        if (token) {
            localStorage.setItem("token", token);
            window.history.replaceState({}, document.title, "/home");
        }

        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            navigate("/login");
        } else {
            setUser({ name: "Gowtham", email: "gowtham@example.com" });
        }
    }, [navigate, location]);

    const handleLogout = () => {
        authService.logout();
        navigate("/");
    };

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "G";

    const recentDrawings = [
        { id: 1, title: "Website Wireframe", date: "2 hours ago", thumbnail: "bg-white/10" },
        { id: 2, title: "Database Schema", date: "1 day ago", thumbnail: "bg-white/10" },
        { id: 3, title: "Project Brainstorm", date: "3 days ago", thumbnail: "bg-white/10" },
    ];

    return (
        <div className="min-h-screen bg-[#b2a4ff] relative overflow-hidden flex flex-col font-sans">
            {/* Background blobs for depth (Same as landing page) */}
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

            <Navbar userInitial={userInitial} onLogout={handleLogout} />

            <main className="relative z-10 flex-grow pt-32 pb-16 px-6 max-w-7xl mx-auto w-full text-white">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">

                    {/* Left Sidebar: Profile & Actions */}
                    <div className="lg:col-span-1 space-y-10">
                        <div className="flex flex-col items-center text-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="w-24 h-24 bg-[#1a103d] rounded-full flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-2xl border-4 border-white/20"
                            >
                                {userInitial}
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                            <p className="text-white/60 text-sm mb-10">{user?.email}</p>

                            <nav className="w-full space-y-2">
                                <button className="w-full flex items-center gap-4 px-6 py-4 bg-white/20 backdrop-blur-md rounded-2xl font-bold transition-all border border-white/20 text-white">
                                    <Layout size={22} className="text-[#1a103d]" /> Dashboard
                                </button>
                                <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all text-white/70 hover:text-white">
                                    <Edit3 size={22} /> Edit Profile
                                </button>
                                <button className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/10 rounded-2xl font-bold transition-all text-white/70 hover:text-white">
                                    <Settings size={22} /> Settings
                                </button>
                            </nav>
                        </div>

                        <div className="bg-[#1a103d] rounded-[32px] p-8 text-white shadow-2xl border border-white/10">
                            <h3 className="font-bold text-xl mb-2">Pro Plan</h3>
                            <p className="text-white/50 text-sm mb-6 leading-relaxed">Unlock unlimited canvases and AI generation.</p>
                            <button className="w-full py-4 bg-white text-[#1a103d] rounded-2xl font-bold text-sm hover:translate-y-[-2px] transition-all shadow-lg">
                                Upgrade Now
                            </button>
                        </div>
                    </div>

                    {/* Main Content: Create & Drawings */}
                    <div className="lg:col-span-3 space-y-12">

                        {/* Header & Create Action */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-4xl font-bold tracking-tight">My Canvases</h1>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate("/canvas")}
                                className="flex items-center gap-3 px-8 py-4 bg-[#1a103d] text-white rounded-2xl font-bold shadow-2xl hover:bg-[#251854] transition-all"
                            >
                                <Plus size={22} /> Create New Canvas
                            </motion.button>
                        </div>

                        {/* Recent Drawings */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 text-white/60">
                                <History size={20} />
                                <span className="text-sm font-bold tracking-widest uppercase">Recently Edited</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {recentDrawings.map((drawing) => (
                                    <motion.div
                                        key={drawing.id}
                                        whileHover={{ y: -8 }}
                                        className="bg-white/10 backdrop-blur-md rounded-[32px] p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
                                    >
                                        <div className={`aspect-video ${drawing.thumbnail} rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden border border-white/10`}>
                                            <Layout size={40} className="text-white/20 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg mb-1 group-hover:text-white transition-colors">{drawing.title}</h3>
                                                <p className="text-sm text-white/40">{drawing.date}</p>
                                            </div>
                                            <button className="p-3 hover:bg-white/20 rounded-xl text-white/30 group-hover:text-white transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Shared / Empty State */}
                        <div className="border-2 border-dashed border-white/20 rounded-[48px] p-16 text-center bg-white/5">
                            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User size={32} className="text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Shared Drawings</h3>
                            <p className="text-white/40">When someone shares a canvas with you, it will appear here.</p>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
