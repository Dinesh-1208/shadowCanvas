import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "../../../styles/auth.css";

const MultiCanvasLobby = () => {
    const navigate = useNavigate();

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
                            onClick={() => {
                                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                                navigate(`/canvas/${roomCode}`, {
                                    state: {
                                        sessionConfig: {
                                            sessionName: 'New Collaborative Canvas',
                                            roomCode
                                        }
                                    }
                                });
                            }}
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
            <Footer />
        </div>
    );
};

export default MultiCanvasLobby;
