/**
 * JSON Diagram Interpreter with Layout Engine
 * ──────────────────────────────────────────────────────────────
 * Converts Gemini-generated JSON diagram elements + connections into
 * ShadowCanvas drawing objects, then automatically arranges them into a
 * structured, readable layout centred on the current viewport.
 *
 * Layout algorithm:
 *   1. Build a directed graph from the connections array.
 *   2. Topological BFS to assign each node a "column level" (x-axis).
 *   3. Within each column, assign "row" positions (y-axis).
 *   4. Apply minimum spacing (H: 220px, V: 130px).
 *   5. Translate the entire diagram so its centre aligns with the
 *      current viewport centre.
 *   6. Nudge if the bounding box would overlap existing canvas elements.
 */

import { v4 as uuidv4 } from 'uuid';

// ─── Constants ────────────────────────────────────────────────
const H_SPACING   = 220;   // min horizontal distance between shape centres
const V_SPACING   = 130;   // min vertical distance between shape centres
const DEFAULT_W   = 120;
const DEFAULT_H   =  60;
const DEFAULT_R   =  40;   // circle radius

const DEFAULTS = {
    strokeColor: '#1a103d',
    fillColor:   'none',
    strokeWidth:  2,
    strokeStyle: 'solid',
    roughness:    0,
    edgeStyle:   'rounded',
    opacity:     100,
    fontSize:    16,
    fontFamily:  'normal',
};

// ─── Helpers ──────────────────────────────────────────────────

const num = (val, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
};

/** Returns centre of a bounding-box element {x, y, width, height}. */
const centre = (el) => ({
    cx: el.x + el.width  / 2,
    cy: el.y + el.height / 2,
});

/** Returns bounding box {x, y, width, height} of a canvas element. */
const bounds = (el) => ({ x: el.x ?? 0, y: el.y ?? 0, width: el.width ?? 0, height: el.height ?? 0 });

// ─── Layout Engine ────────────────────────────────────────────

/**
 * Assigns {col, row} to each node using BFS topological ordering.
 * Nodes with no incoming edges are treated as roots (col 0).
 *
 * @param {string[]} labels     - All node labels
 * @param {Array}    conns      - Connections: [{from, to}]
 * @returns {Map<string, {col, row}>}
 */
function computeLayout(labels, conns) {
    // Build adjacency + in-degree maps
    const children  = new Map(labels.map(l => [l, []]));
    const inDegree  = new Map(labels.map(l => [l, 0]));

    for (const c of conns) {
        if (children.has(c.from) && children.has(c.to)) {
            children.get(c.from).push(c.to);
            inDegree.set(c.to, (inDegree.get(c.to) || 0) + 1);
        }
    }

    // Column assignment via BFS
    const col = new Map();
    const queue = [];

    for (const [label, deg] of inDegree) {
        if (deg === 0) {
            col.set(label, 0);
            queue.push(label);
        }
    }

    // Handle isolated nodes (not in connections at all) — put them in col 0
    for (const label of labels) {
        if (!col.has(label)) {
            // Check if involved in any connection
            const involved = conns.some(c => c.from === label || c.to === label);
            if (!involved) {
                col.set(label, 0);
                queue.push(label);
            }
        }
    }

    let i = 0;
    while (i < queue.length) {
        const node = queue[i++];
        const nodeCol = col.get(node) ?? 0;
        for (const child of (children.get(node) || [])) {
            const newCol = nodeCol + 1;
            if (!col.has(child) || col.get(child) < newCol) {
                col.set(child, newCol);
            }
            if (!queue.includes(child)) queue.push(child);
        }
    }

    // Catch any node that BFS missed (cyclic sub-graphs, etc.)
    for (const label of labels) {
        if (!col.has(label)) col.set(label, 0);
    }

    // Row assignment: within each column, assign rows top-to-bottom
    const rowCounter = new Map();
    const position   = new Map();

    // Sort within BFS order so rows are assigned in a stable order
    for (const label of queue) {
        const c = col.get(label);
        const r = rowCounter.get(c) ?? 0;
        position.set(label, { col: c, row: r });
        rowCounter.set(c, r + 1);
    }

    return position;
}

/**
 * Converts layout positions to pixel coordinates and returns a
 * label → {x, y, width, height} map.
 *
 * The diagram's own centre is placed at {0, 0}; the caller then
 * translates everything to the viewport centre.
 *
 * @param {Map}   position   - label → {col, row}
 * @param {Array} jsonEls    - Original Gemini elements (for w/h/radius)
 * @returns {Map<string, {x, y, width, height}>}
 */
