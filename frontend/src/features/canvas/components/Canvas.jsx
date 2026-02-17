import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ElementRenderer } from './Elements';
import { hitTest, elementBBox, getResizeHandles } from '../utils/geometry';
import { generateThumbnail } from '../utils/thumbnail';


export default function Canvas({
    elements, selectedId, setSelectedId, tool,
    currentStyle, zoom, setZoom, pan, setPan,
    addElement, deleteElement, moveElement, commitMove,
    resizeElement, commitResize, reorderElement,
    onThumbnailUpdate, // New prop
}) {
    const svgRef = useRef(null);
    const [drawing, setDrawing] = useState(null); // current in-progress element
    const [dragging, setDragging] = useState(null); // { startX, startY, elStartX, elStartY }
    const [resizing, setResizing] = useState(null); // { handleId, startX, startY, origBBox }
    const [panning, setPanning] = useState(null);
    const [textEditing, setTextEditing] = useState(null); // { id, x, y }
    const [textInput, setTextInput] = useState('');
    const [spacePressed, setSpacePressed] = useState(false);
    const textRef = useRef(null);

    // ─── Listen for image insert events from toolbar ──────────
    useEffect(() => {
        function onImage(e) {
            const { src } = e.detail;
            const img = new Image();
            img.onload = () => {
                const maxW = 300;
                const scale = img.width > maxW ? maxW / img.width : 1;
                addElement({
                    type: 'image',
                    x: -pan.x / zoom + 80,
                    y: -pan.y / zoom + 80,
                    width: img.width * scale,
                    height: img.height * scale,
                    src,
                    ...currentStyle,
                });
            };
            img.src = src;
        }
        window.addEventListener('sc:insert-image', onImage);
        return () => window.removeEventListener('sc:insert-image', onImage);
    }, [pan, zoom, currentStyle, addElement]);


    // ─── Auto-Generate Thumbnail ──────────────────────────────
    useEffect(() => {
        if (!onThumbnailUpdate) return;

        const timer = setTimeout(async () => {
            console.log("Generating thumbnail...", elements.length);
            try {
                const dataUrl = await generateThumbnail(svgRef.current, elements);
                console.log("Thumbnail generated size:", dataUrl ? dataUrl.length : 0);
                if (dataUrl) {
                    onThumbnailUpdate(dataUrl);
                }
            } catch (err) {
                console.error("Thumbnail generation error:", err);
            }
        }, 1500); // Debounce 1.5s

        return () => clearTimeout(timer);
    }, [elements, onThumbnailUpdate]);

    // ─── Keyboard shortcuts ───────────────────────────────────
    useEffect(() => {
        function onKeyDown(e) {
            if (textEditing) return; // don't interfere with text input

            if (e.code === 'Space') {
                setSpacePressed(true);
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) { e.preventDefault(); deleteElement(selectedId); }
            }
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); /* undo handled by parent */ }
            }
        }

        function onKeyUp(e) {
            if (e.code === 'Space') {
                setSpacePressed(false);
            }
        }

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [selectedId, textEditing, deleteElement]);

    // ─── Focus text input when editing ────────────────────────
    useEffect(() => {
        if (textEditing && textRef.current) textRef.current.focus();
    }, [textEditing]);

    // ─── SVG coordinate from mouse event ──────────────────────
    const getSVGPoint = useCallback((e) => {
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        return {
            x: (clientX / zoom) - (pan.x / zoom),
            y: (clientY / zoom) - (pan.y / zoom),
        };
    }, [zoom, pan]);

    // ─── POINTER DOWN ─────────────────────────────────────────
    function onPointerDown(e) {
        if (e.target.closest('.text-input-overlay')) return; // Allow text selection
        e.preventDefault();
        const pt = getSVGPoint(e);

        // 1. Eraser Tool Logic
        if (tool === 'eraser') {
            const clickedEl = findTopElement(pt.x, pt.y);
            if (clickedEl) {
                deleteElement(clickedEl.id);
                return; // Stop event propagation
            }
        }

        // 2. Pan Tool Logic (Spacebar or Hand tool)
        if (tool === 'hand' || e.buttons === 4 || spacePressed) {
            setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
            return;
        }

        // ── Text tool ──
        if (tool === 'text') {
            // Start text editing
            setTextEditing({ x: pt.x, y: pt.y });
            setTextInput('');
            return;
        }

        // ── Select tool ──
        if (tool === 'select') {
            // Check if clicking a resize handle
            if (selectedId) {
                const selEl = elements.find(el => el.id === selectedId);
                if (selEl) {
                    const bb = elementBBox(selEl);
                    const handles = getResizeHandles(bb);
                    for (const h of handles) {
                        if (Math.abs(pt.x - h.x) < 6 && Math.abs(pt.y - h.y) < 6) {
                            setResizing({ handleId: h.id, startX: pt.x, startY: pt.y, origBBox: bb, elId: selectedId });
                            return;
                        }
                    }
                }
            }

            // Check hit on any element (top-most first)
            const hit = findTopElement(pt.x, pt.y);
            if (hit) {
                setSelectedId(hit.id);
                setDragging({ startX: pt.x, startY: pt.y, elId: hit.id });
            } else {
                setSelectedId(null);
            }
            return;
        }

        // ── Shape tools: rect, diamond, circle ──
        if (['rect', 'diamond', 'circle'].includes(tool)) {
            setDrawing({
                type: tool,
                x: pt.x, y: pt.y,
                width: 0, height: 0,
                ...currentStyle,
            });
            return;
        }

        // ── Arrow ──
        if (tool === 'arrow') {
            setDrawing({
                type: 'arrow',
                x1: pt.x, y1: pt.y,
                x2: pt.x, y2: pt.y,
                ...currentStyle,
            });
            return;
        }

        // ── Pencil / Freehand ──
        if (tool === 'pencil') {
            setDrawing({
                type: 'freehand',
                points: [{ x: pt.x, y: pt.y }],
                ...currentStyle,
            });
            return;
        }
    }

    // ─── POINTER MOVE ─────────────────────────────────────────
    function onPointerMove(e) {
        const pt = getSVGPoint(e);

        // Panning
        if (panning) {
            const dx = e.clientX - panning.startX;
            const dy = e.clientY - panning.startY;
            setPan({ x: panning.panX + dx, y: panning.panY + dy });
            return;
        }

        // Dragging selected element
        if (dragging) {
            const dx = pt.x - dragging.startX;
            const dy = pt.y - dragging.startY;
            moveElement(dragging.elId, dx - (dragging.lastDx || 0), dy - (dragging.lastDy || 0));
            setDragging(prev => ({ ...prev, lastDx: dx, lastDy: dy }));
            return;
        }

        // Resizing
        if (resizing) {
            handleResize(pt);
            return;
        }

        // Drawing shapes
        if (drawing) {
            if (drawing.type === 'freehand') {
                setDrawing(prev => ({
                    ...prev,
                    points: [...prev.points, { x: pt.x, y: pt.y }],
                }));
            } else if (drawing.type === 'arrow') {
                setDrawing(prev => ({ ...prev, x2: pt.x, y2: pt.y }));
            } else {
                // rect, diamond, circle
                setDrawing(prev => ({
                    ...prev,
                    width: pt.x - prev.x,
                    height: pt.y - prev.y,
                }));
            }
        }
    }

    // ─── POINTER UP ───────────────────────────────────────────
    function onPointerUp(e) {
        // Finish panning
        if (panning) { setPanning(null); return; }

        // Finish dragging
        if (dragging) {
            commitMove(dragging.elId);
            setDragging(null);
            return;
        }

        // Finish resizing
        if (resizing) {
            commitResize(resizing.elId);
            setResizing(null);
            return;
        }

        // Finish drawing
        if (drawing) {
            let finalEl = drawing;
            // Normalize negative width/height for shapes
            if (['rect', 'diamond', 'circle'].includes(drawing.type)) {
                let { x, y, width, height } = drawing;
                if (width < 0) { x += width; width = -width; }
                if (height < 0) { y += height; height = -height; }
                if (width < 5 && height < 5) { setDrawing(null); return; } // too small
                finalEl = { ...drawing, x, y, width, height };
            }
            if (drawing.type === 'arrow') {
                const dx = drawing.x2 - drawing.x1;
                const dy = drawing.y2 - drawing.y1;
                if (Math.sqrt(dx * dx + dy * dy) < 10) { setDrawing(null); return; }
            }
            if (drawing.type === 'freehand') {
                if (drawing.points.length < 3) { setDrawing(null); return; }
            }
            addElement(finalEl);
            setDrawing(null);
        }
    }

    // ─── Resize logic ────────────────────────────────────────
    function handleResize(pt) {
        const { handleId, startX, startY, origBBox, elId } = resizing;
        const el = elements.find(e => e.id === elId);
        if (!el || !origBBox) return;

        const dx = pt.x - startX;
        const dy = pt.y - startY;

        let newX = origBBox.x, newY = origBBox.y;
        let newW = origBBox.width, newH = origBBox.height;

        if (handleId.includes('e')) newW = Math.max(20, origBBox.width + dx);
        if (handleId.includes('s')) newH = Math.max(20, origBBox.height + dy);
        if (handleId.includes('w')) { newX = origBBox.x + dx; newW = Math.max(20, origBBox.width - dx); }
        if (handleId.includes('n')) { newY = origBBox.y + dy; newH = Math.max(20, origBBox.height - dy); }

        resizeElement(elId, { x: newX, y: newY, width: newW, height: newH });
    }

    // ─── Scroll zoom ──────────────────────────────────────────
    function onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(5, zoom * factor));
        const rect = svgRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newPanX = mx - (mx - pan.x) * (newZoom / zoom);
        const newPanY = my - (my - pan.y) * (newZoom / zoom);
        setPan({ x: newPanX, y: newPanY });
        setZoom(newZoom);
        e.stopPropagation();
    }

    // ─── Find topmost element at point ────────────────────────
    function findTopElement(px, py) {
        for (let i = elements.length - 1; i >= 0; i--) {
            if (hitTest(px, py, elements[i])) return elements[i];
        }
        return null;
    }

    // ─── Commit text ──────────────────────────────────────────
    function commitText() {
        if (textInput.trim()) {
            addElement({
                type: 'text',
                x: textEditing.x,
                y: textEditing.y,
                width: Math.max(120, textInput.length * (currentStyle.fontSize || 16) * 0.6),
                height: 40,
                text: textInput,
                fontSize: currentStyle.fontSize || 16,
                fontFamily: currentStyle.fontFamily || 'normal',
                textAlign: currentStyle.textAlign || 'left',
                strokeColor: currentStyle.strokeColor,
                opacity: currentStyle.opacity,
            });
        }
        setTextEditing(null);
        setTextInput('');
    }

    // ─── Selection handles ────────────────────────────────────
    function renderSelectionBox() {
        if (!selectedId) return null;
        const sel = elements.find(el => el.id === selectedId);
        if (!sel) return null;
        const bb = elementBBox(sel);
        if (!bb) return null;
        const handles = getResizeHandles(bb);
        return (
            <g>
                {/* Dashed selection outline */}
                <rect
                    x={bb.x - 3} y={bb.y - 3}
                    width={bb.width + 6} height={bb.height + 6}
                    fill="none"
                    stroke="var(--primary-500)"
                    strokeWidth={1.5}
                    strokeDasharray="5,3"
                    rx={4}
                />
                {/* Resize handles */}
                {handles.map(h => (
                    <rect
                        key={h.id}
                        x={h.x - 4} y={h.y - 4}
                        width={8} height={8}
                        rx={2}
                        fill="#fff"
                        stroke="var(--primary-500)"
                        strokeWidth={1.5}
                        style={{ cursor: `${h.id}-resize` }}
                    />
                ))}
            </g>
        );
    }

    // ─── Cursor style based on tool ──────────────────────────

    const cursorMap = {
        select: 'default', hand: 'grab', rect: 'crosshair', diamond: 'crosshair',
        circle: 'crosshair', arrow: 'crosshair', pencil: 'crosshair',
        text: 'text', eraser: 'cell', image: 'default',
    };

    return (
        <div className="w-full h-full overflow-hidden touch-none">
            {/* Infinite grid background */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${pan.x % (20 * zoom)}, ${pan.y % (20 * zoom)})`}>
                        <circle cx={1 * zoom} cy={1 * zoom} r={1 * zoom} fill="#d1d5db" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Main drawing SVG */}
            <svg
                ref={svgRef}
                className={`w-full h-full absolute inset-0 touch-none ${cursorMap[tool] === 'grab' ? 'cursor-grab' : cursorMap[tool] === 'text' ? 'cursor-text' : cursorMap[tool] === 'crosshair' ? 'cursor-crosshair' : 'cursor-default'}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onWheel={onWheel}
            >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Render all elements */}
                    {elements.map(el => (
                        <g key={el.id}>
                            <ElementRenderer el={el} />
                        </g>
                    ))}

                    {/* In-progress drawing preview */}
                    {drawing && <ElementRenderer el={drawing} />}

                    {/* Selection box + handles */}
                    {renderSelectionBox()}
                </g>
            </svg>

            {/* Text editing overlay */}
            {textEditing && (
                <div
                    className="text-input-overlay"
                    style={{
                        position: 'absolute',
                        left: textEditing.x * zoom + pan.x,
                        top: textEditing.y * zoom + pan.y,
                        zIndex: 50,
                    }}>
                    <textarea
                        ref={textRef}
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onBlur={commitText}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
                            if (e.key === 'Escape') { setTextEditing(null); setTextInput(''); }
                        }}
                        style={{
                            ...styles.textInput,
                            fontSize: currentStyle.fontSize || 16,
                            fontFamily: currentStyle.fontFamily === 'handwriting' ? "'Comic Sans MS', cursive"
                                : currentStyle.fontFamily === 'code' ? "'Consolas', monospace"
                                    : "'Inter', sans-serif",
                            textAlign: currentStyle.textAlign || 'left',
                            color: currentStyle.strokeColor || '#1f2937',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

const styles = {
    canvasContainer: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        // Background is handled by parent App.jsx or global.css (var(--bg-app))
    },
    svg: {
        width: '100%',
        height: '100%',
        touchAction: 'none', // Prevent native touch scrolling
    },
    textInput: {
        background: 'rgba(255,255,255,0.95)',
        border: '2px solid var(--primary)',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 16,
        fontFamily: "'Inter', sans-serif",
        color: '#1f2937',
        minWidth: 120,
        maxWidth: 400,
        minHeight: 36,
        resize: 'both',
        outline: 'none',
        boxShadow: 'var(--shadow-lg)',
    },
};