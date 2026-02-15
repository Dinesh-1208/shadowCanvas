
import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import { MoreHorizontal, ArrowLeft } from 'lucide-react';
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
            <div className="flex items-center gap-3">
                {/* Back Button */}
                <Link to="/my-canvases">
                    <Button variant="ghost" size="iconSm" className="mr-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>

                {/* Logo/Home Link */}
                <Link to="/" className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
                    </div>
                </Link>

                {/* Menu / Three Dots */}
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                    onClick={onMenuClick}
                >
                    <MoreHorizontal className="h-5 w-5" />
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
