import express from 'express';
// Updated imports to use .model.js extension
import Canvas from '../models/Canvas.model.js';
import CanvasState from '../models/CanvasState.model.js';
import CanvasEvent from '../models/CanvasEvent.model.js';

import { protect } from '../middleware/auth.middleware.js'; // Import auth middleware
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const router = express.Router();

// ─── POST /canvas/create ─── Create a new canvas (metadata only)
router.post('/create', async (req, res) => {
    try {
        const { title, roomCode } = req.body;
        let ownerId = 'single-user';

        if (!roomCode) {
            return res.status(400).json({ success: false, error: 'Room code is required' });
        }

        // Check for token to associate with user
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.userId);
                if (user) {
                    ownerId = user._id; // Associate with user ID
                }
            } catch (authError) {
                console.warn('[Canvas Create] Token invalid, proceeding as guest', authError.message);
            }
        }

        const canvas = new Canvas({
            ownerId: ownerId,
            title: title || 'Untitled Canvas',
            roomCode: roomCode.toUpperCase(),
        });

        await canvas.save();

        res.status(201).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
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

// ─── GET /canvas/user-canvases ─── Get all canvases for logged-in user
router.get('/user-canvases', protect, async (req, res) => {
    try {
        // req.user is set by protect middleware
        const canvases = await Canvas.find({ ownerId: req.user._id })
            .sort({ updatedAt: -1 });

        console.log(`[GET /user-canvases] Found ${canvases.length} canvases`);
        canvases.forEach(c => console.log(` - Canvas ${c._id}: ${c.title}, Thumbnail length: ${c.thumbnail ? c.thumbnail.length : 0}`));

        res.status(200).json({
            success: true,
            canvases
        });
    } catch (err) {
        console.error('[User Canvases Error]', err);
        res.status(500).json({ success: false, error: 'Failed to fetch user canvases' });
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
        console.error('[Snapshot Error]', err);
        res.status(500).json({ success: false, error: 'Failed to save snapshot' });
    }
});

// ─── GET /canvas/:id/latest-snapshot ───
router.get('/:id/latest-snapshot', async (req, res) => {
    try {
        const { id } = req.params;
        const snapshot = await CanvasState.findOne({ canvasId: id })
            .sort({ lastEventOrder: -1 });

        if (!snapshot) {
            return res.json({ success: true, snapshot: null });
        }

        res.json({ success: true, snapshot });
    } catch (err) {
        console.error('[Snapshot Load Error]', err);
        res.status(500).json({ success: false, error: 'Failed to load snapshot' });
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

// ─── GET /canvas/room/:roomCode ─── Find canvas by room code
router.get('/room/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const canvas = await Canvas.findOne({ roomCode: roomCode.toUpperCase() });

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            }
        });
    } catch (err) {
        console.error('[Canvas Room Load Error]', err);
        res.status(500).json({ success: false, error: 'Failed to load room' });
    }
});

// ─── GET /canvas/:id/events ─── Load state (Snapshot + Events)
router.get('/:id/events', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify canvas exists
        const canvas = await Canvas.findById(id);
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // 1. Get latest snapshot
        const latestSnapshot = await CanvasState.findOne({ canvasId: id })
            .sort({ lastEventOrder: -1 })
            .lean();

        let query = { canvasId: id };
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
                thumbnail: canvas.thumbnail,
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

// ─── DELETE /canvas/:id ─── Delete a canvas
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const canvas = await Canvas.findOne({ _id: id });

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // Check ownership
        if (canvas.ownerId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to delete this canvas' });
        }

        await Canvas.findByIdAndDelete(id);
        // Optionally delete associated events and state if referencing by ID, but strict cleanup might not be needed for MVP

        res.json({ success: true, message: 'Canvas deleted successfully' });
    } catch (err) {
        console.error('[Canvas Delete Error]', err);
        res.status(500).json({ success: false, error: 'Failed to delete canvas' });
    }
});

export default router;
