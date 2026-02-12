import React, { useState, useRef, useEffect } from 'react';
import { Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { cn } from '../../../lib/utils'; // Assuming this utility exists

export default function EraserTool({ active, onClick, eraserSize, setEraserSize }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const closeTimerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function onClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, [isOpen]);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    const handleRelease = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 1000);
    };

    const handlePress = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };

    // Handle button click -> if active, toggle popup. If not active, activate tool.
    const handleClick = () => {
        if (active) {
            setIsOpen(!isOpen);
        } else {
            onClick();
            // Optional: Open popup immediately on selection? Maybe not to avoid annoyance.
            // Let's stick to "Click again to open settings"
            setIsOpen(true);
        }
    };

    return (
        <div className="relative inline-block group" ref={containerRef}>
            <Button
                variant="ghost"
                size="iconSm"
                onClick={handleClick}
                className={cn(
                    "transition-all duration-200 relative",
                    active
                        ? "bg-black text-white shadow-md hover:bg-black/90 hover:text-white"
                        : "text-gray-500 hover:bg-black/5 hover:text-black"
                )}
            >
                <Eraser className="h-4 w-4" />

                {/* Visual indicator of size */}
                {active && (
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground ring-1 ring-background">
                        {eraserSize}
                    </span>
                )}
            </Button>

            {/* Left Tooltip */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2 py-1 bg-black text-white text-[10px] font-medium rounded opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
                Eraser (X)
            </span>

            <AnimatePresence>
                {isOpen && active && (
                    <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-12 top-0 z-50 bg-white/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-2xl w-[180px] flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-center text-xs font-semibold text-gray-600">
                            <span>Size</span>
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">{eraserSize}px</span>
                        </div>

                        <Slider
                            min={2} max={50} step={1}
                            value={eraserSize}
                            onChange={(e) => setEraserSize(Number(e.target.value))}
                            onMouseDown={handlePress}
                            onTouchStart={handlePress}
                            onMouseUp={handleRelease}
                            onTouchEnd={handleRelease}
                            className="w-full"
                        />

                        {/* Preview Circle */}
                        <div className="h-12 w-full flex items-center justify-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                            <div
                                className="bg-gray-800 rounded-full transition-all duration-200"
                                style={{ width: eraserSize, height: eraserSize }}
                            />
                        </div>

                        {/* Arrow Tip */}
                        <div className="absolute top-3 -right-1.5 w-3 h-3 bg-white/90 backdrop-blur-xl border-t border-r border-white/20 rotate-45 transform origin-center" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
