import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveEvent, createCanvas, loadEvents, saveSnapshot } from '../../../utils/api';

const BATCH_DELAY = 600; // ms — debounce before sending event to backend

export function useCanvas() {
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [title, setTitle] = useState('Untitled Canvas'); // Canvas Name
    const [tool, setTool] = useState('select'); // select | hand | rect | diamond | circle | arrow | pencil | text | image | eraser
    const [strokeColor, setStrokeColor] = useState('#673AB7');
    const [fillColor, setFillColor] = useState('none');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [strokeStyle, setStrokeStyle] = useState('solid'); // solid | dashed | dotted
    const [roughness, setRoughness] = useState(0);
    const [edgeStyle, setEdgeStyle] = useState('rounded'); // rounded | sharp
    const [opacity, setOpacity] = useState(100);

    // Text-specific
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState('normal'); // 'handwriting' | 'normal' | 'code'
    const [textAlign, setTextAlign] = useState('left');     // 'left' | 'center' | 'right'

    // Arrow-specific
    const [arrowEnd, setArrowEnd] = useState('arrow');      // 'arrow' | 'none'

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    // Undo / Redo stacks
    const undoStack = useRef([]);
    const redoStack = useRef([]);

    // Backend persistence
    const canvasIdRef = useRef(null);
    const eventOrderRef = useRef(0);
    const batchTimerRef = useRef(null);
    const pendingEventsRef = useRef([]);
    const backendReady = useRef(false);
    const elementsRef = useRef(elements); // Ref to access latest elements in flushEvents

    // Sync elementsRef
    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    // ─── Initialize or load canvas on mount ─────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('sc_canvasId');
        if (stored) {
            canvasIdRef.current = stored;
            loadCanvasFromBackend(stored);
        } else {
            initNewCanvas();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function initNewCanvas() {
        try {
            const data = await createCanvas('My Canvas');
            if (data?.canvas?._id) {
                canvasIdRef.current = data.canvas._id;
                localStorage.setItem('sc_canvasId', data.canvas._id);
                backendReady.current = true;
            }
        } catch (e) {
            console.warn('Backend unavailable — running in offline mode');
            backendReady.current = false;
        }
    }

    async function loadCanvasFromBackend(cid) {
        try {
            const data = await loadEvents(cid);
            if (data?.success) {
                let initialElements = [];
                // 1. Load snapshot if available
                if (data.snapshot) {
                    initialElements = data.snapshot.elements || [];
                    eventOrderRef.current = data.snapshot.lastEventOrder || 0;
                }

                // 2. Replay subsequent events
                const reconstructed = replayEvents(data.events, initialElements);
                setElements(reconstructed);

                // Update event order to the last event
                if (data.events.length > 0) {
                    eventOrderRef.current = data.events[data.events.length - 1].eventOrder;
                }

                backendReady.current = true;
            }
        } catch (e) {
            console.warn('Could not load from backend — starting fresh');
            backendReady.current = false;
            // Create new canvas
            await initNewCanvas();
        }
    }

    function replayEvents(events, initialElements = []) {
        let els = [...initialElements];
        for (const ev of events) {
            switch (ev.eventType) {
                case 'ADD_ELEMENT':
                    els.push(ev.eventData);
                    break;
                case 'UPDATE_ELEMENT':
                    els = els.map((e) => (e.id === ev.eventData.id ? { ...e, ...ev.eventData } : e));
                    break;
                case 'DELETE_ELEMENT':
                    els = els.filter((e) => e.id !== ev.eventData.id);
                    break;
                case 'MOVE_ELEMENT':
                    els = els.map((e) => (e.id === ev.eventData.id ? { ...e, ...ev.eventData } : e));
                    break;
                case 'RESIZE_ELEMENT':
                    els = els.map((e) => (e.id === ev.eventData.id ? { ...e, ...ev.eventData } : e));
                    break;
                case 'REORDER_ELEMENT': {
                    const { id, direction } = ev.eventData;
                    const idx = els.findIndex((e) => e.id === id);
                    if (idx === -1) break;
                    const el = els[idx];
                    els.splice(idx, 1);
                    if (direction === 'forward') {
                        els.splice(Math.min(idx + 1, els.length), 0, el);
                    } else if (direction === 'backward') {
                        els.splice(Math.max(idx - 1, 0), 0, el);
                    } else if (direction === 'front') {
                        els.push(el);
                    } else if (direction === 'back') {
                        els.unshift(el);
                    }
                    break;
                }
                case 'CLEAR_CANVAS':
                    els = [];
                    break;
                default:
                    break;
            }
        }
        return els;
    }

    // ─── Persist event to backend (batched/debounced) ───────────
    function persistEvent(eventType, eventData) {
        if (!backendReady.current || !canvasIdRef.current) return;
        eventOrderRef.current += 1;
        pendingEventsRef.current.push({ eventType, eventData, eventOrder: eventOrderRef.current });

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(flushEvents, BATCH_DELAY);
    }

    async function flushEvents() {
        const batch = [...pendingEventsRef.current];
        pendingEventsRef.current = [];
        for (const ev of batch) {
            try {
                await saveEvent({
                    canvasId: canvasIdRef.current,
                    eventType: ev.eventType,
                    eventData: ev.eventData,
                    eventOrder: ev.eventOrder,
                });
            } catch (e) {
                console.warn('Failed to persist event:', e.message);
            }
        }

        // Check if we should save a snapshot (every 50 events)
        if (eventOrderRef.current > 0 && eventOrderRef.current % 50 === 0) {
            console.log('Saving snapshot at event order:', eventOrderRef.current);
            try {
                await saveSnapshot(canvasIdRef.current, elementsRef.current, eventOrderRef.current);
            } catch (e) {
                console.warn('Failed to save snapshot:', e);
            }
        }
    }

    // ─── Add element ────────────────────────────────────────────
    function addElement(el) {
        const newEl = { id: uuidv4(), ...el };
        setElements((prev) => [...prev, newEl]);
        undoStack.current.push({ type: 'ADD', element: newEl });
        redoStack.current = [];
        persistEvent('ADD_ELEMENT', newEl);
        return newEl;
    }

    // ─── Update element ─────────────────────────────────────────
    function updateElement(id, updates) {
        setElements((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
        );
        persistEvent('UPDATE_ELEMENT', { id, ...updates });
    }

    // ─── Delete element ─────────────────────────────────────────
    function deleteElement(id) {
        const el = elements.find((e) => e.id === id);
        if (!el) return;
        setElements((prev) => prev.filter((e) => e.id !== id));
        undoStack.current.push({ type: 'DELETE', element: el });
        redoStack.current = [];
        persistEvent('DELETE_ELEMENT', { id });
        if (selectedId === id) setSelectedId(null);
    }

    // ─── Move element ───────────────────────────────────────────
    function moveElement(id, dx, dy) {
        setElements((prev) =>
            prev.map((e) => {
                if (e.id !== id) return e;
                if (e.type === 'freehand') {
                    return { ...e, points: e.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
                }
                if (e.type === 'arrow') {
                    return { ...e, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy };
                }
                return { ...e, x: e.x + dx, y: e.y + dy };
            })
        );
    }

    function commitMove(id) {
        const el = elements.find((e) => e.id === id);
        if (el) persistEvent('MOVE_ELEMENT', el);
    }

    // ─── Resize element ─────────────────────────────────────────
    function resizeElement(id, updates) {
        setElements((prev) =>
            prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
        );
    }

    function commitResize(id) {
        const el = elements.find((e) => e.id === id);
        if (el) persistEvent('RESIZE_ELEMENT', el);
    }

    // ─── Layer ordering ─────────────────────────────────────────
    function reorderElement(id, direction) {
        setElements((prev) => {
            const idx = prev.findIndex((e) => e.id === id);
            if (idx === -1) return prev;
            const arr = [...prev];
            const [el] = arr.splice(idx, 1);
            if (direction === 'forward') arr.splice(Math.min(idx + 1, arr.length), 0, el);
            else if (direction === 'backward') arr.splice(Math.max(idx - 1, 0), 0, el);
            else if (direction === 'front') arr.push(el);
            else if (direction === 'back') arr.unshift(el);
            return arr;
        });
        persistEvent('REORDER_ELEMENT', { id, direction });
    }

    // ─── Undo ───────────────────────────────────────────────────
    function undo() {
        const action = undoStack.current.pop();
        if (!action) return;
        if (action.type === 'ADD') {
            setElements((prev) => prev.filter((e) => e.id !== action.element.id));
            redoStack.current.push(action);
            persistEvent('DELETE_ELEMENT', { id: action.element.id });
        } else if (action.type === 'DELETE') {
            setElements((prev) => [...prev, action.element]);
            redoStack.current.push(action);
            persistEvent('ADD_ELEMENT', action.element);
        }
    }

    // ─── Redo ───────────────────────────────────────────────────
    function redo() {
        const action = redoStack.current.pop();
        if (!action) return;
        if (action.type === 'ADD') {
            setElements((prev) => [...prev, action.element]);
            undoStack.current.push(action);
            persistEvent('ADD_ELEMENT', action.element);
        } else if (action.type === 'DELETE') {
            setElements((prev) => prev.filter((e) => e.id !== action.element.id));
            undoStack.current.push(action);
            persistEvent('DELETE_ELEMENT', { id: action.element.id });
        }
    }

    // ─── Clear canvas ───────────────────────────────────────────
    function clearCanvas() {
        setElements([]);
        undoStack.current = [];
        redoStack.current = [];
        setSelectedId(null);
        persistEvent('CLEAR_CANVAS', {});
    }

    // ─── Zoom & Pan ─────────────────────────────────────────────
    function zoomIn() { setZoom((z) => Math.min(z * 1.2, 5)); }
    function zoomOut() { setZoom((z) => Math.max(z / 1.2, 0.1)); }
    function resetZoom() { setZoom(1); setPan({ x: 0, y: 0 }); }

    // ─── Current style snapshot ─────────────────────────────────
    const currentStyle = {
        strokeColor,
        fillColor,
        strokeWidth,
        strokeStyle,
        roughness,
        edgeStyle,
        opacity,
        fontSize,
        fontFamily,
        textAlign,
        arrowEnd,
    };

    function setCanvasTitle(newTitle) {
        setTitle(newTitle);
        if (backendReady.current && canvasIdRef.current) {
            import('../utils/api').then(({ updateCanvasMetadata }) => {
                updateCanvasMetadata(canvasIdRef.current, { title: newTitle })
                    .catch(err => console.error("Failed to save title", err));
            });
        }
    }


    // ─── Sync state with selection ──────────────────────────────
    useEffect(() => {
        if (selectedId) {
            const el = elements.find((e) => e.id === selectedId);
            if (el) {
                // Only update if value is different to avoid unnecessary renders (though React handles this mostly)
                if (el.strokeColor) setStrokeColor(el.strokeColor);
                if (el.fillColor) setFillColor(el.fillColor);
                if (el.strokeWidth !== undefined) setStrokeWidth(el.strokeWidth);
                if (el.strokeStyle) setStrokeStyle(el.strokeStyle);
                if (el.roughness !== undefined) setRoughness(el.roughness);
                if (el.edgeStyle) setEdgeStyle(el.edgeStyle);
                if (el.opacity !== undefined) setOpacity(el.opacity);
                if (el.fontSize) setFontSize(el.fontSize);
                if (el.fontFamily) setFontFamily(el.fontFamily);
                if (el.textAlign) setTextAlign(el.textAlign);
                if (el.arrowEnd) setArrowEnd(el.arrowEnd);
            }
        }
    }, [selectedId, elements]);

    // ─── Wrapped Setters that update selection too ──────────────
    const wrappedSetStrokeColor = (val) => {
        setStrokeColor(val);
        if (selectedId) updateElement(selectedId, { strokeColor: val });
    };
    const wrappedSetFillColor = (val) => {
        setFillColor(val);
        if (selectedId) updateElement(selectedId, { fillColor: val });
    };
    const wrappedSetStrokeWidth = (val) => {
        setStrokeWidth(val);
        if (selectedId) updateElement(selectedId, { strokeWidth: val });
    };
    const wrappedSetStrokeStyle = (val) => {
        setStrokeStyle(val);
        if (selectedId) updateElement(selectedId, { strokeStyle: val });
    };
    const wrappedSetRoughness = (val) => {
        setRoughness(val);
        if (selectedId) updateElement(selectedId, { roughness: val });
    };
    const wrappedSetEdgeStyle = (val) => {
        setEdgeStyle(val);
        if (selectedId) updateElement(selectedId, { edgeStyle: val });
    };
    const wrappedSetOpacity = (val) => {
        setOpacity(val);
        if (selectedId) updateElement(selectedId, { opacity: val });
    };
    const wrappedSetFontSize = (val) => {
        setFontSize(val);
        if (selectedId) updateElement(selectedId, { fontSize: val });
    };
    const wrappedSetFontFamily = (val) => {
        setFontFamily(val);
        if (selectedId) updateElement(selectedId, { fontFamily: val });
    };
    const wrappedSetTextAlign = (val) => {
        setTextAlign(val);
        if (selectedId) updateElement(selectedId, { textAlign: val });
    };
    const wrappedSetArrowEnd = (val) => {
        setArrowEnd(val);
        if (selectedId) updateElement(selectedId, { arrowEnd: val });
    };

    return {
        elements,
        selectedId,
        setSelectedId,
        title,
        setTitle: setCanvasTitle,
        tool,
        setTool,
        currentStyle,
        strokeColor, setStrokeColor: wrappedSetStrokeColor,
        fillColor, setFillColor: wrappedSetFillColor,
        strokeWidth, setStrokeWidth: wrappedSetStrokeWidth,
        strokeStyle, setStrokeStyle: wrappedSetStrokeStyle,
        roughness, setRoughness: wrappedSetRoughness,
        edgeStyle, setEdgeStyle: wrappedSetEdgeStyle,
        opacity, setOpacity: wrappedSetOpacity,
        fontSize, setFontSize: wrappedSetFontSize,
        fontFamily, setFontFamily: wrappedSetFontFamily,
        textAlign, setTextAlign: wrappedSetTextAlign,
        arrowEnd, setArrowEnd: wrappedSetArrowEnd,
        zoom, setZoom, zoomIn, zoomOut, resetZoom,
        pan, setPan,
        addElement,
        updateElement,
        deleteElement,
        moveElement,
        commitMove,
        resizeElement,
        commitResize,
        reorderElement,
        undo,
        redo,
        clearCanvas,
        canvasId: canvasIdRef.current,
    };
}
