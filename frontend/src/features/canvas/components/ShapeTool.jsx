import React, { useState, useRef, useEffect } from 'react';
import { Square, Circle, Diamond, ArrowRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';

const SHAPES = [
    { id: 'rect', label: 'Rectangle', icon: Square, shortcut: 'R' },
    { id: 'circle', label: 'Ellipse', icon: Circle, shortcut: 'E' },
    { id: 'diamond', label: 'Diamond', icon: Diamond, shortcut: 'D' },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight, shortcut: 'A' },
];

export default function ShapeTool({ currentTool, setTool }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Determine if one of the shape tools is active
    const activeShape = SHAPES.find(s => s.id === currentTool);
    const isActive = !!activeShape;

    // Default to Rectangle if no shape is active, or use the active one
    const displayShape = activeShape || SHAPES[0];
    const DisplayIcon = displayShape.icon;

    useEffect(() => {
        function onClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, [isOpen]);

    const handleClick = () => {
        if (isActive) {
            setIsOpen(!isOpen);
        } else {
            setTool(displayShape.id);
            // Optional: auto-open? no.
        }
    };

    return (
        <div className="relative inline-block group" ref={containerRef}>
            <Button
                variant="ghost"
                size="iconSm"
                onClick={handleClick}
                title={isActive ? `Shapes (Current: ${displayShape.label})` : "Shapes"}
                className={cn(
                    "transition-all duration-200 relative gap-1 px-2 w-auto",
                    isActive
                        ? "bg-black text-white shadow-md hover:bg-black/90 hover:text-white"
                        : "text-gray-500 hover:bg-black/5 hover:text-black"
                )}
            >
                <DisplayIcon className="h-4 w-4" />
                <ChevronDown className={`h-3 w-3 opacity-50 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Left Tooltip */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-[10px] font-medium rounded opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                Shapes
            </span>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-12 top-0 z-50 bg-white/90 backdrop-blur-xl border border-white/20 p-2 rounded-xl shadow-2xl flex flex-col gap-1 w-[140px]"
                    >
                        {SHAPES.map(shape => {
                            const Icon = shape.icon;
                            const isShapeActive = currentTool === shape.id;
                            return (
                                <button
                                    key={shape.id}
                                    onClick={() => {
                                        setTool(shape.id);
                                        setIsOpen(false);
                                    }}
                                    title={`${shape.label} (${shape.shortcut})`}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors flex items-center gap-3 w-full text-left",
                                        isShapeActive
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-black/5 text-gray-600"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-xs font-medium">{shape.label}</span>
                                </button>
                            );
                        })}
                        {/* Arrow Tip */}
                        <div className="absolute top-3 -right-1.5 w-3 h-3 bg-white/90 backdrop-blur-xl border-t border-r border-white/20 rotate-45 transform origin-center" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
