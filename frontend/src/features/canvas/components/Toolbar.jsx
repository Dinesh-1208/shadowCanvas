import React, { useRef } from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import {
    MousePointer2, Hand, Square, Circle, Diamond, ArrowRight, Pen, Type, Image as ImageIcon,
    Undo2, Redo2, Eraser, Trash2
} from 'lucide-react';

const TOOLS = [
    { id: 'select', label: 'Select', icon: MousePointer2 },
    { id: 'hand', label: 'Hand', icon: Hand },
    { id: 'rect', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Ellipse', icon: Circle },
    { id: 'diamond', label: 'Diamond', icon: Diamond },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'pencil', label: 'Pencil', icon: Pen },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
];

export default function Toolbar({ tool, setTool, undo, redo, zoom, setZoom, clearCanvas }) {
    const fileRef = useRef(null);

    function handleImageUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            window.dispatchEvent(new CustomEvent('sc:insert-image', { detail: { src: ev.target.result } }));
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border border-gray-200 flex items-center p-1.5 rounded-full gap-1 shadow-lg cursor-default"
        >

            {/* Undo/Redo Group */}
            <div className="flex items-center gap-1">
                <ToolBtn label="Undo" onClick={undo} icon={Undo2} />
                <ToolBtn label="Redo" onClick={redo} icon={Redo2} />
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Main Tools */}
            <div className="flex items-center gap-1">
                {TOOLS.map(t => {
                    const isActive = tool === t.id;
                    const Icon = t.icon;

                    if (t.id === 'image') {
                        return (
                            <React.Fragment key={t.id}>
                                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                <ToolBtn
                                    active={isActive}
                                    label={t.label}
                                    onClick={() => fileRef.current?.click()}
                                    icon={Icon}
                                />
                            </React.Fragment>
                        )
                    }

                    return (
                        <ToolBtn
                            key={t.id}
                            active={isActive}
                            label={t.label}
                            onClick={() => setTool(t.id)}
                            icon={Icon}
                        />
                    );
                })}

                <Separator orientation="vertical" className="h-4 mx-0.5 opacity-30" />

                <ToolBtn
                    label="Clear Canvas"
                    onClick={() => {
                        if (window.confirm('Clear entire canvas?')) clearCanvas();
                    }}
                    icon={Trash2}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                />
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 px-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-mono text-muted-foreground w-16"
                    onClick={() => setZoom(1)}
                    title="Reset Zoom"
                >
                    {Math.round(zoom * 100)}%
                </Button>
            </div>

        </motion.div>
    );
}

// ─── Sub-components ───

function ToolBtn({ active, onClick, icon: Icon, label, className }) {
    return (
        <Button
            variant={active ? "default" : "ghost"}
            size="iconSm"
            onClick={onClick}
            title={label}
            className={cn(active ? "shadow-md" : "text-muted-foreground", className)}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
