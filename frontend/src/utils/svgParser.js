/**
 * JSON Diagram Interpreter — converts Gemini-generated JSON diagram elements
 * (and connection relationships) into ShadowCanvas drawing objects.
 */

import { v4 as uuidv4 } from 'uuid';

// Default styling applied to AI-generated elements
const DEFAULTS = {
    strokeColor: '#1a103d',
    fillColor: 'none',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 0,
    edgeStyle: 'rounded',
    opacity: 100,
    fontSize: 16,
    fontFamily: 'normal',
};

/** Safely coerces a value to a number, returning `fallback` if NaN. */
const num = (val, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
};

/**
 * Returns the bounding box of a canvas element as { x, y, width, height }.
 * Used to compute edge connection points.
 */
const getBounds = (el) => ({
    x:      el.x      ?? 0,
    y:      el.y      ?? 0,
    width:  el.width  ?? 0,
    height: el.height ?? 0,
});

/**
 * Computes the centre point of a bounding box.
 */
const centre = (bounds) => ({
    cx: bounds.x + bounds.width / 2,
    cy: bounds.y + bounds.height / 2,
});

/**
 * Computes the exact edge exit-point on the source shape's nearest side
 * and the entry-point on the target shape's nearest side.
 *
 * Strategy: horizontal layout assumed (most common for AI diagrams).
 *   - If target is to the right → exit right-edge of source, enter left-edge of target
 *   - If target is to the left  → exit left-edge,  enter right-edge
 *   - If target is below        → exit bottom-edge, enter top-edge
 *   - If target is above        → exit top-edge,    enter bottom-edge
 */
const computeEdgePoints = (srcBounds, tgtBounds) => {
    const s = centre(srcBounds);
    const t = centre(tgtBounds);

    const dx = t.cx - s.cx;
    const dy = t.cy - s.cy;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let x1, y1, x2, y2;

    if (absDx >= absDy) {
        // Primarily horizontal connection
        if (dx > 0) {
            // Target is to the right
            x1 = srcBounds.x + srcBounds.width;  y1 = s.cy;
            x2 = tgtBounds.x;                    y2 = t.cy;
        } else {
            // Target is to the left
            x1 = srcBounds.x;                    y1 = s.cy;
            x2 = tgtBounds.x + tgtBounds.width;  y2 = t.cy;
        }
    } else {
        // Primarily vertical connection
        if (dy > 0) {
            // Target is below
            x1 = s.cx;  y1 = srcBounds.y + srcBounds.height;
            x2 = t.cx;  y2 = tgtBounds.y;
        } else {
            // Target is above
            x1 = s.cx;  y1 = srcBounds.y;
            x2 = t.cx;  y2 = tgtBounds.y + tgtBounds.height;
        }
    }

    return { x1, y1, x2, y2 };
};

/**
 * Converts a single JSON element from Gemini into one or more ShadowCanvas
 * element objects. Returns an array (shape + optional inline label).
 */
