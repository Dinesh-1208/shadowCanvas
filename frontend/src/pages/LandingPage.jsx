import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LandingPage = () => {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);

    React.useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    return (
        <div className="min-h-screen bg-[#b2a4ff] relative overflow-hidden flex flex-col">
            {/* Background blobs for depth */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9281ff] rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c7bdff] rounded-full blur-[120px] opacity-60"></div>

            <div className="relative z-10 flex-grow">
                <Navbar />

                {/* Placeholder for Hero to show Navbar context */}
                <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white/90 text-xs font-medium mb-8 backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        NEW: AI-POWERED DESIGN ENGINE
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
                        Visualize, Build & <br />
                        <span className="text-[#1a103d]">Co-Create with AI</span>
                    </h1>

                    <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The vibrant, high-performance whiteboard for modern teams.
                        Transform complex ideas into beautiful layouts instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={isAuthenticated ? "/canvas" : "/login"}>
                            <button className="px-8 py-3 bg-[#1a103d] text-white rounded-xl font-semibold shadow-xl hover:bg-[#251854] transition-all transform hover:-translate-y-1">
                                {isAuthenticated ? "Open Canvas" : "Create Free Canvas"}
                            </button>
                        </Link>
                        <button className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-[#1a103d] border-b-[4px] border-b-transparent ml-0.5"></div>
                            </div>
                            Watch Demo
                        </button>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default LandingPage;
