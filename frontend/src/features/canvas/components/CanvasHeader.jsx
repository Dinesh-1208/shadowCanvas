
import React, { useState } from 'react';
import { MoreHorizontal, Settings2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import CanvasSettingsDialog from './CanvasSettingsDialog';

export function CanvasHeader({ canvas, onMenuClick }) {
    const { title, setTitle } = canvas;
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    function handleBlur() {
        setIsEditing(false);
        if (tempTitle.trim()) setTitle(tempTitle);
        else setTempTitle(title);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleBlur();
    }

    return (
        <>
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm transition-all hover:shadow-md ring-1 ring-black/5">
                {/* Menu / Three Dots */}
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    onClick={onMenuClick}
                    title="Menu"
                >
                    <MoreHorizontal className="h-5 w-5" />
                </Button>

                {/* Editable Title */}
                <div className="relative group">
                    {isEditing ? (
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
                            onClick={() => setIsEditing(true)}
                            className="text-sm font-semibold text-gray-900 cursor-text px-1 py-0.5 rounded hover:bg-gray-100 transition-colors"
                        >
                            {title}
                        </div>
                    )}
                </div>

                {/* Settings Button */}
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="hover:bg-gray-100 text-gray-500 hover:text-gray-900 ml-1"
                    onClick={() => setIsSettingsOpen(true)}
                    title="Canvas Settings"
                >
                    <Settings2 className="h-4 w-4" />
                </Button>

            </div>

            <CanvasSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                canvas={canvas}
            />
        </>
    );
}