function positionToPixels(position, jsonEls) {
    const shapeMap = new Map(jsonEls.map(el => [el.text, el]));
    const pixelPos = new Map();

    let maxCol = 0, maxRow = 0;
    for (const { col, row } of position.values()) {
        if (col > maxCol) maxCol = col;
        if (row > maxRow) maxRow = row;
    }

    const totalW = maxCol * H_SPACING;
    const totalH = maxRow * V_SPACING;

    for (const [label, { col, row }] of position) {
        const src = shapeMap.get(label);
        const w = src?.type === 'circle'
            ? num(src.radius, DEFAULT_R) * 2
            : num(src?.width, DEFAULT_W);
        const h = src?.type === 'circle'
            ? num(src.radius, DEFAULT_R) * 2
            : num(src?.height, DEFAULT_H);

        // Pixel origin relative to diagram centre (0,0)
        const px = col * H_SPACING - totalW / 2 - w / 2;
        const py = row * V_SPACING - totalH / 2 - h / 2;

        pixelPos.set(label, { x: px, y: py, width: w, height: h });
    }

    return pixelPos;
}

/**
 * Checks whether a new bounding box {x,y,w,h} overlaps any existing canvas element.
 * Returns a {dx, dy} nudge to avoid the collision.
 */
function computeCollisionNudge(newX, newY, newW, newH, existingElements) {
    if (!existingElements || existingElements.length === 0) return { dx: 0, dy: 0 };

    // Compute AABB of all existing elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of existingElements) {
        if (el.x == null || el.y == null) continue;
        const w = el.width  ?? 0;
        const h = el.height ?? 0;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + w);
        maxY = Math.max(maxY, el.y + h);
    }

    if (!isFinite(minX)) return { dx: 0, dy: 0 };

    const newMaxX = newX + newW;
    const newMaxY = newY + newH;

    const overlapX = newMaxX > minX && newX < maxX;
    const overlapY = newMaxY > minY && newY < maxY;

    if (!overlapX || !overlapY) return { dx: 0, dy: 0 };

    // Shift the new diagram below the existing cluster with some padding
    const dy = maxY - newY + 40;
    return { dx: 0, dy };
}

// ─── Element Conversion ───────────────────────────────────────

/**
 * Converts a single Gemini JSON element into ShadowCanvas canvas object(s).
 * Uses the pre-computed pixel position from the layout engine when available.
 */
const convertElement = (el, overridePos) => {
    if (!el || typeof el !== 'object' || !el.type) return null;

    const base = { id: uuidv4(), ...DEFAULTS };

    switch (el.type) {
        case 'rectangle': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  DEFAULT_W);
            const h = overridePos ? overridePos.height : num(el.height, DEFAULT_H);

            const canvasEl = { ...base, type: 'rect', x, y, width: w, height: h };

            if (el.text) {
                const fs = 14;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + w / 2 - (el.text.length * fs * 0.3),
                    y: y + h / 2 - fs / 2,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'circle': {
            const r  = num(el.radius, DEFAULT_R);
            const cx = overridePos ? overridePos.x + r : num(el.x);
            const cy = overridePos ? overridePos.y + r : num(el.y);

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
            const x    = overridePos ? overridePos.x : num(el.x);
            const y    = overridePos ? overridePos.y : num(el.y);
            const text = String(el.text || '');
            const fs   = num(el.fontSize, DEFAULTS.fontSize);
            return [{
                ...base, type: 'text', x, y,
                width: text.length * (fs * 0.6), height: fs * 1.4,
                text, fontSize: fs,
            }];
        }

        default:
            return null;
    }
};

// ─── Connection Resolver ──────────────────────────────────────

const getBounds = (el) => ({
    x: el.x ?? 0, y: el.y ?? 0, width: el.width ?? 0, height: el.height ?? 0,
});

const computeEdgePoints = (src, tgt) => {
    const sc = centre(src), tc = centre(tgt);
    const dx = tc.cx - sc.cx, dy = tc.cy - sc.cy;
    let x1, y1, x2, y2;

    if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) {
            x1 = src.x + src.width;  y1 = sc.cy;
            x2 = tgt.x;              y2 = tc.cy;
        } else {
            x1 = src.x;              y1 = sc.cy;
            x2 = tgt.x + tgt.width;  y2 = tc.cy;
        }
    } else {
        if (dy > 0) {
            x1 = sc.cx;  y1 = src.y + src.height;
            x2 = tc.cx;  y2 = tgt.y;
        } else {
            x1 = sc.cx;  y1 = src.y;
            x2 = tc.cx;  y2 = tgt.y + tgt.height;
        }
    }
    return { x1, y1, x2, y2 };
};

