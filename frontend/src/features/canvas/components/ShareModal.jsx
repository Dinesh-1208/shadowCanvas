import React, { useState, useEffect } from 'react';
import { updateRoomPassword } from '../../../utils/api';

export default function ShareModal({ isOpen, onClose, roomCode, canvasId, roomPassword, setRoomPassword }) {
    const [isEditingPwd, setIsEditingPwd] = useState(false);
    const [newPwd, setNewPwd] = useState('');
    const [pwdMsg, setPwdMsg] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    // Fade/scale animation handling
    useEffect(() => {
        if (isOpen) {
            requestAnimationFrame(() => setMounted(true));
        } else {
            setMounted(false);
        }
    }, [isOpen]);

    if (!isOpen && !mounted) return null;

    const baselink = `${window.location.protocol}//${window.location.host}/canvas/${roomCode}`;
    const viewLink = `${baselink}?mode=view`;
    const editLink = `${baselink}?mode=edit`;

    const handleCopy = (text, key) => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMessage('Copied to clipboard');
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
            setTimeout(() => setToastMessage(null), 2500);
        }).catch(err => console.error('Failed to copy: ', err));
    };

    const handleUpdatePassword = async (pass) => {
        try {
            setPwdMsg('Updating...');
            const res = await updateRoomPassword(canvasId, pass);
            if (res.success) {
                setRoomPassword(res.password);
                setIsEditingPwd(false);
                setPwdMsg('');
            }
        } catch (err) {
            setPwdMsg(err.response?.data?.error || 'Failed to update password');
        }
    };

    const generatePassword = () => {
        const gen = Math.random().toString(36).slice(-8);
        handleUpdatePassword(gen);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-auto transition-opacity duration-200"
            style={{ opacity: mounted && isOpen ? 1 : 0 }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-[16px] shadow-2xl p-[24px] w-[420px] max-w-[92vw] transition-transform duration-200 relative"
                style={{ transform: mounted && isOpen ? 'scale(1)' : 'scale(0.95)' }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 tracking-tight">Share Canvas</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#b2a4ff] hover:bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-semibold"
                    >
                        &times;
                    </button>
                </div>

                <div className="space-y-6">
                    {/* ROOM ACCESS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[#b2a4ff] uppercase tracking-wider mb-2">Room Access</h3>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">Room Code</label>
                            <div className="flex bg-white rounded-xl p-2 items-center border border-gray-200 transition-all shadow-sm">
                                <span className="flex-1 text-sm text-gray-700 truncate mx-2 font-mono font-bold tracking-wide">{roomCode}</span>
                                <button
                                    onClick={() => handleCopy(roomCode, 'roomCode')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition-all shrink-0 ${copiedKey === 'roomCode'
                                        ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.4)] scale-105'
                                        : 'bg-gradient-to-r from-[#b2a4ff] to-[#9181ec] text-white hover:shadow-[0_4px_12px_rgba(178,164,255,0.4)]'
                                        }`}
                                >
                                    {copiedKey === 'roomCode' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">Room Password</label>
                            {isEditingPwd ? (
                                <div className="flex gap-2 items-center mt-1">
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#b2a4ff] focus:ring-2 focus:ring-[#b2a4ff]/20 transition-all shadow-sm"
                                        value={newPwd}
                                        onChange={(e) => setNewPwd(e.target.value)}
                                        placeholder="New Password"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => handleUpdatePassword(newPwd || null)}
                                        className="px-4 py-1.5 bg-gradient-to-r from-[#b2a4ff] to-[#9181ec] text-white rounded-lg text-xs font-semibold hover:shadow-[0_4px_12px_rgba(178,164,255,0.4)] hover:-translate-y-0.5 transition-all shrink-0"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPwd(false)}
                                        className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 font-semibold transition-colors shrink-0"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex bg-white rounded-xl p-2 items-center border border-gray-200 shadow-sm">
                                        <span className={`flex-1 text-sm truncate mx-2 font-mono ${roomPassword ? 'text-gray-700 font-bold tracking-wide' : 'text-gray-400 italic'}`}>
                                            {roomPassword ? '••••••••' : 'None'}
                                        </span>
                                        {roomPassword && (
                                            <button
                                                onClick={() => handleCopy(roomPassword, 'roomPwd')}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition-all shrink-0 ${copiedKey === 'roomPwd'
                                                    ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.4)] scale-105'
                                                    : 'bg-gradient-to-r from-[#b2a4ff] to-[#9181ec] text-white hover:shadow-[0_4px_12px_rgba(178,164,255,0.4)]'
                                                    }`}
                                            >
                                                {copiedKey === 'roomPwd' ? 'Copied!' : 'Copy'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-2 px-1">
                                        {!roomPassword ? (
                                            <button
                                                onClick={generatePassword}
                                                className="text-xs font-semibold text-[#b2a4ff] hover:text-[#9181ec] transition-colors"
                                            >
                                                Generate Password
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setIsEditingPwd(true); setNewPwd(''); }}
                                                    className="text-xs font-semibold text-[#b2a4ff] hover:text-[#9181ec] transition-colors"
                                                >
                                                    Edit Password
                                                </button>
                                                <button
                                                    onClick={() => handleUpdatePassword(null)}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    Remove Password
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    {pwdMsg && <p className="text-xs text-[#9181ec] mt-2 font-medium px-1">{pwdMsg}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LINK ACCESS */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold text-[#b2a4ff] uppercase tracking-wider mb-2">Link Access</h3>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">View Link</label>
                            <div className="flex bg-white rounded-xl p-2 items-center border border-gray-200 shadow-sm">
                                <span className="flex-1 text-sm text-gray-600 truncate mx-2">{viewLink}</span>
                                <button
                                    onClick={() => handleCopy(viewLink, 'viewLink')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition-all shrink-0 ${copiedKey === 'viewLink'
                                        ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.4)] scale-105'
                                        : 'bg-gradient-to-r from-[#b2a4ff] to-[#9181ec] text-white hover:shadow-[0_4px_12px_rgba(178,164,255,0.4)]'
                                        }`}
                                >
                                    {copiedKey === 'viewLink' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700">Edit Link</label>
                            <div className="flex bg-white rounded-xl p-2 items-center border border-gray-200 shadow-sm">
                                <span className="flex-1 text-sm text-gray-600 truncate mx-2">{editLink}</span>
                                <button
                                    onClick={() => handleCopy(editLink, 'editLink')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold hover:-translate-y-0.5 transition-all shrink-0 ${copiedKey === 'editLink'
                                        ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.4)] scale-105'
                                        : 'bg-gradient-to-r from-[#b2a4ff] to-[#9181ec] text-white hover:shadow-[0_4px_12px_rgba(178,164,255,0.4)]'
                                        }`}
                                >
                                    {copiedKey === 'editLink' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-gray-900/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                >
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
