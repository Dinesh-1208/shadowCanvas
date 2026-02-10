import express from 'express';
// Updated imports to use .model.js extension
import Canvas from '../models/Canvas.model.js';
import CanvasState from '../models/CanvasState.model.js';
import CanvasEvent from '../models/CanvasEvent.model.js';

const router = express.Router();

// ─── POST /canvas/create ─── Create a new canvas (metadata only)
router.post('/create', async (req, res) => {
    try {
        const { title } = req.body;

        const canvas = new Canvas({
            ownerId: 'single-user', // This works because we updated schema to Mixed
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

// ─── POST /canvas/snapshot ─── Save a canvas snapshot
router.post('/snapshot', async (req, res) => {
    try {
        const { canvasId, elements, lastEventOrder } = req.body;

        if (!canvasId || !elements || lastEventOrder === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing fields: canvasId, elements, lastEventOrder'
            });
        }

        const snapshot = new CanvasState({
            canvasId,
            elements,
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
        let snapshotOrder = 0;

        if (latestSnapshot) {
            baseElements = latestSnapshot.elements;
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
            snapshot: latestSnapshot ? { elements: baseElements, lastEventOrder: snapshotOrder } : null,
            events,
        });
    } catch (err) {
        console.error('[Canvas Events Load Error]', err);
        res.status(500).json({ success: false, error: 'Failed to load events' });
    }
});

// ─── PUT /canvas/:id ─── Update canvas metadata (e.g. title)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const canvas = await Canvas.findByIdAndUpdate(
            id,
            {
                $set: {
                    title: title,
                    updatedAt: new Date()
                }
            },
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

export default router;
