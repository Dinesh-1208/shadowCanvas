import React, { useRef, useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

const PRESETS = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'
];

export default function ColorPicker({ color, onChange, className }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

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

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Color Trigger Circle */}
            <button
                className={cn(
                    "w-8 h-8 rounded-full border border-gray-200 shadow-sm transition-transform hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden relative",
                    className
                )}
                style={{ backgroundColor: color }}
                onClick={() => setIsOpen(!isOpen)}
                title="Choose Color"
            >
                {/* Optional: Show check or icon if needed */}
            </button>

            {/* Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-white/90 backdrop-blur-xl border border-white/20 p-3 rounded-xl shadow-2xl w-[200px]"
                    >
                        {/* Saturation/Hue Picker */}
                        <div className="custom-react-colorful mb-3 rounded-lg overflow-hidden">
                            <HexColorPicker color={color} onChange={onChange} />
                        </div>

                        {/* Hex Input */}
                        <div className="flex items-center gap-2 mb-3 bg-white/50 p-1 rounded-md border border-gray-100">
                            <span className="text-xs font-mono text-gray-400 select-none pl-1">#</span>
                            <input
                                type="text"
                                value={color.replace('#', '')}
                                onChange={(e) => {
                                    const val = '#' + e.target.value;
                                    // Basic validation, let react-colorful handle mostly
                                    // Regex for partial hex
                                    if (/^#[0-9A-F]*$/i.test(val) && val.length <= 7) {
                                        onChange(val);
                                    }
                                }}
                                className="w-full bg-transparent border-none text-xs font-mono outline-none text-gray-700 uppercase"
                                spellCheck={false}
                            />
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-6 gap-2">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset}
                                    className="w-5 h-5 rounded-full border border-black/5 hover:scale-125 transition-transform flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: preset }}
                                    onClick={() => onChange(preset)}
                                    title={preset}
                                >
                                </button>
                            ))}
                        </div>

                        {/* Arrow Tip */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 backdrop-blur-xl border-t border-l border-white/20 rotate-45 transform origin-center" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Styles for react-colorful to match theme */}
            <style>{`
                .custom-react-colorful .react-colorful {
                    width: 100%;
                    height: 150px;
                }
                .custom-react-colorful .react-colorful__saturation {
                    border-radius: 8px 8px 0 0;
                }
                .custom-react-colorful .react-colorful__hue {
                    border-radius: 0 0 8px 8px;
                    height: 12px;
                    margin-top: 0;
                }
                .custom-react-colorful .react-colorful__pointer {
                    width: 16px;
                    height: 16px;
                    border: 2px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}
