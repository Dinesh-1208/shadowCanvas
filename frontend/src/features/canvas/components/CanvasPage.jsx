import React, { useEffect } from 'react';
import { useCanvas } from '../hooks/useCanvas';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import PropertiesPanel from './PropertiesPanel';
import { CanvasHeader } from './CanvasHeader';
import { cn } from '../../../lib/utils';
// import '../styles/global.css'; // Imported in index.js usually, but ensuring it's loaded

export default function CanvasPage() {
    const canvas = useCanvas();
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
        <div className="relative w-screen h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900">
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
                    updateElement={canvas.updateElement}
                    deleteElement={canvas.deleteElement}
                    moveElement={canvas.moveElement}
                    commitMove={canvas.commitMove}
                    resizeElement={canvas.resizeElement}
                    commitResize={canvas.commitResize}
                    reorderElement={canvas.reorderElement}
                    backgroundColor={canvas.backgroundColor}
                    setBackgroundColor={canvas.changeBackgroundColor}
                    erasePath={canvas.erasePath}
                    canvasSize={canvas.canvasSize}
                    eraserSize={canvas.eraserSize}
                />
            </div>

            {/* 2. UI Overlay Layer (Pointer events go through empty areas) */}
            <div className="absolute inset-0 z-10 pointer-events-none">

                {/* Top Left: Menu & Title */}
                <div className="absolute top-4 left-4 pointer-events-auto z-50 flex flex-col gap-2">
                    <CanvasHeader
                        canvas={canvas}
                        onMenuClick={() => setMenuOpen(!isMenuOpen)}
                    />

                    {/* Main Menu / Properties Panel Slide-out */}
                    {isMenuOpen && (
                        <div className="relative z-50">
                            <div className="absolute top-0 left-0 w-56 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl shadow-2xl">
                                <PropertiesPanel canvas={canvas} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Floating Toolbar (Vertical) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
                    <Toolbar
                        tool={canvas.tool}
                        setTool={canvas.setTool}
                        undo={canvas.undo}
                        redo={canvas.redo}
                        zoom={canvas.zoom}
                        setZoom={canvas.setZoom}
                        clearCanvas={canvas.clearCanvas}
                        strokeColor={canvas.strokeColor}
                        setStrokeColor={canvas.setStrokeColor}
                        fillColor={canvas.fillColor}
                        setFillColor={canvas.setFillColor}
                        eraserSize={canvas.eraserSize}
                        setEraserSize={canvas.setEraserSize}
                    />
                </div>

            </div>
        </div>
    );
}
