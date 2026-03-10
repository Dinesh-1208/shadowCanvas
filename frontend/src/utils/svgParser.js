/**
 * JSON Diagram Interpreter with Layout Engine
 * ──────────────────────────────────────────────────────────────
 * Converts Gemini-generated JSON diagram elements + connections into
 * ShadowCanvas drawing objects, then automatically arranges them into a
 * structured, readable layout centred on the current viewport.
 *
 * Schema support:
 *   - Elements may use either "label" or "text" for their display name.
 *   - Elements may carry an "id" field; connections reference by id first,
 *     then fall back to matching by label.
 *   - The "layout" hint (horizontal / vertical / grid) controls which axis
 *     the BFS column dimension maps to.
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
    fontSize:    18,          // slightly larger to suit Caveat's wide letterforms
    fontFamily:  'handwriting', // Caveat — matches Excalidraw's hand-drawn aesthetic
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
 * Connections can reference nodes by id OR by label.
 *
 * @param {string[]} keys   - Lookup keys for each node (id if present, else label)
 * @param {Array}    conns  - Connections: [{from, to}] — values are ids or labels
 * @returns {Map<string, {col, row}>}
 */
function computeLayout(keys, conns) {
    // Build adjacency + in-degree maps
    const children  = new Map(keys.map(k => [k, []]));
    const inDegree  = new Map(keys.map(k => [k, 0]));

    for (const c of conns) {
        if (children.has(c.from) && children.has(c.to)) {
            children.get(c.from).push(c.to);
            inDegree.set(c.to, (inDegree.get(c.to) || 0) + 1);
        }
    }

    // Column assignment via BFS
    const col = new Map();
    const queue = [];

    for (const [key, deg] of inDegree) {
        if (deg === 0) {
            col.set(key, 0);
            queue.push(key);
        }
    }

    // Handle isolated nodes (not in connections at all) — put them in col 0
    for (const key of keys) {
        if (!col.has(key)) {
            const involved = conns.some(c => c.from === key || c.to === key);
            if (!involved) {
                col.set(key, 0);
                queue.push(key);
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
    for (const key of keys) {
        if (!col.has(key)) col.set(key, 0);
    }

    // Row assignment: within each column, assign rows top-to-bottom
    const rowCounter = new Map();
    const position   = new Map();

    for (const key of queue) {
        const c = col.get(key);
        const r = rowCounter.get(c) ?? 0;
        position.set(key, { col: c, row: r });
        rowCounter.set(c, r + 1);
    }

    return position;
}

/**
 * Converts layout positions to pixel coordinates.
 * Supports 'horizontal' (default), 'vertical', and 'grid' layout hints.
 *
 * @param {Map}    position   - key → {col, row}
 * @param {Array}  jsonEls    - Original Gemini elements (for w/h/radius)
 * @param {string} layout     - 'horizontal' | 'vertical' | 'grid'
 * @returns {Map<string, {x, y, width, height}>}
 */
function positionToPixels(position, jsonEls, layout = 'horizontal') {
    const shapeMap = new Map(jsonEls.map(el => [el._key, el]));
    const pixelPos = new Map();

    let maxCol = 0, maxRow = 0;
    for (const { col, row } of position.values()) {
        if (col > maxCol) maxCol = col;
        if (row > maxRow) maxRow = row;
    }

    // For 'grid' layout, arrange in a square-ish grid ignoring graph topology
    if (layout === 'grid') {
        const total  = position.size;
        const cols   = Math.max(1, Math.ceil(Math.sqrt(total)));
        let idx = 0;
        const keyArr = [...position.keys()];
        for (const key of keyArr) {
            const gcol = idx % cols;
            const grow = Math.floor(idx / cols);
            const src  = shapeMap.get(key);
            const td   = getTypeDims(src?.type);
            const w    = src?.type === 'circle' ? num(src.radius, DEFAULT_R) * 2 : num(src?.width, td.w);
            const h    = src?.type === 'circle' ? num(src.radius, DEFAULT_R) * 2 : num(src?.height, td.h);
            const totalW = (cols - 1) * H_SPACING;
            const totalH = (Math.ceil(total / cols) - 1) * V_SPACING;
            pixelPos.set(key, {
                x: gcol * H_SPACING - totalW / 2 - w / 2,
                y: grow * V_SPACING - totalH / 2 - h / 2,
                width: w, height: h,
            });
            idx++;
        }
        return pixelPos;
    }

    // Horizontal (default) — BFS col maps to X, row maps to Y
    // Vertical — BFS col maps to Y, row maps to X
    const isVertical = layout === 'vertical';

    const totalMajor = maxCol * (isVertical ? V_SPACING : H_SPACING);
    const totalMinor = maxRow * (isVertical ? H_SPACING : V_SPACING);

    // Default dimensions per shape type
    const TYPE_DEFAULTS = {
        rectangle:    { w: DEFAULT_W, h: DEFAULT_H },
        circle:       { w: DEFAULT_R * 2, h: DEFAULT_R * 2 },
        database:     { w: 80,  h: 100 },
        cloud:        { w: 140, h: 70  },
        actor:        { w: 60,  h: 100 },
        queue:        { w: 120, h: 50  },
        microservice: { w: 130, h: 90  },
        text:         { w: DEFAULT_W, h: DEFAULT_H },
    };

    for (const [key, { col, row }] of position) {
        const src = shapeMap.get(key);
        const td  = TYPE_DEFAULTS[src?.type] ?? { w: DEFAULT_W, h: DEFAULT_H };

        let w, h;
        if (src?.type === 'circle') {
            const r = num(src.radius, DEFAULT_R);
            w = r * 2; h = r * 2;
        } else {
            w = num(src?.width,  td.w);
            h = num(src?.height, td.h);
        }

        let px, py;
        if (isVertical) {
            // col = y-axis level, row = x-axis lane
            px = row * H_SPACING - totalMinor / 2 - w / 2;
            py = col * V_SPACING - totalMajor / 2 - h / 2;
        } else {
            px = col * H_SPACING - totalMajor / 2 - w / 2;
            py = row * V_SPACING - totalMinor / 2 - h / 2;
        }

        pixelPos.set(key, { x: px, y: py, width: w, height: h });
    }

    return pixelPos;
}

/** Returns default {w, h} for a shape type. */
function getTypeDims(type) {
    const map = {
        rectangle:    { w: DEFAULT_W, h: DEFAULT_H },
        circle:       { w: DEFAULT_R * 2, h: DEFAULT_R * 2 },
        database:     { w: 80,  h: 100 },
        cloud:        { w: 140, h: 70  },
        actor:        { w: 60,  h: 100 },
        queue:        { w: 120, h: 50  },
        microservice: { w: 130, h: 90  },
        text:         { w: DEFAULT_W, h: DEFAULT_H },
    };
    return map[type] ?? { w: DEFAULT_W, h: DEFAULT_H };
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

        // ── Extended AI diagram shapes ────────────────────────────────
        case 'database': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  80);
            const h = overridePos ? overridePos.height : num(el.height, 100);
            const canvasEl = { ...base, type: 'database', x, y, width: w, height: h };
            if (el.text) {
                const fs = 13;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + w / 2 - (el.text.length * fs * 0.3),
                    y: y + h + 6,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'cloud': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  140);
            const h = overridePos ? overridePos.height : num(el.height,  70);
            const canvasEl = { ...base, type: 'cloud', x, y, width: w, height: h };
            if (el.text) {
                const fs = 13;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + w / 2 - (el.text.length * fs * 0.3),
                    y: y + h * 0.55 - fs / 2,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'actor': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  60);
            const h = overridePos ? overridePos.height : num(el.height, 100);
            const canvasEl = { ...base, type: 'actor', x, y, width: w, height: h };
            if (el.text) {
                const fs = 13;
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + w / 2 - (el.text.length * fs * 0.3),
                    y: y + h + 6,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs, strokeColor: '#1a103d',
                }];
            }
            return [canvasEl];
        }

        case 'queue': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  120);
            const h = overridePos ? overridePos.height : num(el.height,  50);
            const canvasEl = { ...base, type: 'queue', x, y, width: w, height: h };
            if (el.text) {
                const fs = 13;
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

        case 'microservice': {
            const x = overridePos ? overridePos.x : num(el.x);
            const y = overridePos ? overridePos.y : num(el.y);
            const w = overridePos ? overridePos.width  : num(el.width,  130);
            const h = overridePos ? overridePos.height : num(el.height,  90);
            const canvasEl = { ...base, type: 'microservice', x, y, width: w, height: h };
            if (el.text) {
                const fs = 12;
                const tagH = Math.max(14, h * 0.18);
                return [canvasEl, {
                    ...base, id: uuidv4(), type: 'text',
                    x: x + 6,
                    y: y + tagH / 2 - fs / 2,
                    width: el.text.length * (fs * 0.6), height: fs * 1.4,
                    text: el.text, fontSize: fs,
                    strokeColor: '#ffffff',  // white text on dark tag banner
                }];
            }
            return [canvasEl];
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

const resolveConnections = (connections, idToEl, labelToEl) => {
    const lines = [];
    for (const conn of (connections || [])) {
        // Prefer id-based lookup, fall back to label-based
        const srcEl = idToEl[conn.from] || labelToEl[conn.from];
        const tgtEl = idToEl[conn.to]   || labelToEl[conn.to];
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
                fontFamily: 'handwriting',
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
 * @param {string} options.layout             - 'horizontal' | 'vertical' | 'grid'
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

    const { viewportCenter, existingElements = [], layout = 'horizontal' } = options;

    // ── 0. Normalize elements: unify label/text field, attach lookup key
    //    The backend already normalises, but be defensive client-side too.
    const normalized = jsonElements.map(el => ({
        ...el,
        text:  el.text  || el.label || '',
        label: el.label || el.text  || '',
        // Use provided id as the lookup key; fall back to the label
        _key:  el.id    || el.label || el.text || uuidv4(),
    }));

    // ── 1. Determine which elements have a key (for layout) vs unlabeled
    const labeled   = normalized.filter(el => el._key && el.text);
    const unlabeled = normalized.filter(el => !el.text);
    const keys      = labeled.map(el => el._key);

    // Normalize connections: remap from/to to _key space
    // Build id→_key and label→_key lookup to remap connections
    const idToKey    = new Map(labeled.filter(el => el.id).map(el => [el.id,    el._key]));
    const labelToKey = new Map(labeled.map(el => [el.label, el._key]));
    const normalizedConns = connections.map(c => ({
        ...c,
        from: idToKey.get(c.from) || labelToKey.get(c.from) || c.from,
        to:   idToKey.get(c.to)   || labelToKey.get(c.to)   || c.to,
    }));

    // ── 2. Compute graph layout → key → {col, row}
    const position = computeLayout(keys, normalizedConns);

    // ── 3. Convert layout positions to pixel coords (centred at 0,0)
    const pixelPos = positionToPixels(position, labeled, layout);

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
    for (const [key, pos] of pixelPos) {
        translatedPos.set(key, {
            x: pos.x + tx, y: pos.y + ty,
            width: pos.width, height: pos.height,
        });
    }

    // ── 8. Convert elements to canvas objects
    const result    = [];
    const idToEl    = {};   // element.id   → primary shape canvas element
    const labelToEl = {};   // element.text → primary shape canvas element

    for (const el of labeled) {
        try {
            const overridePos = translatedPos.get(el._key);
            const converted   = convertElement(el, overridePos);
            if (converted) {
                result.push(...converted);
                // Register under both id and label so connection resolver can find it
                if (el.id)   idToEl[el.id]      = converted[0];
                if (el.text) labelToEl[el.text]  = converted[0];
                if (el.label && el.label !== el.text) labelToEl[el.label] = converted[0];
            }
        } catch (err) {
            console.warn('[Layout Engine] Failed to convert element:', el, err);
        }
    }

    // Unlabeled elements get placed below the diagram
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

    // ── 9. Resolve connections (id-first, then label fallback)
    const connectionLines = resolveConnections(normalizedConns, idToEl, labelToEl);
    result.push(...connectionLines);

    console.log(
        `[Layout Engine] ${jsonElements.length} elements + ${connections.length} connections` +
        ` → ${result.length} canvas objects (${connectionLines.length} arrows)` +
        ` layout=${layout} centred at (${Math.round(vc.x)}, ${Math.round(vc.y)})`
    );

    return result;
};
