import express from 'express';
// Updated imports to use .model.js extension
import Canvas from '../models/Canvas.model.js';
import CanvasState from '../models/CanvasState.model.js';
import CanvasEvent from '../models/CanvasEvent.model.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protection to all canvas routes
router.use(protect);

// ─── POST /canvas/create ─── Create a new canvas (metadata only)
router.post('/create', async (req, res) => {
    try {
        const { title } = req.body;
        const ownerId = req.user?.userId || 'single-user'; // Fallback if auth fails or not provided, though route is protected

        const canvas = new Canvas({
            ownerId: ownerId,
            title: title || 'Untitled Canvas',
        });

        await canvas.save();

        res.status(201).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                ownerId: canvas.ownerId,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            },
        });
    } catch (err) {
        console.error('[Canvas Create Error]', err);
        res.status(500).json({ success: false, error: 'Failed to create canvas' });
    }
});

// ─── GET /canvas/my-canvases ─── Fetch all canvases for the authenticated user
router.get('/my-canvases', async (req, res) => {
    try {
        const ownerId = req.user?.userId;

        if (!ownerId) {
            return res.status(400).json({ success: false, error: 'User ID not found in request' });
        }

        const canvases = await Canvas.find({ ownerId })
            .select('_id title ownerId thumbnail updatedAt createdAt')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            canvases,
        });
    } catch (err) {
        console.error('[Fetch My Canvases Error]', err);
        res.status(500).json({ success: false, error: 'Failed to fetch canvases' });
    }
});

// ─── POST /canvas/snapshot ─── Save a canvas snapshot
router.post('/snapshot', async (req, res) => {
    try {
        const { canvasId, elements, lastEventOrder, backgroundColor } = req.body;

        if (!canvasId || !elements || lastEventOrder === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing fields: canvasId, elements, lastEventOrder'
            });
        }

        const snapshot = new CanvasState({
            canvasId,
            elements,
            backgroundColor: backgroundColor || '#fafafa',
            lastEventOrder
        });

        await snapshot.save();

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('[Snapshot Save Error]', err);
        res.status(500).json({ success: false, error: 'Failed to save snapshot' });
    }
});

// ─── POST /canvas/event ─── Save a single drawing event
router.post('/event', async (req, res) => {
    try {
        const { canvasId, eventType, eventData, eventOrder } = req.body;

        // Validate required fields
        if (!canvasId || !eventType || eventData === undefined || eventOrder === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: canvasId, eventType, eventData, eventOrder',
            });
        }

        // Verify canvas exists
        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        const event = new CanvasEvent({
            canvasId,
            userId: 'single-user',
            eventType,
            eventData,
            timestamp: new Date(),
            eventOrder,
        });

        await event.save();

        // Update canvas updatedAt timestamp
        canvas.updatedAt = new Date();
        await canvas.save({ validateModifiedOnly: true });

        res.status(201).json({
            success: true,
            event: {
                _id: event._id,
                canvasId: event.canvasId,
                eventType: event.eventType,
                eventOrder: event.eventOrder,
                timestamp: event.timestamp,
            },
        });
    } catch (err) {
        console.error('[Canvas Event Error]', err);
        res.status(500).json({ success: false, error: 'Failed to save event' });
    }
});

// ─── GET /canvas/:canvasId/events ─── Load state (Snapshot + Events)
router.get('/:canvasId/events', async (req, res) => {
    try {
        const { canvasId } = req.params;

        // Verify canvas exists
        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // 1. Get latest snapshot
        const latestSnapshot = await CanvasState.findOne({ canvasId })
            .sort({ lastEventOrder: -1 })
            .lean();

        let query = { canvasId };
        let baseElements = [];
        let baseBackgroundColor = '#fafafa';
        let snapshotOrder = 0;

        if (latestSnapshot) {
            baseElements = latestSnapshot.elements;
            baseBackgroundColor = latestSnapshot.backgroundColor || '#fafafa';
            snapshotOrder = latestSnapshot.lastEventOrder;
            // Fetch only events AFTER the snapshot
            query.eventOrder = { $gt: snapshotOrder };
        }

        // 2. Fetch events
        const events = await CanvasEvent.find(query)
            .sort({ eventOrder: 1 })
            .select('eventType eventData timestamp eventOrder')
            .lean();

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            },
            snapshot: latestSnapshot ? { elements: baseElements, backgroundColor: baseBackgroundColor, lastEventOrder: snapshotOrder } : null,
            events,
        });
    } catch (err) {
        console.error('[Canvas Events Load Error]', err);
        res.status(500).json({ success: false, error: 'Failed to load events' });
    }
});

// ─── PUT /canvas/:id ─── Update canvas metadata (e.g. title, thumbnail)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, thumbnail } = req.body;
        console.log(`[PUT /${id}] Received update. Keys: ${Object.keys(req.body)}, Thumbnail length: ${thumbnail ? thumbnail.length : 'N/A'}`);

        const updateData = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        const canvas = await Canvas.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        res.json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                updatedAt: canvas.updatedAt,
            },
        });
    } catch (err) {
        console.error('[Canvas Update Error]', err);
        res.status(500).json({ success: false, error: 'Failed to update canvas' });
    }
});

// ─── GET /canvas/:id ─── Fetch canvas metadata by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const canvas = await Canvas.findById(id);

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // Allow access if owner matches OR if it's a guest canvas 'single-user'
        // In a real app, you might restrict 'single-user' access further, but for this feature it's needed.
        if (canvas.ownerId !== 'single-user' && canvas.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this canvas' });
        }

        res.json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                ownerId: canvas.ownerId,
                updatedAt: canvas.updatedAt,
                createdAt: canvas.createdAt,
            },
        });
    } catch (err) {
        console.error('[Canvas Metadata Error]', err);
        res.status(500).json({ success: false, error: 'Failed to fetch canvas' });
    }
});

export default router;
