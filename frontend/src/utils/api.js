import axios from 'axios';

const BASE = 'http://127.0.0.1:5000/canvas';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

/**
 * POST /canvas/create — create a new canvas
 */
export async function createCanvas(title = 'Untitled Canvas') {
    const res = await axios.post(`${BASE}/create`, { title }, getAuthHeader());
    return res.data;
}

/**
 * GET /canvas/my-canvases — fetch all canvases for the authenticated user
 */
export async function fetchUserCanvases() {
    const res = await axios.get(`${BASE}/my-canvases`, getAuthHeader());
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
    }, getAuthHeader());
    return res.data;
}

/**
 * GET /canvas/:canvasId/events — load all events for replay
 */
export async function loadEvents(canvasId) {
    const res = await axios.get(`${BASE}/${canvasId}/events`, getAuthHeader());
    return res.data;
}

/**
 * PUT /canvas/:id — update canvas metadata (title)
 */
export async function updateCanvasMetadata(canvasId, { title, thumbnail }) {
    const res = await axios.put(`${BASE}/${canvasId}`, { title, thumbnail }, getAuthHeader());
    return res.data;
}

// ─── GET /canvas/:id ───
export async function fetchCanvasMetadata(canvasId) {
    const res = await axios.get(`${BASE}/${canvasId}`, getAuthHeader());
    return res.data;
}

// ─── POST /canvas/snapshot ───
export async function saveSnapshot(canvasId, elements, lastEventOrder, backgroundColor) {
    const res = await axios.post(`${BASE}/snapshot`, {
        canvasId,
        elements,
        lastEventOrder,
        backgroundColor,
    }, getAuthHeader());
    return res.data;
}
