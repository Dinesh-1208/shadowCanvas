/**
 * geometry.js — Pure helpers for hit-testing, bounding boxes, resize handles.
 */

// ─── Bounding box from an element ────────────────────────────────
export function getBBox(el) {
    if (!el) return null;
    const { x, y, width, height } = el;
    return { x, y, width, height };
}

// ─── Point inside axis-aligned rect ─────────────────────────────
export function pointInRect(px, py, rect) {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

// ─── Distance between two points ─────────────────────────────────
export function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ─── Approximate hit-test for a freehand path ───────────────────
export function pointNearPath(px, py, points, threshold = 6) {
    for (let i = 0; i < points.length - 1; i++) {
        const d = distToSegment(px, py, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        if (d < threshold) return true;
    }
    return false;
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return dist(px, py, x1, y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return dist(px, py, x1 + t * dx, y1 + t * dy);
}

// ─── Bounding box for freehand points ───────────────────────────
export function bboxFromPoints(points) {
    if (!points || points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }
    return {
        x: minX - 4,
        y: minY - 4,
        width: maxX - minX + 8,
        height: maxY - minY + 8,
    };
}

// ─── Bounding box for an arrow (two endpoints) ──────────────────
export function bboxFromArrow(el) {
    const minX = Math.min(el.x1, el.x2);
    const minY = Math.min(el.y1, el.y2);
    const maxX = Math.max(el.x1, el.x2);
    const maxY = Math.max(el.y1, el.y2);
    return {
        x: minX - 6,
        y: minY - 6,
        width: maxX - minX + 12,
        height: maxY - minY + 12,
    };
}

// ─── Unified bounding box for any element ───────────────────────
export function elementBBox(el) {
    if (!el) return null;
    switch (el.type) {
        case 'freehand':
            return bboxFromPoints(el.points);
        case 'arrow':
            return bboxFromArrow(el);
        case 'text':
            return { x: el.x, y: el.y, width: el.width || 120, height: el.height || 30 };
        case 'image':
            return { x: el.x, y: el.y, width: el.width || 100, height: el.height || 100 };
        default:
            // rect, diamond, circle
            return { x: el.x, y: el.y, width: el.width, height: el.height };
    }
}

// ─── Point inside polygon (Ray casting) ─────────────────────────
export function pointInPolygon(px, py, points) {
    if (!points || points.length < 3) return false;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;

        const intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }
    return inside;
}

// ─── Hit-test: does (px,py) hit this element? ───────────────────
export function hitTest(px, py, el, options = {}) {
    if (!el) return false;
    const bb = elementBBox(el);
    if (!bb) return false;

    // Optional: checkInside forces a check for interior even if not filled
    const { checkInside = false } = options;

    switch (el.type) {
        case 'freehand':
            // 1. Check inside if filled or requested
            const isFilled = (el.fillColor && el.fillColor !== 'none') || checkInside;
            if (isFilled && pointInPolygon(px, py, el.points)) {
                return true;
            }

            // 2. Check near stroke (fallback)
            // Optimization: check if inside expanded bbox first
            if (!pointInRect(px, py, { x: bb.x - 4, y: bb.y - 4, width: bb.width + 8, height: bb.height + 8 })) {
                return false;
            }
            return pointNearPath(px, py, el.points, 8);

        case 'circle': {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const rx = el.width / 2;
            const ry = el.height / 2;
            const dx = (px - cx) / rx;
            const dy = (py - cy) / ry;
            const d = dx * dx + dy * dy;

            // If checking inside (Paint Bucket), any point <= 1 is a hit.
            if (checkInside && d <= 1.0) return true;

            // Otherwise default to standard selection (stroke + small fill tolerance)
            return d <= 1.15;
        }
        case 'diamond': {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const hw = el.width / 2;
            const hh = el.height / 2;
            return Math.abs(px - cx) / hw + Math.abs(py - cy) / hh <= 1.1;
        }
        case 'arrow': {
            return dist(px, py, el.x1, el.y1, el.x2, el.y2) < 8 ||
                pointInRect(px, py, bb);
        }
        default:
            // rect, text, image
            return pointInRect(px, py, bb);
    }
}

// ─── Resize handle positions for a bounding box ─────────────────
export function getResizeHandles(bb) {
    if (!bb) return [];
    const { x, y, width, height } = bb;
    return [
        { id: 'nw', x, y },
        { id: 'n', x: x + width / 2, y },
        { id: 'ne', x: x + width, y },
        { id: 'e', x: x + width, y: y + height / 2 },
        { id: 'se', x: x + width, y: y + height },
        { id: 's', x: x + width / 2, y: y + height },
        { id: 'sw', x, y: y + height },
        { id: 'w', x, y: y + height / 2 },
    ];
}

// ─── Snap value to grid ─────────────────────────────────────────
export function snap(val, size = 10) {
    return Math.round(val / size) * size;
}

// ─── Erase from freehand stroke (split into segments) ────────────
export function eraseFromFreehand(el, ex, ey, radius = 5) {
    if (el.type !== 'freehand') return [el];

    // Optimization: Check bounding box first
    const bb = bboxFromPoints(el.points);
    if (!pointInRect(ex, ey, {
        x: bb.x - radius,
        y: bb.y - radius,
        width: bb.width + 2 * radius,
        height: bb.height + 2 * radius
    })) {
        return [el];
    }

    const oldPoints = el.points;
    const newSegments = [];
    let currentSegment = [];

    for (let i = 0; i < oldPoints.length; i++) {
        const p = oldPoints[i];
        // Check if point is inside eraser radius
        if (dist(p.x, p.y, ex, ey) > radius) {
            // Keep point
            currentSegment.push(p);
        } else {
            // Point is erased, cut segment if we have enough points
            if (currentSegment.length > 2) {
                newSegments.push(currentSegment);
            }
            currentSegment = [];
        }
    }
    // Push last segment
    if (currentSegment.length > 2) {
        newSegments.push(currentSegment);
    }

    // Return new element definitions
    // (We don't create full objects here, just the points/props needed)
    return newSegments.map(pts => ({
        ...el,
        id: undefined, // New IDs will be generated
        points: pts,
    }));
}
