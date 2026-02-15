import React, { useRef, useCallback, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { ElementRenderer } from './Elements';
import { hitTest, elementBBox, getResizeHandles } from '../utils/geometry';

const Canvas = forwardRef(({
    elements, selectedId, setSelectedId, tool,
    currentStyle, zoom, setZoom, pan, setPan,
    addElement, deleteElement, moveElement, commitMove,
    resizeElement, commitResize, reorderElement, updateElement,
    backgroundColor, setBackgroundColor, erasePath, canvasSize, eraserSize
}, ref) => {
    const svgRef = useRef(null);

    useImperativeHandle(ref, () => ({
        getSnapshot: async () => {
            if (!svgRef.current) return '';

            // 1. Serialize SVG
            const serializer = new XMLSerializer();
            const svgClone = svgRef.current.cloneNode(true);
            const rect = svgRef.current.getBoundingClientRect();
            svgClone.setAttribute("width", canvasSize?.width || 1080);
            svgClone.setAttribute("height", canvasSize?.height || 720);
            svgClone.setAttribute("viewBox", `0 0 ${canvasSize?.width || 1080} ${canvasSize?.height || 720}`);
            svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

            // Reset transform on the main group to ensure we capture the full canvas, not the zoomed/panned view
            const mainGroup = svgClone.querySelector('g');
            if (mainGroup) {
                mainGroup.setAttribute('transform', 'translate(0, 0) scale(1)');
            }

            // Adjust clone for snapshot (reset transform to capture full canvas if needed, or just current view)
            // For a thumbnail, we probably want the full extent or current view. 
            // Current view is easier essentially what the user sees.
            // Let's capture the current visible area as that's what a "thumbnail" usually implies in this context.

            const svgString = serializer.serializeToString(svgClone);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Thumbnail size
                    const targetWidth = 320;
                    const aspectRatio = (canvasSize?.height || 720) / (canvasSize?.width || 1080);
                    const targetHeight = targetWidth * aspectRatio;

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');

                    // Fill background
                    ctx.fillStyle = backgroundColor || '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw SVG image
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    URL.revokeObjectURL(url);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    console.log('Thumbnail generated, length:', dataUrl.length);
                    resolve(dataUrl);
                };
                img.onerror = (e) => {
                    console.error('Thumbnail generation failed', e);
                    URL.revokeObjectURL(url);
                    resolve('');
                };
                img.src = url;
            });
        }
    }));
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
            const currentEraserSize = elements?.[0]?.eraserSize || 10; // Fallback or pass prop
            // Actually pass eraserSize property from parent is better, but let's check props
            setDrawing({
                type: 'eraser',
                lastX: pt.x,
                lastY: pt.y,
                points: [{ x: pt.x, y: pt.y }],
                strokeWidth: eraserSize || 10,
                strokeColor: '#fafafa', // Always show white trail for feedback
                fillColor: 'none'
            });
            if (erasePath) erasePath([pt]); // Erase initial point
            return;
        }

        // 2. Pan Tool Logic (Spacebar or Hand tool)
        if (tool === 'hand' || e.buttons === 4 || spacePressed) {
            setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y });
            return;
        }

        // 3. Paint Bucket / Fill Tool
        if (tool === 'paint-bucket') {
            const clickedEl = findTopElement(pt.x, pt.y);
            if (clickedEl) {
                if (clickedEl.type === 'text') {
                    updateElement(clickedEl.id, { strokeColor: currentStyle.strokeColor });
                } else if (['rect', 'circle', 'diamond'].includes(clickedEl.type)) {
                    updateElement(clickedEl.id, { fillColor: currentStyle.strokeColor });
                } else if (clickedEl.type === 'freehand') {
                    // Fill freehand shape
                    updateElement(clickedEl.id, { fillColor: currentStyle.strokeColor });
                } else if (clickedEl.type === 'arrow') {
                    updateElement(clickedEl.id, { strokeColor: currentStyle.strokeColor });
                }
            } else {
                // Clicked on background
                setBackgroundColor(currentStyle.strokeColor);
            }
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
            } else if (drawing.type === 'eraser') {
                // Interpolate
                if (erasePath && drawing.lastX !== undefined) {
                    const dist = Math.sqrt(Math.pow(pt.x - drawing.lastX, 2) + Math.pow(pt.y - drawing.lastY, 2));
                    const steps = Math.ceil(dist / 2); // every 2px - smoother
                    const path = [];
                    for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        path.push({
                            x: drawing.lastX + (pt.x - drawing.lastX) * t,
                            y: drawing.lastY + (pt.y - drawing.lastY) * t
                        });
                    }
                    if (path.length > 0) erasePath(path);
                } else if (erasePath) {
                    erasePath([pt]);
                }
                // Update last pos AND store points for masking
                setDrawing(prev => ({
                    ...prev,
                    lastX: pt.x,
                    lastY: pt.y,
                    points: [...(prev.points || []), { x: pt.x, y: pt.y }]
                }));
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

            // ── Eraser Masking Logic ──
            // If erasing on a colored background, creating a "white" stroke simulates erasing the background
            if (drawing.type === 'eraser') {
                // Only create mask if background is not default paper color
                // We use #fafafa as default based on useCanvas init
                if (backgroundColor !== '#fafafa' && backgroundColor !== '#ffffff') {
                    addElement({
                        type: 'freehand',
                        x: 0, y: 0, // points are absolute
                        points: drawing.points || [],
                        strokeColor: '#fafafa', // Paper color
                        strokeWidth: drawing.strokeWidth || 10,
                        roughness: 0,
                        opacity: 100,
                        fillColor: 'none'
                    });
                }
                setDrawing(null);
                return;
            }

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
            if (hitTest(px, py, elements[i], { checkInside: tool === 'paint-bucket' })) return elements[i];
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
            {/* Main drawing SVG */}
            <svg
                ref={svgRef}
                className={`w-full h-full absolute inset-0 touch-none bg-slate-200 ${cursorMap[tool] === 'grab' ? 'cursor-grab' : cursorMap[tool] === 'text' ? 'cursor-text' : cursorMap[tool] === 'crosshair' ? 'cursor-crosshair' : 'cursor-default'}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onWheel={onWheel}
            >
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

                    {/* Paper / Canvas Area */}
                    <rect
                        x={0}
                        y={0}
                        width={canvasSize?.width || 1080}
                        height={canvasSize?.height || 720}
                        fill={backgroundColor || '#ffffff'}
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        filter="drop-shadow(0 4px 6px rgb(0 0 0 / 0.1)) drop-shadow(0 2px 4px rgb(0 0 0 / 0.06))"
                    />

                    {/* Clip path to force elements inside canvas */}
                    <defs>
                        <clipPath id="canvas-clip">
                            <rect
                                x={0}
                                y={0}
                                width={canvasSize?.width || 1080}
                                height={canvasSize?.height || 720}
                            />
                        </clipPath>
                    </defs>

                    <g clipPath="url(#canvas-clip)">
                        {/* Render all elements */}
                        {elements.map(el => (
                            <g key={el.id}>
                                <ElementRenderer el={el} />
                            </g>
                        ))}

                        {/* In-progress drawing preview */}
                        {drawing && <ElementRenderer el={drawing} />}
                    </g>

                    {/* Selection box + handles (outside clip to see handles) */}
                    {renderSelectionBox()}
                </g>
            </svg>

        </div>
    );
});

export default Canvas;
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
