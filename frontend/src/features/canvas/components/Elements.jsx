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
            fill="none"
            stroke={el.strokeColor}
            strokeWidth={el.strokeWidth}
            strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={el.opacity / 100}
        />
    );
}

// ─── Database (Cylinder) ────────────────────────────────────────
export function DatabaseElement({ el }) {
    const { x, y, width: w, height: h } = el;
    const ry = Math.max(4, h * 0.15);   // ellipse y-radius for top/bottom caps
    const rx = w / 2;                   // ellipse x-radius
    const cx = x + rx;                  // centre x
    const bodyTop = y + ry;
    const bodyBot = y + h - ry;
    const fill   = el.fillColor === 'none' ? 'none' : el.fillColor;
    const stroke = el.strokeColor;
    const sw     = el.strokeWidth;
    const da     = dashArray(el.strokeStyle, sw);
    const op     = el.opacity / 100;
    return (
        <g opacity={op}>
            {/* Body rectangle */}
            <rect x={x} y={bodyTop} width={w} height={bodyBot - bodyTop}
                fill={fill} stroke="none" />
            {/* Left and right body edges */}
            <line x1={x}     y1={bodyTop} x2={x}     y2={bodyBot} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
            <line x1={x + w} y1={bodyTop} x2={x + w} y2={bodyBot} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
            {/* Bottom ellipse */}
            <ellipse cx={cx} cy={bodyBot} rx={rx} ry={ry}
                fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
            {/* Top ellipse (drawn last so it sits on top) */}
            <ellipse cx={cx} cy={bodyTop} rx={rx} ry={ry}
                fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
        </g>
    );
}

// ─── Cloud ──────────────────────────────────────────────────────
export function CloudElement({ el }) {
    const { x, y, width: w, height: h } = el;
    // Normalised cloud path on a 100×60 viewport, then scaled with a transform
    const path = [
        'M 25,50',
        'Q 5,50 5,35',
        'Q 5,20 20,20',
        'Q 20,5 35,5',
        'Q 50,5 55,15',
        'Q 65,5 80,10',
        'Q 95,10 95,25',
        'Q 100,25 100,35',
        'Q 100,50 85,50',
        'Z',
    ].join(' ');
    return (
        <g opacity={el.opacity / 100}
           transform={`translate(${x},${y}) scale(${w / 100},${h / 50})`}>
            <path d={path}
                fill={el.fillColor === 'none' ? '#f0f4ff' : el.fillColor}
                stroke={el.strokeColor}
                strokeWidth={el.strokeWidth * (100 / w)}
                strokeDasharray={dashArray(el.strokeStyle, el.strokeWidth)}
                strokeLinejoin="round"
            />
        </g>
    );
}

// ─── Actor (Stick-figure user icon) ─────────────────────────────
export function ActorElement({ el }) {
    const { x, y, width: w, height: h } = el;
    const cx   = x + w / 2;
    const hr   = Math.min(w, h) * 0.18;   // head radius
    const headCy = y + hr + 2;
    const bodyT  = headCy + hr;
    const bodyB  = y + h * 0.68;
    const legY   = y + h;
    const armY   = bodyT + (bodyB - bodyT) * 0.35;
    const sw  = el.strokeWidth;
    const col = el.strokeColor;
    const op  = el.opacity / 100;
    return (
        <g opacity={op} strokeLinecap="round">
            {/* Head */}
            <circle cx={cx} cy={headCy} r={hr}
                fill={el.fillColor === 'none' ? 'none' : el.fillColor}
                stroke={col} strokeWidth={sw} />
            {/* Body */}
            <line x1={cx} y1={bodyT} x2={cx} y2={bodyB} stroke={col} strokeWidth={sw} />
            {/* Arms */}
            <line x1={x + w * 0.1} y1={armY} x2={x + w * 0.9} y2={armY} stroke={col} strokeWidth={sw} />
            {/* Legs */}
            <line x1={cx} y1={bodyB} x2={x + w * 0.15} y2={legY} stroke={col} strokeWidth={sw} />
            <line x1={cx} y1={bodyB} x2={x + w * 0.85} y2={legY} stroke={col} strokeWidth={sw} />
        </g>
    );
}

// ─── Queue (rectangle with double-bar ends) ──────────────────────
export function QueueElement({ el }) {
    const { x, y, width: w, height: h } = el;
    const barW  = Math.max(4, w * 0.07);
    const fill  = el.fillColor === 'none' ? 'none' : el.fillColor;
    const stroke = el.strokeColor;
    const sw    = el.strokeWidth;
    const da    = dashArray(el.strokeStyle, sw);
    const op    = el.opacity / 100;
    return (
        <g opacity={op}>
            {/* Main body */}
            <rect x={x} y={y} width={w} height={h}
                rx={4} ry={4}
                fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
            {/* Left bar */}
            <rect x={x} y={y} width={barW} height={h}
                rx={4} ry={4}
                fill={stroke} opacity={0.15} />
            <line x1={x + barW} y1={y} x2={x + barW} y2={y + h}
                stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
            {/* Right bar */}
            <rect x={x + w - barW} y={y} width={barW} height={h}
                rx={4} ry={4}
                fill={stroke} opacity={0.15} />
            <line x1={x + w - barW} y1={y} x2={x + w - barW} y2={y + h}
                stroke={stroke} strokeWidth={sw} strokeDasharray={da} />
        </g>
    );
}

// ─── Microservice (dashed-border container box with tag) ─────────
export function MicroserviceElement({ el }) {
    const { x, y, width: w, height: h } = el;
    const tagH  = Math.max(14, h * 0.18);
    const tagW  = Math.min(w * 0.55, 80);
    const fill  = el.fillColor === 'none' ? '#f8f7ff' : el.fillColor;
    const stroke = el.strokeColor;
    const sw    = el.strokeWidth;
    const op    = el.opacity / 100;
    return (
        <g opacity={op}>
            {/* Outer dashed container */}
            <rect x={x} y={y} width={w} height={h}
                rx={6} ry={6}
                fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={`${sw * 4} ${sw * 2}`} />
            {/* Top banner / tag */}
            <rect x={x} y={y} width={tagW} height={tagH}
                rx={6} ry={6}
                fill={stroke} opacity={0.85} />
            {/* Inner service box */}
            <rect x={x + 8} y={y + tagH + 8}
                width={w - 16} height={h - tagH - 16}
                rx={4} ry={4}
                fill="none" stroke={stroke} strokeWidth={sw * 0.75}
                strokeDasharray="none" />
        </g>
    );
}

// ─── Text ───────────────────────────────────────────────────────
// ─── Text ───────────────────────────────────────────────────────
const FONT_CSS = {
    handwriting: "'Caveat', 'Comic Sans MS', 'Chalkboard SE', cursive",
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
        case 'rect':         return <RectElement        el={el} />;
        case 'diamond':      return <DiamondElement     el={el} />;
        case 'circle':       return <CircleElement      el={el} />;
        case 'arrow':        return <ArrowElement       el={el} />;
        case 'freehand':     return <FreehandElement    el={el} />;
        case 'text':         return <TextElement        el={el} />;
        case 'image':        return <ImageElement       el={el} />;
        // ── Extended AI diagram shapes ──
        case 'database':     return <DatabaseElement    el={el} />;
        case 'cloud':        return <CloudElement       el={el} />;
        case 'actor':        return <ActorElement       el={el} />;
        case 'queue':        return <QueueElement       el={el} />;
        case 'microservice': return <MicroserviceElement el={el} />;
        default: return null;
    }
}