const resolveConnections = (connections, labelToEl) => {
    const lines = [];
    for (const conn of (connections || [])) {
        const srcEl = labelToEl[conn.from];
        const tgtEl = labelToEl[conn.to];
        if (!srcEl || !tgtEl) {
            console.warn(`[Connections] Cannot resolve "${conn.from}" → "${conn.to}"`);
            continue;
        }
        const { x1, y1, x2, y2 } = computeEdgePoints(getBounds(srcEl), getBounds(tgtEl));
        lines.push({
            id: uuidv4(), ...DEFAULTS,
            type: 'arrow', arrowEnd: 'arrow',
            x: Math.min(x1, x2), y: Math.min(y1, y2),
            width: Math.abs(x2 - x1) || 2, height: Math.abs(y2 - y1) || 2,
            x1, y1, x2, y2,
            strokeColor: '#6b7280', strokeWidth: 1.5,
        });
        if (conn.label) {
            const fs = 11;
            lines.push({
                id: uuidv4(), ...DEFAULTS, type: 'text',
                x: (x1 + x2) / 2,
                y: (y1 + y2) / 2 - 14,
                width: conn.label.length * (fs * 0.6), height: fs * 1.4,
                text: conn.label, fontSize: fs, strokeColor: '#6b7280',
            });
        }
    }
    return lines;
};

// ─── Main Export ──────────────────────────────────────────────

/**
 * Converts Gemini JSON elements + connections into positioned ShadowCanvas objects.
 *
 * @param {Array}  jsonElements     - elements[] from Gemini response
 * @param {Array}  connections      - connections[] from Gemini response
 * @param {Object} options
 * @param {Object} options.viewportCenter     - {x, y} centre of canvas viewport
 * @param {Array}  options.existingElements   - current canvas elements (for collision avoidance)
 */
export const parseSvgToCanvasElements = (
    jsonElements,
    connections   = [],
    options       = {}
) => {
    if (!Array.isArray(jsonElements) || jsonElements.length === 0) {
        console.warn('[Layout Engine] Received empty or invalid elements array');
        return [];
    }

    const { viewportCenter, existingElements = [] } = options;

    // ── 1. Determine which elements have text labels (for layout)
    const labeled   = jsonElements.filter(el => el.text);
    const unlabeled = jsonElements.filter(el => !el.text);
    const labels    = labeled.map(el => el.text);

    // ── 2. Compute graph layout → label → {col, row}
    const position = computeLayout(labels, connections);

    // ── 3. Convert layout positions to pixel coords (centred at 0,0)
    const pixelPos = positionToPixels(position, labeled);

    // ── 4. Compute overall diagram bounding box to apply viewport translate
    let minPx = Infinity, minPy = Infinity, maxPx = -Infinity, maxPy = -Infinity;
    for (const { x, y, width, height } of pixelPos.values()) {
        if (x < minPx) minPx = x;
        if (y < minPy) minPy = y;
        if (x + width > maxPx)  maxPx = x + width;
        if (y + height > maxPy) maxPy = y + height;
    }
    const diagW = maxPx - minPx || 0;
    const diagH = maxPy - minPy || 0;

    // ── 5. Compute translation to viewport centre (default: 400, 300)
    const vc = viewportCenter || { x: 400, y: 300 };
    let tx = vc.x - diagW / 2 - minPx;
    let ty = vc.y - diagH / 2 - minPy;

    // ── 6. Collision avoidance: nudge if it would land on existing shapes
    const { dx, dy } = computeCollisionNudge(
        vc.x - diagW / 2, vc.y - diagH / 2,
        diagW, diagH,
        existingElements
    );
    tx += dx;
    ty += dy;

    // ── 7. Apply translation to all pixel positions
    const translatedPos = new Map();
    for (const [label, pos] of pixelPos) {
        translatedPos.set(label, {
            x: pos.x + tx, y: pos.y + ty,
            width: pos.width, height: pos.height,
        });
    }

    // ── 8. Convert elements to canvas objects
    const result  = [];
    const labelToEl = {};   // maps label → primary shape element (for connections)

    for (const el of labeled) {
        try {
            const overridePos = translatedPos.get(el.text);
            const converted   = convertElement(el, overridePos);
            if (converted) {
                result.push(...converted);
                labelToEl[el.text] = converted[0];
            }
        } catch (err) {
            console.warn('[Layout Engine] Failed to convert element:', el, err);
        }
    }

    // Unlabeled elements (standalone text etc.) get placed below the diagram
    let unlabeledY = (maxPy + ty) + V_SPACING;
    for (const el of unlabeled) {
        try {
            const overridePos = el.type === 'text'
                ? { x: vc.x, y: unlabeledY, width: 200, height: 20 }
                : null;
            const converted = convertElement(el, overridePos);
            if (converted) {
                result.push(...converted);
                unlabeledY += V_SPACING;
            }
        } catch (err) {
            console.warn('[Layout Engine] Failed to convert unlabeled element:', el, err);
        }
    }

    // ── 9. Resolve connections using final positioned elements
    const connectionLines = resolveConnections(connections, labelToEl);
    result.push(...connectionLines);

    console.log(
        `[Layout Engine] ${jsonElements.length} elements + ${connections.length} connections` +
        ` → ${result.length} canvas objects (${connectionLines.length} arrows)` +
        ` centred at (${Math.round(vc.x)}, ${Math.round(vc.y)})`
    );

    return result;
};