const convertElement = (el) => {
    if (!el || typeof el !== 'object' || !el.type) return null;

    const base = { id: uuidv4(), ...DEFAULTS };

    switch (el.type) {
        case 'rectangle': {
            const x = num(el.x);
            const y = num(el.y);
            const width  = num(el.width,  120);
            const height = num(el.height,  60);

            const canvasEl = { ...base, type: 'rect', x, y, width, height };

            if (el.text) {
                const fs = 14;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + width  / 2 - (el.text.length * fs * 0.3),
                    y: y + height / 2 - fs / 2,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'circle': {
            const r  = num(el.radius, 40);
            const cx = num(el.x);
            const cy = num(el.y);

            const canvasEl = {
                ...base, type: 'circle',
                x: cx - r, y: cy - r, width: r * 2, height: r * 2,
            };

            if (el.text) {
                const fs = 13;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: cx - (el.text.length * fs * 0.3),
                    y: cy - fs / 2,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'text': {
            const x    = num(el.x);
            const y    = num(el.y);
            const text = String(el.text || '');
            const fs   = num(el.fontSize, DEFAULTS.fontSize);
            return [{
                ...base, type: 'text',
                x, y,
                width:  text.length * (fs * 0.6),
                height: fs * 1.4,
                text, fontSize: fs,
            }];
        }

        default:
            console.log(`[JSON Interpreter] Skipping unsupported type: "${el.type}"`);
            return null;
    }
};

/**
 * Resolves connections into line elements by matching shape labels to their
 * computed bounding boxes and computing edge-to-edge points.
 *
 * @param {Array}  connections  - Array of { from, to, label? } objects from Gemini
 * @param {Object} labelToEl    - Map of label → first canvas shape element
 * @returns {Array}             - Array of arrow line canvas elements
 */
const resolveConnections = (connections, labelToEl) => {
    if (!connections || connections.length === 0) return [];

    const lines = [];

    for (const conn of connections) {
        const srcEl = labelToEl[conn.from];
        const tgtEl = labelToEl[conn.to];

        if (!srcEl || !tgtEl) {
            console.warn(`[Connections] Could not resolve "${conn.from}" → "${conn.to}". Missing shape.`);
            continue;
        }

        const { x1, y1, x2, y2 } = computeEdgePoints(getBounds(srcEl), getBounds(tgtEl));

        const lineEl = {
            id: uuidv4(),
            ...DEFAULTS,
            type: 'arrow',        // use 'arrow' so it renders with an arrowhead
            arrowEnd: 'arrow',
            x:  Math.min(x1, x2),
            y:  Math.min(y1, y2),
            width:  Math.abs(x2 - x1) || 2,
            height: Math.abs(y2 - y1) || 2,
            x1, y1, x2, y2,
            strokeColor: '#6b7280',   // neutral gray to distinguish from shapes
            strokeWidth: 1.5,
        };

        lines.push(lineEl);

        // Add optional connection label at the midpoint
        if (conn.label) {
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 12; // slightly above the line
            lines.push({
                id: uuidv4(),
                ...DEFAULTS,
                type: 'text',
                x: mx, y: my,
                width: conn.label.length * (11 * 0.6),
                height: 11 * 1.4,
                text: conn.label,
                fontSize: 11,
                strokeColor: '#6b7280',
            });
        }
    }

    return lines;
};

/**
 * Main entry point — converts Gemini JSON elements + connections into a flat
 * array of ShadowCanvas element objects ready to be inserted into the canvas.
 *
 * @param {Array<Object>} jsonElements   - The `elements` array from the API response
 * @param {Array<Object>} connections    - The `connections` array from the API response
 * @returns {Array<Object>}              - Flat array of canvas objects
 */
export const parseSvgToCanvasElements = (jsonElements, connections = []) => {
    if (!Array.isArray(jsonElements) || jsonElements.length === 0) {
        console.warn('[JSON Interpreter] Received empty or invalid elements array');
        return [];
    }

    const result = [];
    // label → the PRIMARY shape element (first item in the returned pair, not the text label)
    const labelToEl = {};

    for (const el of jsonElements) {
        try {
            const converted = convertElement(el);
            if (converted) {
                result.push(...converted);
                // Register the shape (first element) under its label for connections
                if (el.text) {
                    labelToEl[el.text] = converted[0];
                }
            }
        } catch (err) {
            console.warn('[JSON Interpreter] Failed to convert element:', el, err);
        }
    }

    // Resolve connections into arrow/line elements and append them
    const connectionLines = resolveConnections(connections, labelToEl);
    result.push(...connectionLines);

    console.log(
        `[JSON Interpreter] ${jsonElements.length} elements + ${connections.length} connections` +
        ` → ${result.length} canvas objects (incl. ${connectionLines.length} connection lines)`
    );

    return result;
};
