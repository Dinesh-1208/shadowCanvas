import React, { useEffect, useState } from "react";
import Footer from "../../../components/Footer";
import { fetchUserCanvases, createCanvas, deleteCanvas, leaveCanvas } from "../../../utils/api";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, LogOut } from "lucide-react";

const getUserIdFromToken = () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        return null;
    }
};

const MyCanvases = () => {
    const [canvases, setCanvases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNamingModal, setShowNamingModal] = useState(false);
    const [newCanvasName, setNewCanvasName] = useState("");
    const navigate = useNavigate();
    const currentUserId = getUserIdFromToken();

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

    const handleCreateNew = async (e) => {
        e?.preventDefault();
        if (!newCanvasName.trim()) return;

        try {
            const data = await createCanvas(newCanvasName);
            if (data.success) {
                setShowNamingModal(false);
                setNewCanvasName("");
                navigate(`/canvas/${data.canvas.roomCode}`, { state: { canvasId: data.canvas._id } });
            }
        } catch (error) {
            console.error("Failed to create canvas", error);
        }
    };

    const handleOpenCanvas = (canvasId, roomCode) => {
        navigate(`/canvas/${roomCode}`, { state: { canvasId } });
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this canvas? This action cannot be undone.")) {
            try {
                const res = await deleteCanvas(id);
                if (res.success) {
                    setCanvases(prev => prev.filter(c => c._id !== id));
                }
            } catch (error) {
                console.error("Failed to delete canvas", error);
                alert("Failed to delete canvas");
            }
        }
    };

    const handleLeave = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to leave this shared canvas?")) {
            try {
                const res = await leaveCanvas(id);
                if (res.success) {
                    setCanvases(prev => prev.filter(c => c._id !== id));
                }
            } catch (error) {
                console.error("Failed to leave canvas", error);
                alert("Failed to leave canvas");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#b2a4ff] flex flex-col font-sans relative">

            <main className="flex-grow container mx-auto px-4 py-8 z-10 relative">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft size={24} />
                    </button>
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
                            onClick={() => setShowNamingModal(true)}
                            className="text-[#1a103d] bg-white hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            Create one now &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* New Canvas Card - Glassmorphism style */}
                        <div
                            onClick={() => setShowNamingModal(true)}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center p-8 cursor-pointer transition-all hover:bg-white/20 group h-64"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <span className="font-medium text-white">New Canvas</span>
                        </div>

                        {canvases.map((canvas) => {
                            const isOwner = canvas.ownerId && (canvas.ownerId._id === currentUserId || canvas.ownerId === currentUserId);
                            return (
                                <div
                                    key={canvas._id}
                                    onClick={() => handleOpenCanvas(canvas._id, canvas.roomCode)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 block h-64 flex flex-col group relative"
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
                                        <div className="flex justify-between items-start">
                                            <div className="overflow-hidden">
                                                <h3 className="font-semibold text-lg text-[#1a103d] truncate mb-1" title={canvas.title}>
                                                    {canvas.title || "Untitled Canvas"}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    Edited {new Date(canvas.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className={`text-xs px-2 py-1 ${isOwner ? 'bg-[#b2a4ff]/20 text-[#1a103d]' : 'bg-green-100 text-green-800'} rounded-full font-medium`}>
                                                {isOwner ? 'Private' : `Shared by ${canvas.ownerId?.name || 'Unknown'}`}
                                            </span>
                                            {isOwner ? (
                                                <button
                                                    onClick={(e) => handleDelete(e, canvas._id)}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete Canvas"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => handleLeave(e, canvas._id)}
                                                    className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                                                    title="Leave Canvas"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Naming Modal */}
            {showNamingModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a103d]/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-[#1a103d] mb-2">Name Your Canvas</h2>
                            <p className="text-gray-500 mb-6 font-medium">What will your next masterpiece be called?</p>
                            
                            <form onSubmit={handleCreateNew}>
                                <div className="mb-8">
                                    <label className="block text-xs font-black text-[#1a103d]/40 uppercase tracking-widest mb-2 px-1">
                                        Canvas Title
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale group-focus-within:grayscale-0 transition-all">
                                            🎨
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newCanvasName}
                                            onChange={(e) => setNewCanvasName(e.target.value)}
                                            placeholder="e.g., My Awesome Idea"
                                            className="w-full bg-[#f8faff] border-2 border-transparent focus:border-[#b2a4ff]/30 focus:bg-white rounded-[20px] pl-12 pr-4 py-4 text-sm font-bold text-[#1a103d] transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowNamingModal(false)}
                                        className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-[#1a103d]/60 font-bold rounded-[20px] transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 px-6 bg-[#b2a4ff] hover:bg-[#9281ff] text-[#1a103d] font-black rounded-[20px] shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                                    >
                                        Create &rarr;
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

export default MyCanvases;
