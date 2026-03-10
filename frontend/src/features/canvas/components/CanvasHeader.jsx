
import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { MoreHorizontal, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function CanvasHeader({ title, setTitle, onMenuClick, readOnly, ownerName, activeUsers = [] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    function handleBlur() {
        if (readOnly) return;
        setIsEditing(false);
        if (tempTitle.trim()) setTitle(tempTitle);
        else setTempTitle(title);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleBlur();
    }

    return (
        <div className="flex items-center gap-3">
            {/* Back to My Canvases */}
            <Link to="/my-canvases" className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </Link>

            {/* Logo/Home Link */}
            <Link to="/" className="hidden xs:flex items-center gap-2 mr-2 sm:mr-4 hover:opacity-80 transition-opacity shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
                </div>
            </Link>

            {/* Menu / Three Dots */}
            {!readOnly && (
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    onClick={onMenuClick}
                >
                    <MoreHorizontal className="h-5 w-5" />
                </Button>
            )}

            {/* Editable Title */}
            <div className="flex flex-col">
                <div className="relative group flex items-center">
                    {isEditing && !readOnly ? (
                        <input
                            autoFocus
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            className="bg-transparent text-sm font-semibold text-gray-900 outline-none border-b border-gray-300 focus:border-blue-500 w-[200px]"
                        />
                    ) : (
                        <div
                            onClick={() => { if (!readOnly) setIsEditing(true); }}
                            className={`text-sm font-semibold text-gray-900 px-1 py-0.5 rounded transition-colors ${readOnly ? '' : 'cursor-text hover:bg-gray-100'}`}
                        >
                            {title}
                        </div>
                    )}
                    {readOnly && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full inline-block">View Only</span>}
                </div>
                {ownerName && ownerName !== 'Unknown' && (
                    <span className="text-xs text-gray-500 px-1 leading-tight">
                        Owned by <span className="font-medium text-gray-700">{ownerName}</span>
                    </span>
                )}
            </div>

            {/* Active Users */}
            {activeUsers && activeUsers.length > 0 && (
                <div className="hidden md:flex flex-row items-center ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200">
                    <div className="flex items-center">
                        <div className="flex">
                            {activeUsers.slice(0, 5).map((user, index) => (
                                <div
                                    key={user.userId}
                                    title={user.userName}
                                    className={`relative group w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white cursor-pointer animate-in fade-in zoom-in duration-150 ease-out ${index > 0 ? '-ml-2' : ''}`}
                                    style={{ backgroundColor: user.color || '#6366f1' }}
                                >
                                    {user.userName ? user.userName.charAt(0).toUpperCase() : '?'}
                                    <div className="absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] sm:text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                        {user.userName}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {activeUsers.length > 5 && (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-bold ring-2 ring-white animate-in fade-in zoom-in duration-150 ease-out -ml-2 z-10">
                                +{activeUsers.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
