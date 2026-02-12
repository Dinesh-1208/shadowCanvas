import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer }) {
    // Close on Escape
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' && isOpen) onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Dialog Panel */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", duration: 0.3 }}
                    className="relative w-full max-w-md overflow-hidden rounded-xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900 tracking-tight">
                            {title}
                        </h3>
                        <button
                            onClick={onClose}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-2 text-sm text-gray-500">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                            {footer}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
