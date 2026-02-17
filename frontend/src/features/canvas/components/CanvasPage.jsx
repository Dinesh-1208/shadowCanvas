import React, { useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { CanvasHeader } from './CanvasHeader';
import { cn } from '../../../lib/utils';
// import '../styles/global.css'; // Imported in index.js usually, but ensuring it's loaded

import { useLocation, useParams } from 'react-router-dom';

export default function CanvasPage() {
    const { roomCode } = useParams();
    const location = useLocation();
    const canvas = useCanvas(location.state, roomCode);
    const [isMenuOpen, setMenuOpen] = React.useState(false);



    // ─── Global shortcuts ────────────────────────────────────
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                canvas.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                canvas.redo();
            }
            if ((e.key === 'Delete' || e.key === 'Backspace') && canvas.selectedId) {
                e.preventDefault();
                canvas.deleteElement(canvas.selectedId);
            }
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.target.matches('input, textarea')) {
                switch (e.key.toLowerCase()) {
                    case 'v': canvas.setTool('select'); break;
                    case 'h': canvas.setTool('hand'); break;
                    case 'r': canvas.setTool('rect'); break;
                    case 'd': canvas.setTool('diamond'); break;
                    case 'o': /* Figma uses O for oval */
                    case 'e': canvas.setTool('circle'); break;
                    case 'a': canvas.setTool('arrow'); break;
                    case 'p': canvas.setTool('pencil'); break;
                    case 't': canvas.setTool('text'); break;
                    default: break;
                }
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canvas]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-white">

            {/* 1. Full Screen Canvas Layer */}
            <div id="canvas-root" className="absolute inset-0 z-0">
                <Canvas
                    elements={canvas.elements}
                    selectedId={canvas.selectedId}
                    setSelectedId={canvas.setSelectedId}
                    tool={canvas.tool}
                    currentStyle={canvas.currentStyle}
                    zoom={canvas.zoom}
                    setZoom={canvas.setZoom}
                    pan={canvas.pan}
                    setPan={canvas.setPan}
                    addElement={canvas.addElement}
                    deleteElement={canvas.deleteElement}
                    moveElement={canvas.moveElement}
                    commitMove={canvas.commitMove}
                    resizeElement={canvas.resizeElement}
                    commitResize={canvas.commitResize}
                    reorderElement={canvas.reorderElement}
                    onThumbnailUpdate={canvas.updateThumbnail}
                />
            </div>

            {/* 2. UI Overlay Layer (Pointer events go through empty areas) */}
            <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-4">

                {/* Top Bar: Robust 3-column layout */}
                <div className="grid grid-cols-3 items-center w-full max-w-full gap-2 lg:gap-4">

                    {/* Left side: Header (Logo + Title) and Share */}
                    <div className="flex items-center gap-2 pointer-events-auto min-w-0 overflow-hidden">
                        <CanvasHeader
                            title={canvas.title}
                            setTitle={canvas.setTitle}
                            onMenuClick={() => setMenuOpen(!isMenuOpen)}
                        />
                    </div>

                    {/* Center side: Floating Toolbar */}
                    <div className="flex justify-center pointer-events-none">
                        <div className="pointer-events-auto">
                            <Toolbar
                                tool={canvas.tool}
                                setTool={canvas.setTool}
                                undo={canvas.undo}
                                redo={canvas.redo}
                                zoom={canvas.zoom}
                                setZoom={canvas.setZoom}
                                clearCanvas={canvas.clearCanvas}
                            />
                        </div>
                    </div>

                    {/* Right side: Actions / Status */}
                    <div className="flex justify-end items-center gap-2 pointer-events-auto shrink-0">
                        {/* Empty for now to preserve center alignment */}
                    </div>
                </div>

                {/* Main Menu / Properties Panel Slide-out */}
                {isMenuOpen && (
                    <div className="mt-4 pointer-events-none">
                        <div className="w-64 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl shadow-2xl pointer-events-auto bg-white border border-gray-100">
                            <PropertiesPanel canvas={canvas} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}