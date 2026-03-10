import React, { useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { CanvasHeader } from './CanvasHeader';
import ShareModal from './ShareModal';
import LiveCursors from './LiveCursors';
import { requestEditAccess, approveEditRequest } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';
import AIChatPanel from './AIChatPanel';
import { Sparkles } from 'lucide-react';

// import '../styles/global.css'; // Imported in index.js usually, but ensuring it's loaded

import { useLocation, useParams } from 'react-router-dom';

export default function CanvasPage() {
    const { roomCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');

    // Auth check for shared link
    useEffect(() => {
        if (mode) {
            const token = localStorage.getItem('token');
            if (!token) {
                localStorage.setItem('sc_redirectContext', location.pathname + location.search);
                navigate('/login');
            }
        }
    }, [mode, location, navigate]);

    const canvas = useCanvas(location.state, roomCode);

    console.log("CanvasPage render:", { mode, canvasRole: canvas.role });
    // Fall back to URL mode only if backend role is strictly VIEW
    const isViewMode = (canvas.role === 'OWNER' || canvas.role === 'EDIT') ? false : mode === 'view';

    const [isMenuOpen, setMenuOpen] = React.useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
    const [isRequestingLocal, setIsRequestingLocal] = React.useState(false);
    const [cooldownTime, setCooldownTime] = React.useState(null);
    const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);

    // For custom expiry per request
    const [customExpiryMode, setCustomExpiryMode] = React.useState({});
    const [customExpiryDays, setCustomExpiryDays] = React.useState({});
    const [customExpiryHours, setCustomExpiryHours] = React.useState({});
    const [customExpiryMinutes, setCustomExpiryMinutes] = React.useState({});
    const [customExpiryTick, setCustomExpiryTick] = React.useState({});

    // Track cooldown timer
    useEffect(() => {
        let interval;
        if (canvas.nextAllowedRequestAt) {
            const updateCooldown = () => {
                const now = new Date();
                const target = new Date(canvas.nextAllowedRequestAt);
                if (target > now) {
                    const diff = Math.floor((target - now) / 1000);
                    const m = Math.floor(diff / 60);
                    const s = diff % 60;
                    setCooldownTime(`${m}:${s.toString().padStart(2, '0')}`);
                } else {
                    setCooldownTime(null);
                    canvas.setNextAllowedRequestAt(null);
                }
            };
            updateCooldown();
            interval = setInterval(updateCooldown, 1000);
        } else {
            setCooldownTime(null);
        }
        return () => clearInterval(interval);
    }, [canvas.nextAllowedRequestAt, canvas]);

    const handleShare = () => {
        setIsShareModalOpen(true);
    };

    const handleRequestEdit = async () => {
        if (isRequestingLocal || cooldownTime || canvas.requestStatus === 'PENDING') return;
        setIsRequestingLocal(true);
        try {
            if (canvas.canvasId) {
                const res = await requestEditAccess(canvas.canvasId);
                canvas.emitEditRequest({
                    requestId: res.request?._id,
                    userId: res.request?.userId,
                    userName: res.request?.userName
                });
                canvas.setRequestStatus('PENDING');
                setIsRequestingLocal(false);
            }
        } catch (err) {
            if (err.response?.data?.nextAllowedRequestAt) {
                canvas.setNextAllowedRequestAt(err.response.data.nextAllowedRequestAt);
                canvas.setRequestStatus('REJECTED');
            } else if (err.response?.data?.error === 'You already have a pending request.') {
                canvas.setRequestStatus('PENDING');
            } else {
                alert(err.response?.data?.error || 'Failed to request edit access');
            }
            setIsRequestingLocal(false);
        }
    };

    const handleApprove = async (reqId, userId, action, expiresInHours) => {
        try {
            await approveEditRequest(reqId, action, expiresInHours);
            canvas.resolveEditRequest(reqId, action, userId);
            canvas.setIncomingRequests(prev => prev.filter(r => r.requestId !== reqId));
            // alert(`Request ${action.toLowerCase()}ed.`);
        } catch (err) {
            alert(err.response?.data?.error || `Failed to ${action} request`);
        }
    };

    // ─── Global shortcuts ────────────────────────────────────
    useEffect(() => {
        function onKey(e) {
            if (isViewMode) return;
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
                    isReadOnly={isViewMode}
                    onCursorMove={(x, y) => {
                        const role = isViewMode ? 'VIEW' : 'EDIT';
                        canvas.emitCursorMove(x, y, role);
                    }}
                />
            </div>

            {/* Live User Cursors */}
            <LiveCursors activeCursors={canvas.activeCursors} zoom={canvas.zoom} pan={canvas.pan} />

            {/* 2. UI Overlay Layer (Pointer events go through empty areas) */}
            <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-4">

                {/* Top Bar: Robust 3-column layout */}
                <div className="grid grid-cols-3 items-center w-full max-w-full gap-2 lg:gap-4">

                    {/* Left side: Header (Logo + Title) */}
                    <div className="flex items-center gap-2 pointer-events-auto min-w-0">
                        <CanvasHeader
                            title={canvas.title}
                            setTitle={canvas.setTitle}
                            onMenuClick={() => setMenuOpen(!isMenuOpen)}
                            readOnly={isViewMode}
                            ownerName={canvas.ownerName}
                            activeUsers={canvas.activeUsers}
                        />
                    </div>

                    {/* Center side: Floating Toolbar */}
                    <div className="flex justify-center pointer-events-none">
                        {!isViewMode && (
                            <div className="pointer-events-auto">
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
                        )}
                    </div>

                    {/* Right side: Actions / Status */}
                    <div className="flex justify-end items-center gap-2 pointer-events-auto shrink-0">
                        {isViewMode && (
                            <div className="relative group">
                                <button
                                    onClick={handleRequestEdit}
                                    disabled={isRequestingLocal || canvas.requestStatus === 'PENDING' || cooldownTime !== null}
                                    className={`h-10 px-3 sm:px-4 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 shrink-0 overflow-hidden relative ${cooldownTime !== null
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                                        : canvas.requestStatus === 'PENDING' || isRequestingLocal
                                            ? 'bg-amber-100 text-amber-700 cursor-not-allowed border border-amber-200 opacity-90'
                                            : 'bg-[#facc15] text-[#1a103d] hover:bg-[#eab308] hover:shadow-xl hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isRequestingLocal ? (
                                        <>
                                            <span className="animate-spin text-sm">↻</span>
                                            <span className="hidden sm:inline text-sm">Sending...</span>
                                        </>
                                    ) : canvas.requestStatus === 'PENDING' ? (
                                        <>
                                            <span className="text-sm">⏳</span>
                                            <span className="hidden sm:inline text-sm">Request Sent</span>
                                        </>
                                    ) : cooldownTime !== null ? (
                                        <>
                                            <span className="text-sm">⏳</span>
                                            <span className="hidden sm:inline text-sm">Available in {cooldownTime}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-sm">✋</span>
                                            <span className="hidden sm:inline text-sm font-bold">Request Edit Access</span>
                                        </>
                                    )}
                                    {/* Subtle Glow Effect for active button */}
                                    {!isRequestingLocal && canvas.requestStatus !== 'PENDING' && cooldownTime === null && (
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
                                    )}
                                </button>

                                {/* Tooltip for PENDING state */}
                                {canvas.requestStatus === 'PENDING' && (
                                    <div className="absolute top-full mt-2 right-0 w-48 bg-gray-800 text-white text-xs text-center p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-50">
                                        Waiting for owner approval
                                    </div>
                                )}
                            </div>
                        )}
                        {!isViewMode && (
                            <button
                                onClick={handleShare}
                                className="h-10 px-3 sm:px-4 bg-[#1a103d] text-white rounded-xl font-semibold shadow-lg hover:bg-[#251854] transition-all flex items-center gap-2 shrink-0"
                            >
                                <span className="text-sm">🔗</span>
                                <span className="hidden sm:inline text-sm">Share</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                            className={`h-10 px-3 sm:px-4 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 shrink-0 ${isAIChatOpen ? 'bg-[#9d8beb] shadow-inner' : 'bg-[#b2a4ff] hover:bg-[#9d8beb] hover:-translate-y-0.5'}`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">AI Chat</span>
                        </button>
                    </div>
                </div>

                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    roomCode={roomCode}
                    canvasId={canvas.canvasId}
                    roomPassword={canvas.roomPassword}
                    setRoomPassword={canvas.setRoomPassword}
                />

                {/* Incoming Requests UI */}
                {!isViewMode && canvas.incomingRequests && canvas.incomingRequests.length > 0 && (
                    <div className="absolute top-16 right-4 flex flex-col gap-2 z-50 pointer-events-auto w-[340px] max-w-full">
                        {canvas.incomingRequests.map(req => (
                            <div key={req.requestId} className="bg-white p-3 rounded-xl shadow-2xl border border-gray-200">
                                <p className="text-sm font-semibold mb-2">{req.userName} requested edit access</p>
                                <div className="flex flex-col gap-2">
                                    {/* Expiration Options Grid */}
                                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                                        {[
                                            { label: 'Forever', value: 0 },
                                            { label: '10 Min', value: 0.166666667 },
                                            { label: '30 Min', value: 0.5 },
                                            { label: '1 Hour', value: 1 },
                                            { label: '6 Hours', value: 6 },
                                            { label: '1 Day', value: 24 },
                                            { label: 'Custom', value: 'custom' }
                                        ].map(opt => {
                                            const isSelected = (!customExpiryMode[req.requestId] && opt.value !== 'custom' &&
                                                parseFloat(document.getElementById(`expiry-${req.requestId}`)?.value || 0) === opt.value) ||
                                                (customExpiryMode[req.requestId] && opt.value === 'custom');

                                            return (
                                                <button
                                                    key={opt.label}
                                                    onClick={() => {
                                                        const selectEl = document.getElementById(`expiry-${req.requestId}`);
                                                        if (!selectEl) {
                                                            const newEl = document.createElement('input');
                                                            newEl.type = 'hidden';
                                                            newEl.id = `expiry-${req.requestId}`;
                                                            document.body.appendChild(newEl);
                                                        }

                                                        if (opt.value === 'custom') {
                                                            setCustomExpiryMode(prev => ({ ...prev, [req.requestId]: true }));
                                                            setCustomExpiryDays(prev => ({ ...prev, [req.requestId]: prev[req.requestId] ?? 0 }));
                                                            setCustomExpiryHours(prev => ({ ...prev, [req.requestId]: prev[req.requestId] ?? 1 }));
                                                            setCustomExpiryMinutes(prev => ({ ...prev, [req.requestId]: prev[req.requestId] ?? 0 }));
                                                        } else {
                                                            setCustomExpiryMode(prev => ({ ...prev, [req.requestId]: false }));
                                                            document.getElementById(`expiry-${req.requestId}`).value = opt.value;
                                                            // Force re-render of button styles
                                                            setCustomExpiryTick(prev => ({ ...prev, [req.requestId]: Math.random() }));
                                                        }
                                                    }}
                                                    className={`py-1.5 text-[11px] font-semibold rounded-lg transition-all border ${isSelected
                                                        ? 'bg-[#b2a4ff] text-white border-[#b2a4ff] shadow-sm'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#b2a4ff] hover:text-[#b2a4ff]'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* HIDDEN INPUT FOR LEGACY COMPATIBILITY */}
                                    <input type="hidden" id={`expiry-${req.requestId}`} defaultValue="0" />

                                    {customExpiryMode[req.requestId] && (
                                        <div className="flex justify-between items-center gap-2 mt-2 bg-gray-50 p-2.5 rounded-xl border border-[#b2a4ff]/30 shadow-inner">
                                            <div className="flex flex-col items-center flex-1">
                                                <span className="text-[10px] uppercase font-bold text-[#b2a4ff] mb-1">Days</span>
                                                <input
                                                    type="number" min="0" max="365"
                                                    className="w-full text-center border border-gray-200 rounded-lg py-1.5 outline-none focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/30 font-semibold text-gray-700 bg-white transition-all shadow-sm"
                                                    value={customExpiryDays[req.requestId] ?? 0}
                                                    onChange={(e) => setCustomExpiryDays(prev => ({ ...prev, [req.requestId]: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center flex-1">
                                                <span className="text-[10px] uppercase font-bold text-[#b2a4ff] mb-1">Hours</span>
                                                <input
                                                    type="number" min="0" max="23"
                                                    className="w-full text-center border border-gray-200 rounded-lg py-1.5 outline-none focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/30 font-semibold text-gray-700 bg-white transition-all shadow-sm"
                                                    value={customExpiryHours[req.requestId] ?? 1}
                                                    onChange={(e) => setCustomExpiryHours(prev => ({ ...prev, [req.requestId]: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center flex-1">
                                                <span className="text-[10px] uppercase font-bold text-[#b2a4ff] mb-1">Mins</span>
                                                <input
                                                    type="number" min="0" max="59" step="1"
                                                    className="w-full text-center border border-gray-200 rounded-lg py-1.5 outline-none focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/30 font-semibold text-gray-700 bg-white transition-all shadow-sm"
                                                    value={customExpiryMinutes[req.requestId] ?? 0}
                                                    onChange={(e) => setCustomExpiryMinutes(prev => ({ ...prev, [req.requestId]: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 text-xs mt-3">
                                        <button
                                            onClick={() => {
                                                let exp;
                                                if (customExpiryMode[req.requestId]) {
                                                    const d = parseInt(customExpiryDays[req.requestId]) || 0;
                                                    const h = parseInt(customExpiryHours[req.requestId]) || 0;
                                                    const m = parseInt(customExpiryMinutes[req.requestId]) || 0;
                                                    exp = (d * 24) + h + (m / 60);
                                                } else {
                                                    exp = parseFloat(document.getElementById(`expiry-${req.requestId}`).value);
                                                }
                                                handleApprove(req.requestId, req.userId, 'ACCEPT', exp === 0 ? null : exp);
                                            }}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 py-2 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                                        >
                                            Accept Access
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.requestId, req.userId, 'REJECT', null)}
                                            className="px-4 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-200 py-2 rounded-xl font-bold transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* AI Chat Panel */}
                <AIChatPanel isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />

                {/* Main Menu / Properties Panel Slide-out */}
                {(!isViewMode && isMenuOpen) && (
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