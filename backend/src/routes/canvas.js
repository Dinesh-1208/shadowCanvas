import express from 'express';
import crypto from 'crypto';
// Updated imports to use .model.js extension
import Canvas from '../models/Canvas.model.js';
import CanvasState from '../models/CanvasState.model.js';
import CanvasEvent from '../models/CanvasEvent.model.js';
import CanvasAccess from '../models/CanvasAccess.model.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

import { protect } from '../middleware/auth.middleware.js'; // Import auth middleware
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const router = express.Router();

// Helper to determine user role
const getUserRole = (canvas, userId) => {
    if (!userId) return 'viewer';
    if (canvas.ownerId && canvas.ownerId.toString() === userId.toString()) return 'owner';
    if (canvas.editors && canvas.editors.some(id => id.toString() === userId.toString())) return 'editor';
    if (canvas.viewers && canvas.viewers.some(id => id.toString() === userId.toString())) return 'viewer';
    return 'viewer'; // Default to viewer for authenticated but non-listed users? 
    // Or maybe check CanvasAccess if using both systems. 
    // Instructions said: Assignment role: view → add to viewers, edit → add to editors.
};

const getUserIdFromRequest = (req) => {
    if (req.user) return req.user._id;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.userId;
        } catch (e) {
            return null;
        }
    }
    return null;
};

/**
 * ─── POST /canvas/generate-share-link ───
 * Generates a secure token for sharing a canvas with a specific role.
 */
router.post('/generate-share-link', protect, async (req, res) => {
    try {
        const { canvasId, role } = req.body;
        if (!canvasId || !role) {
            return res.status(400).json({ success: false, error: 'Missing canvasId or role' });
        }
        if (!['view', 'edit'].includes(role)) {
            return res.status(400).json({ success: false, error: 'Invalid role. Must be "view" or "edit"' });
        }

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // Verification: Only owner (or maybe editors) can generate links? User prompt says owner.
        // req.user._id is set by protect middleware
        if (canvas.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized to generate share link' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        canvas.shareLinks.push({ token, role });
        await canvas.save();

        // Frontend URL should ideally come from env, but per instructions we return the relative path or as requested
        const shareLink = `/canvas/shared/${token}`;

        res.status(200).json({
            success: true,
            shareLink,
            token,
            role
        });
    } catch (err) {
        console.error('[Generate Share Link Error]', err);
        res.status(500).json({ success: false, error: 'Server error generating link' });
    }
});

/**
 * ─── GET /canvas/shared/:token ───
 * Accesses a canvas via a share token and assigns the role to the user.
 */
router.get('/shared/:token', protect, async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user._id;

        const canvas = await Canvas.findOne({ 'shareLinks.token': token });
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Invalid or expired share link' });
        }

        const linkData = canvas.shareLinks.find(l => l.token === token);
        const role = linkData.role;

        // Assign user to the appropriate list if not already present
        if (role === 'edit') {
            if (!canvas.editors.some(id => id.toString() === userId.toString())) {
                canvas.editors.push(userId);
            }
        } else {
            if (!canvas.viewers.some(id => id.toString() === userId.toString())) {
                canvas.viewers.push(userId);
            }
        }

        await canvas.save();

        res.status(200).json({
            success: true,
            message: `Successfully joined canvas with ${role} access`,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
                ownerId: canvas.ownerId,
            }
        });
    } catch (err) {
        console.error('[Access Shared Link Error]', err);
        res.status(500).json({ success: false, error: 'Server error accessing shared canvas' });
    }
});


// ─── POST /canvas/join ─── Join a canvas via room code
router.post('/join', protect, async (req, res) => {
    try {
        const { roomCode } = req.body;
        const userId = req.user._id;

        if (!roomCode) {
            return res.status(400).json({ success: false, error: 'Room code is required' });
        }

        // 1. Find the canvas
        const canvas = await Canvas.findOne({ roomCode: roomCode.toUpperCase() });

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found with this room code' });
        }

        // 2. Add user as Viewer in CanvasAccess (if not already having access)
        // Check if user is the owner
        if (canvas.ownerId && canvas.ownerId.toString() === userId.toString()) {
            return res.status(200).json({
                success: true,
                message: 'You are the owner of this canvas',
                canvas: {
                    _id: canvas._id,
                    title: canvas.title,
                    roomCode: canvas.roomCode,
                    ownerId: canvas.ownerId,
                    createdAt: canvas.createdAt,
                    updatedAt: canvas.updatedAt,
                }
            });
        }

        // Create or ensure access exists (upsert)
        // We use $setOnInsert so we don't downgrade an existing 'EDIT' role to 'VIEW'
        await CanvasAccess.findOneAndUpdate(
            { canvasId: canvas._id, userId: userId },
            { $setOnInsert: { role: 'VIEW' } },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Successfully joined canvas',
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
                ownerId: canvas.ownerId,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            }
        });
    } catch (err) {
        console.error('[Canvas Join Error]', err);
        res.status(500).json({ success: false, error: 'Failed to join canvas' });
    }
});

