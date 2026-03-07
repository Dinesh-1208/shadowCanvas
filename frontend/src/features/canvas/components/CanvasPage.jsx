import React, { useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { CanvasHeader } from './CanvasHeader';

// import '../styles/global.css'; // Imported in index.js usually, but ensuring it's loaded

import { useLocation, useParams } from 'react-router-dom';
import { requestEditAccess, getEditRequests, respondToEditRequest } from '../../../utils/api';

export default function CanvasPage() {
    const { roomCode } = useParams();
    const location = useLocation();
    const canvas = useCanvas(location.state, roomCode);
    const [isMenuOpen, setMenuOpen] = React.useState(false);
    const [editRequests, setEditRequests] = React.useState([]);

    useEffect(() => {
        if (canvas.role === 'owner' && canvas.canvasId) {
            const fetchRequests = async () => {
                try {
                    const data = await getEditRequests(canvas.canvasId);
                    if (data.success) {
                        setEditRequests(data.requests);
                    }
                } catch (err) {
                    console.error("Failed to fetch edit requests", err);
                }
            };
            fetchRequests();
            const interval = setInterval(fetchRequests, 30000); // 30s poll
            return () => clearInterval(interval);
        }
    }, [canvas.role, canvas.canvasId]);

    const handleRespond = async (requestUserId, decision) => {
        try {
            const data = await respondToEditRequest(canvas.canvasId, requestUserId, decision);
            if (data.success) {
                setEditRequests(prev => prev.filter(r => r.userId._id !== requestUserId));
                alert(`Request ${decision}!`);
            }
        } catch (err) {
            alert("Failed to respond to request");
        }
    };

    const handleShare = async () => {
        try {
            const data = await axios.post('http://localhost:3000/api/canvas/generate-share-link', {
                canvasId: canvas.canvasId,
                role: 'view'
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (data.data.success) {
                const url = `${window.location.origin}/canvas/shared/${data.data.token}`;
                navigator.clipboard.writeText(url).then(() => {
                    alert('Sharing link (View-Only) copied to clipboard!');
                });
            }
        } catch (err) {
            console.error('Failed to generate share link: ', err);
            // Fallback to room code URL if something fails
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                alert('Room link copied to clipboard!');
            });
        }
    };

    // ─── Global shortcuts ────────────────────────────────────
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                canvas.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                canvas.redo();
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.selectedId) {
                e.preventDefault();
                canvas.deleteElement(canvas.selectedId);
            }
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
                switch (e.key.toLowerCase()) {
                    case 'v': canvas.setTool('select'); break;
                    case 'h': canvas.setTool('hand'); break;
                    case 'r': canvas.setTool('rect'); break;
                    case 'd': canvas.setTool('diamond'); break;
                    case 'o': /* Figma uses O for oval */
                    case 'e': canvas.setTool('circle'); break;
                    case 'a': canvas.setTool('arrow'); break;
                    case 'p': canvas.setTool('pencil'); break;
                    case 't': canvas.setTool('text'); break;
                    default: break;
                }
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canvas]);

    const handleRequestEdit = async () => {
        try {
            const data = await requestEditAccess(canvas.canvasId);
            if (data.success) {
                alert("Edit access requested!");
            }
        } catch (err) {
            alert(err.response?.data?.error || "Failed to request edit access");
        }
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-white">

            {/* 1. Full Screen Canvas Layer */}
            <div id="canvas-root" className="absolute inset-0 z-0">
                <Canvas
                    elements={canvas.elements}
                    selectedId={canvas.selectedId}
                    setSelectedId={canvas.setSelectedId}
                    tool={canvas.tool}
                    currentStyle={canvas.currentStyle}
                    zoom={canvas.zoom}
                    setZoom={canvas.setZoom}
                    pan={canvas.pan}
                    setPan={canvas.setPan}
                    addElement={canvas.addElement}
                    deleteElement={canvas.deleteElement}
                    moveElement={canvas.moveElement}
                    commitMove={canvas.commitMove}
                    resizeElement={canvas.resizeElement}
                    commitResize={canvas.commitResize}
                    reorderElement={canvas.reorderElement}
                    onThumbnailUpdate={canvas.updateThumbnail}
                    role={canvas.role}
                />
            </div>

            {/* 2. UI Overlay Layer (Pointer events go through empty areas) */}
            <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-4">

                {/* ── View Only Mode Banner ── */}
                {canvas.role === 'viewer' && (
                    <div className="flex justify-center mb-4">
                        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full shadow-sm">
                            <span className="text-amber-600 text-lg">👁️</span>
                            <span className="text-amber-800 font-medium text-sm">View Only Mode</span>
                            <button
                                onClick={handleRequestEdit}
                                className="ml-2 px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full hover:bg-amber-700 transition-colors shadow-sm"
                            >
                                Request Edit Access
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Edit Access Requests (For Owner) ── */}
                {canvas.role === 'owner' && editRequests.length > 0 && (
                    <div className="flex flex-col items-center gap-2 mb-4">
                        {editRequests.map((req) => (
                            <div key={req._id} className="pointer-events-auto flex items-center gap-4 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl shadow-lg animate-in slide-in-from-top duration-300">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Edit Request</span>
                                    <span className="text-sm font-semibold text-indigo-900">{req.userId?.name || 'User'} wants to edit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRespond(req.userId._id, 'approved')}
                                        className="h-8 px-3 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleRespond(req.userId._id, 'rejected')}
                                        className="h-8 px-3 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Top Bar: Robust 3-column layout */}
                <div className="grid grid-cols-3 items-center w-full max-w-full gap-2 lg:gap-4">

                    {/* Left side: Header (Logo + Title) and Share */}
                    <div className="flex items-center gap-2 pointer-events-auto min-w-0 overflow-hidden">
                        <CanvasHeader
                            title={canvas.title}
                            setTitle={canvas.setTitle}
                            role={canvas.role}
                            onMenuClick={() => setMenuOpen(!isMenuOpen)}
                        />
                        <button
                            onClick={handleShare}
                            className="h-10 px-3 sm:px-4 bg-[#1a103d] text-white rounded-xl font-semibold shadow-lg hover:bg-[#251854] transition-all flex items-center gap-2 shrink-0"
                        >
                            <span className="text-sm">🔗</span>
                            <span className="hidden sm:inline text-sm">Share</span>
                        </button>
                    </div>

                    {/* Center side: Floating Toolbar */}
                    <div className="flex justify-center pointer-events-none">
                        <div className={`pointer-events-auto ${canvas.role === 'viewer' ? 'grayscale opacity-50 pointer-events-none' : ''}`}>
                            <Toolbar
                                tool={canvas.tool}
                                setTool={canvas.setTool}
                                undo={canvas.undo}
                                redo={canvas.redo}
                                zoom={canvas.zoom}
                                setZoom={canvas.setZoom}
                                clearCanvas={canvas.clearCanvas}
                            />
                        </div>
                    </div>

                    {/* Right side: Actions / Status */}
                    <div className="flex justify-end items-center gap-2 pointer-events-auto shrink-0">
                        {/* Empty for now to preserve center alignment */}
                    </div>
                </div>

                {/* Main Menu / Properties Panel Slide-out */}
                {isMenuOpen && (
                    <div className="mt-4 pointer-events-none">
                        <div className="w-64 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl shadow-2xl pointer-events-auto bg-white border border-gray-100">
                            <PropertiesPanel canvas={canvas} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}