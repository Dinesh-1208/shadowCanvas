import React, { useState, useEffect } from 'react';

const LAVENDER = "#b2a4ff";
const LAVENDER_DARK = "#9181ec";

export default function LiveCursors({ activeCursors, zoom, pan }) {
    // Force a re-render periodically to check for 3-second inactivity
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    if (!activeCursors) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[45] overflow-hidden">
            {Object.entries(activeCursors).map(([userId, cursor]) => {
                // hide cursors after 3 seconds of inactivity to reduce visual noise
                if (Date.now() - cursor.lastUpdate > 3000) return null;

                const screenX = cursor.x * zoom + pan.x;
                const screenY = cursor.y * zoom + pan.y;

                return (
                    <div
                        key={userId}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            transform: `translate(${screenX}px, ${screenY}px)`,
                            transition: 'transform 0.1s ease-out',
                        }}
                    >
                        {/* Cursor Icon: white with lavender border */}
                        <svg
                            width="24"
                            height="36"
                            viewBox="0 0 24 36"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                transform: 'translate(-4px, -2px)'
                            }}
                        >
                            <path
                                d="M5.65376 2.15376C5.40189 1.90189 5 2.08036 5 2.43689V23.5631C5 23.9196 5.40189 24.0981 5.65376 23.8462L11 18.5H19.5631C19.9196 18.5 20.0981 18.0981 19.8462 17.8462L5.65376 2.15376Z"
                                fill="#ffffff"
                                stroke={LAVENDER_DARK}
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                            />
                        </svg>

                        {/* User Name Tag: lavender gradient, border radius 8px */}
                        <div
                            style={{
                                position: 'absolute',
                                left: 16,
                                top: 16,
                                background: `linear-gradient(135deg, ${LAVENDER}, ${LAVENDER_DARK})`,
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            {cursor.userName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
