/**
 * JSON Diagram Interpreter — converts Gemini-generated JSON diagram elements
 * into ShadowCanvas drawing objects.
 *
 * Replaces the previous SVG parser. The backend now instructs Gemini to return
 * structured JSON instead of SVG, which is far more reliable to interpret.
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

/**
 * Safely coerces a value to a number, returning `fallback` if NaN.
 */
const num = (val, fallback = 0) => {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
};

/**
 * Converts a single JSON element from Gemini into a ShadowCanvas element object.
 * Returns null for unsupported or malformed entries.
 *
 * @param {Object} el - Raw element from Gemini JSON
 * @returns {Object|null} Canvas element or null
 */
const convertElement = (el) => {
    if (!el || typeof el !== 'object' || !el.type) return null;

    const base = { id: uuidv4(), ...DEFAULTS };

    switch (el.type) {
        case 'rectangle': {
            const x = num(el.x);
            const y = num(el.y);
            const width = num(el.width, 120);
            const height = num(el.height, 60);

            const canvasEl = { ...base, type: 'rect', x, y, width, height };

            // If the rectangle has a text label, create a companion text element
            // centred inside the box. We return both as a mini-array.
            if (el.text) {
                const labelFontSize = 14;
                const labelEl = {
                    ...base,
                    id: uuidv4(),
                    type: 'text',
                    x: x + width / 2 - (el.text.length * labelFontSize * 0.3),
                    y: y + height / 2 - labelFontSize / 2,
                    width: el.text.length * (labelFontSize * 0.6),
                    height: labelFontSize * 1.4,
                    text: el.text,
                    fontSize: labelFontSize,
                    strokeColor: '#1a103d',
                };
                return [canvasEl, labelEl];
            }
            return [canvasEl];
        }

        case 'circle': {
            const r = num(el.radius, 40);
            const cx = num(el.x);
            const cy = num(el.y);

            // ShadowCanvas circle uses bounding-box (x, y, width, height)
            const canvasEl = {
                ...base,
                type: 'circle',
                x: cx - r,
                y: cy - r,
                width: r * 2,
                height: r * 2,
            };

            if (el.text) {
                const labelFontSize = 13;
                const labelEl = {
                    ...base,
                    id: uuidv4(),
                    type: 'text',
                    x: cx - (el.text.length * labelFontSize * 0.3),
                    y: cy - labelFontSize / 2,
                    width: el.text.length * (labelFontSize * 0.6),
                    height: labelFontSize * 1.4,
                    text: el.text,
                    fontSize: labelFontSize,
                    strokeColor: '#1a103d',
                };
                return [canvasEl, labelEl];
            }
            return [canvasEl];
        }

        case 'line': {
            const x1 = num(el.x1);
            const y1 = num(el.y1);
            const x2 = num(el.x2);
            const y2 = num(el.y2);
            return [{
                ...base,
                type: 'line',
                // Bounding box for selection / move
                x: Math.min(x1, x2),
                y: Math.min(y1, y2),
                width: Math.abs(x2 - x1) || 2,
                height: Math.abs(y2 - y1) || 2,
                // Actual endpoints used by Canvas renderer
                x1, y1, x2, y2,
            }];
        }

        case 'text': {
            const x = num(el.x);
            const y = num(el.y);
            const text = String(el.text || '');
            const fontSize = num(el.fontSize, DEFAULTS.fontSize);
            return [{
                ...base,
                type: 'text',
                x,
                y,
                width: text.length * (fontSize * 0.6),
                height: fontSize * 1.4,
                text,
                fontSize,
            }];
        }

        default:
            console.log(`[JSON Interpreter] Skipping unsupported type: "${el.type}"`);
            return null;
    }
};

/**
 * Converts an array of Gemini JSON elements into ShadowCanvas element objects.
 *
 * @param {Array<Object>} jsonElements - The elements array from the Gemini API response
 * @returns {Array<Object>} Flat array of canvas elements ready to insert
 */
export const parseSvgToCanvasElements = (jsonElements) => {
    if (!Array.isArray(jsonElements) || jsonElements.length === 0) {
        console.warn('[JSON Interpreter] Received empty or invalid elements array');
        return [];
    }

    const result = [];

    for (const el of jsonElements) {
        try {
            const converted = convertElement(el);
            if (converted) {
                // convertElement returns an array (element + optional label)
                result.push(...converted);
            }
        } catch (err) {
            console.warn('[JSON Interpreter] Failed to convert element:', el, err);
        }
    }

    console.log(`[JSON Interpreter] Converted ${jsonElements.length} JSON elements → ${result.length} canvas objects`);
    return result;
};
