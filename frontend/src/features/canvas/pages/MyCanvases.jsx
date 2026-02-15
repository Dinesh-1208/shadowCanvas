import React, { useEffect, useState } from "react";

import Footer from "../../../components/Footer";
import { fetchUserCanvases, createCanvas } from "../../../utils/api";
import { useNavigate } from "react-router-dom";

const MyCanvases = () => {
    const [canvases, setCanvases] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCanvases();
    }, []);

    const loadCanvases = async () => {
        try {
            setLoading(true);
            const data = await fetchUserCanvases();
            if (data.success) {
                setCanvases(data.canvases);
            }
        } catch (error) {
            console.error("Failed to load canvases", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = async () => {
        try {
            const data = await createCanvas("Untitled Canvas");
            if (data.success) {
                navigate("/canvas", { state: { canvasId: data.canvas._id } });
            }
        } catch (error) {
            console.error("Failed to create canvas", error);
        }
    };

    const handleOpenCanvas = (canvasId) => {
        navigate("/canvas", { state: { canvasId } });
    };

    return (
        <div className="min-h-screen bg-[#b2a4ff] flex flex-col font-sans relative">


            <main className="flex-grow container mx-auto px-4 py-8 z-10 relative">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white drop-shadow-md">My Canvases</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : canvases.length === 0 ? (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-3xl shadow-xl border border-white/20">
                        <div className="text-6xl mb-4">🎨</div>
                        <h2 className="text-2xl font-semibold text-white mb-2">No canvases yet</h2>
                        <p className="text-white/80 mb-6">Start your creative journey by creating your first canvas.</p>
                        <button
                            onClick={handleCreateNew}
                            className="text-[#1a103d] bg-white hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Create one now &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* New Canvas Card - Glassmorphism style */}
                        <div
                            onClick={handleCreateNew}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center p-8 cursor-pointer transition-all hover:bg-white/20 group h-64"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="font-medium text-white">New Canvas</span>
                        </div>

                        {canvases.map((canvas) => (
                            <div
                                key={canvas._id}
                                onClick={() => handleOpenCanvas(canvas._id)}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 block h-64 flex flex-col group"
                            >
                                {/* Preview Area */}
                                <div className="h-40 bg-[#f0f4f8] flex items-center justify-center relative overflow-hidden">
                                    {canvas.thumbnail ? (
                                        <img
                                            src={canvas.thumbnail}
                                            alt={canvas.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#b2a4ff]/20 to-[#1a103d]/5 opacity-50 group-hover:opacity-70 transition-opacity"></div>
                                            <span className="text-4xl opacity-50 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">
                                                🖼️
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="p-4 flex flex-col flex-grow justify-between bg-white">
                                    <div>
                                        <h3 className="font-semibold text-lg text-[#1a103d] truncate mb-1" title={canvas.title}>
                                            {canvas.title || "Untitled Canvas"}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            Edited {new Date(canvas.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-xs px-2 py-1 bg-[#b2a4ff]/20 text-[#1a103d] rounded-full font-medium">
                                            Private
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default MyCanvases;
