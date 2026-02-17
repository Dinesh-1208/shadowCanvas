export async function generateThumbnail(svgElement, elements) {
    if (!svgElement) return null;

    // 1. Calculate bounding box of all elements
    // We'll trust the caller passes a valid SVG reference or we can clone the current one
    // But working with the DOM element is easiest for serialization

    // 1. Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (elements && elements.length > 0) {
        elements.forEach(el => {
            // Use simplified logic if bbox helper matches Canvas implementation
            const x = el.x;
            const y = el.y;
            const w = el.width || 0;
            const h = el.height || 0;
            // Handle negative dimensions
            const rX = w < 0 ? x + w : x;
            const rY = h < 0 ? y + h : y;
            const rW = Math.abs(w);
            const rH = Math.abs(h);

            // For lines/arrows/freehand, we might need more specific logic
            // But for a thumbnail, a rough box is fine. 
            // If it's freehand, el.points needed.
            if (el.type === 'freehand' && el.points) {
                el.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            } else if (el.type === 'arrow') {
                minX = Math.min(minX, el.x1, el.x2);
                minY = Math.min(minY, el.y1, el.y2);
                maxX = Math.max(maxX, el.x1, el.x2);
                maxY = Math.max(maxY, el.y1, el.y2);
            } else {
                minX = Math.min(minX, rX);
                minY = Math.min(minY, rY);
                maxX = Math.max(maxX, rX + rW);
                maxY = Math.max(maxY, rY + rH);
            }
        });
    } else {
        // Default empty canvas
        minX = 0; minY = 0; maxX = 800; maxY = 600;
    }

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Validate bounds
    if (!isFinite(minX) || !isFinite(maxX)) return null;

    const width = maxX - minX;
    const height = maxY - minY;

    // 2. Clone SVG for serialization
    // We need to clone the node to modify viewBox without affecting the live canvas
    const clone = svgElement.cloneNode(true);

    // Remove grid or background if we want transparent/clean thumbnail
    // Assuming the first child is the grid defs/rect, we might want to keep the elements group
    // In Canvas.jsx: <g transform...> contains elements.
    // The clone includes the transformation. We successfully want to frame the content.

    // Reset the transform of the main group to identity so our viewBox works in absolute coords?
    // In Canvas.jsx: <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
    // We want the thumbnail to be unzoomed/unpanned relative to the content.

    const contentGroup = clone.querySelector('g');
    if (contentGroup) {
        contentGroup.setAttribute('transform', ''); // Remove Zoom/Pan
    }

    // Set viewBox to our calculated bounds
    clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    clone.setAttribute('width', '500'); // Output width
    clone.setAttribute('height', (500 * (height / width)).toString());
    clone.style.backgroundColor = 'white'; // Force white background for thumbnail

    // 3. Serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 4. Draw to Canvas to convert to PNG/JPEG
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Fixed thumbnail size or maintain aspect ratio?
            // Let's cap max dimension to save space
            const MAX_THUMB_SIZE = 400;
            let thumbW = width;
            let thumbH = height;

            if (thumbW > thumbH) {
                if (thumbW > MAX_THUMB_SIZE) {
                    thumbH = thumbH * (MAX_THUMB_SIZE / thumbW);
                    thumbW = MAX_THUMB_SIZE;
                }
            } else {
                if (thumbH > MAX_THUMB_SIZE) {
                    thumbW = thumbW * (MAX_THUMB_SIZE / thumbH);
                    thumbH = MAX_THUMB_SIZE;
                }
            }

            canvas.width = thumbW;
            canvas.height = thumbH;
            const ctx = canvas.getContext('2d');

            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(img, 0, 0, thumbW, thumbH);

            // Export
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // JPEG 60% quality
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
}