/**
 * ─── POST /canvas/request-edit ───
 */
router.post('/request-edit', protect, async (req, res) => {
    try {
        const { canvasId } = req.body;
        const userId = req.user._id;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) return res.status(404).json({ success: false, error: 'Canvas not found' });

        // Check if already an owner or editor
        if (canvas.ownerId.toString() === userId.toString() ||
            canvas.editors.some(id => id.toString() === userId.toString())) {
            return res.status(400).json({ success: false, error: 'You already have edit access' });
        }

        // Check if there's already a pending request
        const existing = canvas.editRequests.find(r => r.userId.toString() === userId.toString() && r.status === 'pending');
        if (existing) return res.status(400).json({ success: false, error: 'Request already pending' });

        canvas.editRequests.push({ userId, status: 'pending' });
        await canvas.save();

        res.status(200).json({ success: true, message: 'Edit request submitted' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error requesting edit access' });
    }
});

/**
 * ─── GET /canvas/edit-requests/:canvasId ───
 */
router.get('/edit-requests/:canvasId', protect, async (req, res) => {
    try {
        const { canvasId } = req.params;
        const canvas = await Canvas.findById(canvasId).populate('editRequests.userId', 'name email');

        if (!canvas) return res.status(404).json({ success: false, error: 'Canvas not found' });
        if (canvas.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Only owner can see requests' });
        }

        const pending = canvas.editRequests.filter(r => r.status === 'pending');
        res.status(200).json({ success: true, requests: pending });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error fetching requests' });
    }
});

/**
 * ─── POST /canvas/respond-edit-request ───
 */
router.post('/respond-edit-request', protect, async (req, res) => {
    try {
        const { canvasId, requestUserId, decision } = req.body; // decision: 'approved' | 'rejected'
        const canvas = await Canvas.findById(canvasId);

        if (!canvas) return res.status(404).json({ success: false, error: 'Canvas not found' });
        if (canvas.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Only owner can respond' });
        }

        const reqIdx = canvas.editRequests.findIndex(r => r.userId.toString() === requestUserId.toString() && r.status === 'pending');
        if (reqIdx === -1) return res.status(404).json({ success: false, error: 'Pending request not found' });

        if (decision === 'approved') {
            // Move to editors
            if (!canvas.editors.some(id => id.toString() === requestUserId)) {
                canvas.editors.push(requestUserId);
            }
            // Remove from viewers (optional but cleaner)
            canvas.viewers = canvas.viewers.filter(id => id.toString() !== requestUserId);
            // Remove request entry or mark as approved
            canvas.editRequests.splice(reqIdx, 1);
        } else {
            // Mark as rejected or remove
            canvas.editRequests[reqIdx].status = 'rejected';
        }

        await canvas.save();
        res.status(200).json({ success: true, message: `Request ${decision}` });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error responding to request' });
    }
});

// ─── POST /canvas/create ─── Create a new canvas (metadata only)
router.post('/create', async (req, res) => {
    try {
        let { title, roomCode } = req.body;
        let ownerId = 'single-user';

        // Auto-generate room code if not provided
        if (!roomCode) {
            let isUnique = false;
            let attempts = 0;
            while (!isUnique && attempts < 10) {
                roomCode = generateRoomCode();
                const existing = await Canvas.findOne({ roomCode });
                if (!existing) isUnique = true;
                attempts++;
            }
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

        // Check if canvas with this roomCode already exists (Idempotency)
        const existingCanvas = await Canvas.findOne({ roomCode: roomCode.toUpperCase() });

        if (existingCanvas) {
            return res.status(200).json({
                success: true,
                canvas: {
                    _id: existingCanvas._id,
                    title: existingCanvas.title,
                    roomCode: existingCanvas.roomCode,
                    ownerId: existingCanvas.ownerId,
                    createdAt: existingCanvas.createdAt,
                    updatedAt: existingCanvas.updatedAt,
                },
                message: 'Canvas already exists, returned existing one.'
            });
        }

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

// ─── GET /canvas/user-canvases ─── Get canvases where user is owner or editor
router.get('/user-canvases', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const canvases = await Canvas.find({
            $or: [
                { ownerId: userId },
                { editors: userId }
            ]
        }).sort({ updatedAt: -1 });

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

        const userId = getUserIdFromRequest(req);
        const role = getUserRole(canvas, userId);

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
                ownerId: canvas.ownerId,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
                role: role
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

        const userId = getUserIdFromRequest(req);
        const role = getUserRole(canvas, userId);

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                thumbnail: canvas.thumbnail,
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
                role: role
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
