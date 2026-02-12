import React, { useRef } from 'react';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import {
    MousePointer2, Hand, Pen, Type, Image as ImageIcon,
    Undo2, Redo2, Trash2, PaintBucket
} from 'lucide-react';
import ColorPicker from './ColorPicker';
import EraserTool from './EraserTool';
import ShapeTool from './ShapeTool';

const TOOLS = [
    { id: 'select', label: 'Select', icon: MousePointer2, shortcut: 'V' },
    { id: 'hand', label: 'Hand', icon: Hand, shortcut: 'H' },
    // Shapes are handled by ShapeTool
    { id: 'pencil', label: 'Pencil', icon: Pen, shortcut: 'P' },
    { id: 'text', label: 'Text', icon: Type, shortcut: 'T' },
    { id: 'image', label: 'Image', icon: ImageIcon, shortcut: 'I' },
    { id: 'paint-bucket', label: 'Paint Bucket', icon: PaintBucket, shortcut: 'B' },
    { id: 'eraser', label: 'Eraser', icon: null, shortcut: 'X' }, // Icon handled by component
];

export default function Toolbar({
    tool, setTool, undo, redo, zoom, setZoom, clearCanvas,
    strokeColor, setStrokeColor, eraserSize, setEraserSize
}) {
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
            className="bg-white/80 backdrop-blur-xl border border-white/20 flex items-center p-1.5 rounded-full gap-1 shadow-2xl cursor-default ring-1 ring-black/5"
        >

            {/* Undo/Redo Group */}
            <div className="flex items-center gap-1">
                <ToolBtn label="Undo" onClick={undo} icon={Undo2} shortcut="Ctrl+Z" />
                <ToolBtn label="Redo" onClick={redo} icon={Redo2} shortcut="Ctrl+Y" />
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Main Tools */}
            <div className="flex items-center gap-1">
                {TOOLS.slice(0, 2).map(t => (
                    <ToolBtn
                        key={t.id}
                        active={tool === t.id}
                        label={t.label}
                        onClick={() => setTool(t.id)}
                        icon={t.icon}
                        shortcut={t.shortcut}
                    />
                ))}

                <Separator orientation="vertical" className="h-4 mx-0.5 opacity-30" />

                {/* Shapes Dropdown through ShapeTool */}
                <ShapeTool currentTool={tool} setTool={setTool} />

                <Separator orientation="vertical" className="h-4 mx-0.5 opacity-30" />

                {TOOLS.slice(2).map(t => {
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
                                    shortcut={t.shortcut}
                                />
                            </React.Fragment>
                        )
                    }

                    if (t.id === 'eraser') {
                        return (
                            <EraserTool
                                key={t.id}
                                active={isActive}
                                onClick={() => setTool(t.id)}
                                eraserSize={eraserSize}
                                setEraserSize={setEraserSize}
                            />
                        );
                    }

                    return (
                        <ToolBtn
                            key={t.id}
                            active={isActive}
                            label={t.label}
                            onClick={() => setTool(t.id)}
                            icon={Icon}
                            shortcut={t.shortcut}
                        />
                    );
                })}

                <Separator orientation="vertical" className="h-4 mx-0.5 opacity-30" />

                {/* Color Picker */}
                <ColorPicker
                    color={strokeColor}
                    onChange={setStrokeColor}
                />

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

function ToolBtn({ active, onClick, icon: Icon, label, className, shortcut }) {
    return (
        <Button
            variant="ghost"
            size="iconSm"
            onClick={onClick}
            title={`${label} ${shortcut ? `(${shortcut})` : ''}`}
            className={cn(
                "transition-all duration-200",
                active
                    ? "bg-black text-white shadow-md hover:bg-black/90 hover:text-white"
                    : "text-gray-500 hover:bg-black/5 hover:text-black",
                className
            )}
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}
