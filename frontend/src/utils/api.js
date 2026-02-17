import axios from 'axios';

const BASE = '/canvas';

/**
 * POST /canvas/create — create a new canvas
 */
export async function createCanvas(title = 'Untitled Canvas', roomCode) {
    const res = await axios.post(`${BASE}/create`, { title, roomCode });
    return res.data;
}

/**
 * GET /canvas/room/:roomCode — find canvas by room code
 */
export async function getCanvasByRoom(roomCode) {
    const res = await axios.get(`${BASE}/room/${roomCode}`);
    return res.data;
}

/**
 * POST /canvas/event — persist a single drawing event
 */
export async function saveEvent({ canvasId, eventType, eventData, eventOrder }) {
    const res = await axios.post(`${BASE}/event`, {
        canvasId,
        eventType,
        eventData,
        eventOrder,
    });
    return res.data;
}

/**
 * GET /canvas/:canvasId/events — load all events for replay
 */
export async function loadEvents(canvasId) {
    const res = await axios.get(`${BASE}/${canvasId}/events`);
    return res.data;
}
/**
 * PUT /canvas/:id — update canvas metadata (title)
 */
export async function updateCanvasMetadata(canvasId, { title }) {
    await axios.put(`${BASE}/${canvasId}`, { title });
}

// ─── POST /canvas/snapshot ───
export async function saveSnapshot(canvasId, elements, lastEventOrder) {
    const res = await axios.post(`${BASE}/snapshot`, {
        canvasId,
        elements,
        lastEventOrder,
    });
    return res.data;
}
