import axios from 'axios';

const BASE = 'http://localhost:5000/api/canvas';

// Helper to get auth header
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * POST /canvas/create — create a new canvas
 */
export async function createCanvas(title = 'Untitled Canvas', roomCode) {
    // Auto-generate roomCode if not provided (fixes User's MyCanvases usage)
    const finalRoomCode = roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();

    const res = await axios.post(`${BASE}/create`, { title, roomCode: finalRoomCode }, {
        headers: getAuthHeaders()
    });
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
// ─── PUT /canvas/:id ─── update canvas metadata (title, thumbnail)
export async function updateCanvasMetadata(canvasId, { title, thumbnail }) {
    const res = await axios.put(`${BASE}/${canvasId}`, { title, thumbnail });
    return res.data;
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

/**
 * GET /canvas/user-canvases — get all canvases for logged-in user
 */
export async function getUserCanvases() {
    const res = await axios.get(`${BASE}/user-canvases`, {
        headers: getAuthHeaders()
    });
    return res.data;
}

/**
 * DELETE /canvas/:id — delete a canvas
 */
export async function deleteCanvas(id) {
    const res = await axios.delete(`${BASE}/${id}`, {
        headers: getAuthHeaders()
    });
    return res.data;
}

// Alias for compatibility with User's MyCanvases.jsx
export const fetchUserCanvases = getUserCanvases;