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
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/90 backdrop-blur-xl border border-white/20 flex flex-col items-center p-2 rounded-full gap-2 shadow-2xl cursor-default ring-1 ring-black/5"
        >

            {/* Undo/Redo Group */}
            <div className="flex flex-col gap-1">
                <ToolBtn label="Undo" onClick={undo} icon={Undo2} shortcut="Ctrl+Z" />
                <ToolBtn label="Redo" onClick={redo} icon={Redo2} shortcut="Ctrl+Y" />
            </div>

            <Separator orientation="horizontal" className="w-6 mx-auto bg-black/10" />

            {/* Main Tools */}
            <div className="flex flex-col items-center gap-1">
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

                <Separator orientation="horizontal" className="w-4 mx-auto opacity-30 bg-black/10" />

                {/* Shapes Dropdown through ShapeTool */}
                <ShapeTool currentTool={tool} setTool={setTool} vertical={true} />

                <Separator orientation="horizontal" className="w-4 mx-auto opacity-30 bg-black/10" />

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
                                vertical={true}
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

                <Separator orientation="horizontal" className="w-4 mx-auto opacity-30 bg-black/10" />

                {/* Color Picker Vertical */}
                <ColorPicker
                    color={strokeColor}
                    onChange={setStrokeColor}
                    vertical={true}
                />

                <Separator orientation="horizontal" className="w-4 mx-auto opacity-30 bg-black/10" />

                <ToolBtn
                    label="Clear Canvas"
                    onClick={() => {
                        if (window.confirm('Clear entire canvas?')) clearCanvas();
                    }}
                    icon={Trash2}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                />
            </div>

            <Separator orientation="horizontal" className="w-6 mx-auto bg-black/10" />

            {/* Zoom Controls */}
            <div className="flex flex-col items-center gap-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="text-[10px] font-mono text-muted-foreground w-8 h-8 rounded-full"
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

// ─── Sub-components ───

function ToolBtn({ active, onClick, icon: Icon, label, className, shortcut }) {
    return (
        <div className="relative group/btn flex items-center">
            <Button
                variant="ghost"
                size="iconSm"
                onClick={onClick}
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

            {/* Left Tooltip */}
            <span className="absolute right-full mr-2 px-2 py-1 bg-black text-white text-[10px] font-medium rounded opacity-0 translate-x-1 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                {label} {shortcut && <span className="opacity-50 ml-1">({shortcut})</span>}
            </span>
        </div>
    );
}
