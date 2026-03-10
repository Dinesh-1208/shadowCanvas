import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "../../../styles/auth.css";

const MultiCanvasLobby = () => {
    const navigate = useNavigate();
    const [showNamingModal, setShowNamingModal] = useState(false);
    const [sessionName, setSessionName] = useState("");

    const handleCreateSession = (e) => {
        e.preventDefault();
        if (!sessionName.trim()) return;

        // Generate a new room code client-side
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // Navigate to the canvas page. The CanvasPage component will handle the actual creation via API.
        navigate(`/canvas/${roomCode}`, {
            state: {
                sessionConfig: {
                    sessionName: sessionName,
                    roomCode
                }
            }
        });
        setShowNamingModal(false);
    };

    return (
        <div className="min-h-screen bg-[#b2a4ff] relative overflow-hidden flex flex-col">
            {/* Background blobs for depth */}
            {/* Background blobs removed for uniform look */}

            <div className="relative z-10 flex-grow flex flex-col">
                <Navbar hideAuth={true} />

                <div className="flex-grow flex items-center justify-center p-4 pt-24">
                    <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
                        {/* Create Session Card */}
                        <div
                            onClick={() => setShowNamingModal(true)}
                            className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 cursor-pointer hover:bg-white/30 transition-all transform hover:-translate-y-2 group"
                        >
                            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
                                ✨
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Create Session</h2>
                            <p className="text-white/80 text-lg leading-relaxed">
                                Start a new collaborative canvas. Set up permissions, invite your team, and lead the design session.
                            </p>
                            <div className="mt-8 flex items-center text-white font-semibold">
                                Get Started <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>

                        {/* Join Session Card */}
                        <div
                            onClick={() => navigate('/multi-canvas-join')}
                            className="bg-[#1a103d]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 cursor-pointer hover:bg-[#1a103d] transition-all transform hover:-translate-y-2 group"
                        >
                            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
                                🚀
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Join Session</h2>
                            <p className="text-white/60 text-lg leading-relaxed">
                                Enter an existing session code to join your team. Collaborate in real-time on ongoing projects.
                            </p>
                            <div className="mt-8 flex items-center text-white font-semibold">
                                Join Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center pb-10">
                    <Link to="/" className="text-white/70 hover:text-white font-medium transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>

            {/* Naming Modal */}
            {showNamingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a103d]/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="p-10">
                            <h2 className="text-3xl font-black text-[#1a103d] mb-3 tracking-tight">Name Your Session</h2>
                            <p className="text-[#1a103d]/60 mb-8 font-bold leading-relaxed">
                                Give your team space a clear name to help others recognize it.
                            </p>
                            
                            <form onSubmit={handleCreateSession}>
                                <div className="mb-10">
                                    <label className="block text-xs font-black text-[#1a103d]/40 uppercase tracking-widest mb-3 px-1">
                                        Session Title
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl grayscale group-focus-within:grayscale-0 transition-all duration-300">
                                            🏷️
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={sessionName}
                                            onChange={(e) => setSessionName(e.target.value)}
                                            placeholder="e.g., Design Sync"
                                            className="w-full bg-[#f0f4ff] border-2 border-transparent focus:border-[#b2a4ff]/50 focus:bg-white rounded-3xl pl-16 pr-6 py-5 text-lg font-bold text-[#1a103d] transition-all outline-none shadow-inner"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-4">
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-[#b2a4ff] hover:bg-[#9281ff] text-[#1a103d] font-black rounded-3xl shadow-xl shadow-purple-500/30 transition-all active:scale-95 text-lg"
                                    >
                                        Start Session &rarr;
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowNamingModal(false)}
                                        className="w-full py-4 text-[#1a103d]/40 font-bold hover:text-[#1a103d]/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default MultiCanvasLobby;
