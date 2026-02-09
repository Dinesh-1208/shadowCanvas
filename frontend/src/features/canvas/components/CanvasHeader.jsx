
import React, { useState } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function CanvasHeader({ title, setTitle, onMenuClick }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    function handleBlur() {
        setIsEditing(false);
        if (tempTitle.trim()) setTitle(tempTitle);
        else setTempTitle(title);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') handleBlur();
    }

    return (
        <div className="flex items-center gap-3">
            {/* Menu / Three Dots */}
            <Button
                variant="ghost"
                size="iconSm"
                className="text-muted-foreground hover:text-foreground"
                onClick={onMenuClick}
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
                        className="bg-transparent text-sm font-semibold text-foreground outline-none border-b border-primary w-[200px]"
                    />
                ) : (
                    <div
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-semibold text-foreground cursor-text px-1 py-0.5 rounded hover:bg-muted/50 transition-colors"
                    >
                        {title}
                    </div>
                )}
            </div>
        </div>
    );
}
