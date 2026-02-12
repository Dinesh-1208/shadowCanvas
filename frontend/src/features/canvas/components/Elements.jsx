import React from 'react';

// ─── Dash pattern mapping ───────────────────────────────────────
function dashArray(style, width) {
    if (style === 'dashed') return `${width * 4}, ${width * 2}`;
    if (style === 'dotted') return `${width * 0.5}, ${width * 2}`;
    return 'none';
}

// ─── Rectangle ──────────────────────────────────────────────────
export function RectElement({ el }) {
    const rx = el.edgeStyle === 'rounded' ? 8 : 0;
    return (
        <rect
            x={el.x} y={el.y} width={el.width} height={el.height}
            rx={rx} ry={rx}
            fill={el.fillColor === 'none' ? 'none' : el.fillColor}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
            opacity={el.opacity / 100}
        />
    );
}

// ─── Diamond ────────────────────────────────────────────────────
export function DiamondElement({ el }) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const points = `${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`;
    return (
        <polygon
            points={points}
            fill={el.fillColor === 'none' ? 'none' : el.fillColor}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
            strokeLinejoin={el.edgeStyle === 'rounded' ? 'round' : 'miter'}
            opacity={el.opacity / 100}
        />
    );
}

// ─── Circle / Ellipse ───────────────────────────────────────────
export function CircleElement({ el }) {
    return (
        <ellipse
            cx={el.x + el.width / 2}
            cy={el.y + el.height / 2}
            rx={el.width / 2}
            ry={el.height / 2}
            fill={el.fillColor === 'none' ? 'none' : el.fillColor}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
            opacity={el.opacity / 100}
        />
    );
}

// ─── Arrow ──────────────────────────────────────────────────────
export function ArrowElement({ el }) {
    const ARROW_SIZE = 10;
    const dx = el.x2 - el.x1;
    const dy = el.y2 - el.y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Arrowhead tip
    const tipX = el.x2;
    const tipY = el.y2;
    // Two base points of arrowhead
    const baseX = tipX - ux * ARROW_SIZE;
    const baseY = tipY - uy * ARROW_SIZE;
    const leftX = baseX + uy * (ARROW_SIZE * 0.4);
    const leftY = baseY - ux * (ARROW_SIZE * 0.4);
    const rightX = baseX - uy * (ARROW_SIZE * 0.4);
    const rightY = baseY + ux * (ARROW_SIZE * 0.4);

    // If arrowEnd is explicitly 'none', skip the arrowhead; default to showing it
    const showHead = el.arrowEnd !== 'none';

    return (
        <g opacity={el.opacity / 100}>
            {/* Shaft */}
            <line
                x1={el.x1} y1={el.y1} x2={showHead ? baseX : el.x2} y2={showHead ? baseY : el.y2}
                stroke={el.strokeColor}
                strokeWidth={el.strokeWidth}
                strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
                strokeLinecap="round"
            />
            {/* Arrowhead (only when enabled) */}
            {showHead && (
                <polygon
                    points={`${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`}
                    fill={el.strokeColor}
                />
            )}
        </g>
    );
}

// ─── Freehand / Pencil Path ─────────────────────────────────────
export function FreehandElement({ el }) {
    if (!el.points || el.points.length < 2) return null;
    // Build SVG path with quadratic curves for smoothness
    let d = `M ${el.points[0].x} ${el.points[0].y}`;
    for (let i = 1; i < el.points.length - 1; i++) {
        const xc = (el.points[i].x + el.points[i + 1].x) / 2;
        const yc = (el.points[i].y + el.points[i + 1].y) / 2;
        d += ` Q ${el.points[i].x} ${el.points[i].y} ${xc} ${yc}`;
    }
    const last = el.points[el.points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return (
        <path
            d={d}
            fill={el.fillColor === 'none' ? 'none' : el.fillColor}
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={el.opacity / 100}
        />
    );
}

// ─── Text ───────────────────────────────────────────────────────
// ─── Text ───────────────────────────────────────────────────────
const FONT_CSS = {
    handwriting: "'Comic Sans MS', 'Chalkboard SE', cursive",
    normal: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    code: "'Consolas', 'Courier New', monospace",
};

export function TextElement({ el }) {
    return (
        <foreignObject x={el.x} y={el.y} width={el.width || 200} height={el.height || 40}>
            <div style={{
                color: el.strokeColor,
                fontSize: el.fontSize || 16,
                fontFamily: FONT_CSS[el.fontFamily] || FONT_CSS.normal,
                textAlign: el.textAlign || 'left',
                fontWeight: el.fontWeight || 'normal',
                opacity: el.opacity / 100,
                padding: '2px 4px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.35,
            }}>
                {el.text || ''}
            </div>
        </foreignObject>
    );
}

// ─── Image ──────────────────────────────────────────────────────
export function ImageElement({ el }) {
    return (
        <image
            href={el.src}
            x={el.x} y={el.y}
            width={el.width} height={el.height}
            preserveAspectRatio="xMidYMid meet"
            opacity={el.opacity / 100}
        />
    );
}

// ─── Unified renderer ──────────────────────────────────────────
export function ElementRenderer({ el }) {
    if (!el) return null;
    switch (el.type) {
        case 'rect': return <RectElement el={el} />;
        case 'diamond': return <DiamondElement el={el} />;
        case 'circle': return <CircleElement el={el} />;
        case 'arrow': return <ArrowElement el={el} />;
        case 'freehand': return <FreehandElement el={el} />;
        case 'text': return <TextElement el={el} />;
        case 'image': return <ImageElement el={el} />;
        default: return null;
    }
}
