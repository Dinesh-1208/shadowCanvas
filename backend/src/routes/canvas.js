import express from 'express';
// Updated imports to use .model.js extension
import Canvas from '../models/Canvas.model.js';
import CanvasState from '../models/CanvasState.model.js';
import CanvasEvent from '../models/CanvasEvent.model.js';
import CanvasAccess from '../models/CanvasAccess.model.js';
import EditRequest from '../models/EditRequest.model.js';

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

// ─── GET /canvas/user-canvases ─── Get all canvases for logged-in user
router.get('/user-canvases', protect, async (req, res) => {
    try {
        // Clean up expired accesses proactively
        await CanvasAccess.deleteMany({
            expiresAt: { $ne: null, $lte: new Date() }
        });

        // req.user is set by protect middleware
        const accesses = await CanvasAccess.find({
            userId: req.user._id,
            role: 'EDIT',
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).select('canvasId');
        const sharedCanvasIds = accesses.map(a => a.canvasId);

        const canvases = await Canvas.find({
            $or: [
                { ownerId: req.user._id },
                { _id: { $in: sharedCanvasIds } }
            ]
        }).populate('ownerId', 'name').sort({ updatedAt: -1 });

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

        // Check permissions
        let isAuthorized = true;
        let userId = 'single-user';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (authError) {
                // Token invalid
            }
        }

        if (canvas.ownerId !== 'single-user' && canvas.ownerId.toString() !== userId.toString()) {
            const access = await CanvasAccess.findOne({ canvasId, userId });
            if (access) {
                if (access.expiresAt && access.expiresAt < new Date()) {
                    await CanvasAccess.deleteOne({ _id: access._id });
                    isAuthorized = false;
                } else if (access.role !== 'EDIT') {
                    isAuthorized = false;
                }
            } else {
                isAuthorized = false;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, error: 'Not authorized to edit this canvas' });
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
        const canvas = await Canvas.findOne({ roomCode: roomCode.toUpperCase() }).populate('ownerId', 'name');

        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        let returnPassword = null;
        if (canvas.roomPassword) {
            let isAuthorized = false;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                try {
                    const token = req.headers.authorization.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const userId = decoded.userId;
                    if (canvas.ownerId && canvas.ownerId._id && canvas.ownerId._id.toString() === userId.toString()) {
                        isAuthorized = true;
                    }
                } catch (e) { }
            }
            if (isAuthorized) {
                returnPassword = canvas.roomPassword;
            }
        }

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                roomCode: canvas.roomCode,
                roomPassword: returnPassword,
                owner: canvas.ownerId && canvas.ownerId.name ? canvas.ownerId.name : 'Unknown',
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            }
        });
    } catch (err) {
        console.error('[Canvas Room Load Error]', err);
        res.status(500).json({ success: false, error: 'Failed to load room' });
    }
});

// ─── POST /canvas/join ─── Validate before joining
router.post('/join', async (req, res) => {
    try {
        const { roomCode, password } = req.body;
        if (!roomCode) {
            return res.status(400).json({ success: false, error: 'Room code is required' });
        }

        const canvas = await Canvas.findOne({ roomCode: roomCode.toUpperCase() });
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Invalid room code' });
        }

        if (canvas.roomPassword && canvas.roomPassword !== password) {
            return res.status(401).json({ success: false, error: 'Incorrect password' });
        }

        // Auto Add Users When Joining With Room Code
        let userId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (e) { }
        }

        if (userId && canvas.ownerId.toString() !== userId.toString()) {
            const access = await CanvasAccess.findOne({ canvasId: canvas._id, userId });
            if (!access) {
                const newAccess = new CanvasAccess({ canvasId: canvas._id, userId, role: 'EDIT' });
                await newAccess.save();
                await EditRequest.findOneAndDelete({ canvasId: canvas._id, userId });
            } else if (access.role !== 'EDIT') {
                access.role = 'EDIT';
                await access.save();
                await EditRequest.findOneAndDelete({ canvasId: canvas._id, userId });
            } else {
                await EditRequest.findOneAndDelete({ canvasId: canvas._id, userId });
            }
        }

        res.status(200).json({ success: true, canvasId: canvas._id });
    } catch (err) {
        console.error('[Canvas Join Error]', err);
        res.status(500).json({ success: false, error: 'Failed to join room' });
    }
});

// ─── GET /canvas/:id/events ─── Load state (Snapshot + Events)
router.get('/:id/events', async (req, res) => {
    try {
        const { id } = req.params;
        const mode = req.query.mode;

        // Verify canvas exists
        const canvas = await Canvas.findById(id).populate('ownerId', 'name');
        if (!canvas) {
            return res.status(404).json({ success: false, error: 'Canvas not found' });
        }

        // Clean up expired accesses proactively
        await CanvasAccess.deleteMany({ canvasId: id, expiresAt: { $ne: null, $lte: new Date() } });

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

        let returnPassword = null;
        let requestStatus = null;
        let nextAllowedRequestAt = null;
        let currentUserRole = 'VIEW';

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Safe lookup to get raw ObjectId to guarantee Mongoose matching
                const user = await User.findById(decoded.userId);
                if (user) {
                    const reqUserId = user._id;
                    const ownerIdStr = canvas.ownerId?._id?.toString() || canvas.ownerId?.toString();

                    if (ownerIdStr === reqUserId.toString()) {
                        returnPassword = canvas.roomPassword || null;
                        currentUserRole = 'OWNER';
                    } else {
                        // Check existing access FIRST
                        let acc = await CanvasAccess.findOne({ canvasId: id, userId: reqUserId });
                        if (acc && acc.role === 'EDIT') {
                            currentUserRole = 'EDIT';
                        }

                        // Auto Add Editors When Using Edit Link
                        if (mode === 'edit') {
                            currentUserRole = 'EDIT';
                            if (!acc) {
                                acc = new CanvasAccess({ canvasId: id, userId: reqUserId, role: 'EDIT' });
                                await acc.save();
                            } else if (acc.role !== 'EDIT') {
                                acc.role = 'EDIT';
                                await acc.save();
                            }
                            await EditRequest.findOneAndDelete({ canvasId: id, userId: reqUserId });
                        }

                        // Check if there is an existing edit request for this user
                        const existingReq = await EditRequest.findOne({ canvasId: id, userId: reqUserId });
                        if (existingReq) {
                            requestStatus = existingReq.status;
                            nextAllowedRequestAt = existingReq.nextAllowedRequestAt || null;
                        }
                    }
                }
            } catch (e) {
                console.error('[loadEvents authorization error]', e);
            }
        }

        console.log(`[Canvas/Events] Loaded for User: ${req.headers.authorization ? 'Logged In' : 'Guest'}, Role computed: ${currentUserRole}`);

        res.status(200).json({
            success: true,
            canvas: {
                _id: canvas._id,
                title: canvas.title,
                thumbnail: canvas.thumbnail,
                roomPassword: returnPassword,
                owner: canvas.ownerId && canvas.ownerId.name ? canvas.ownerId.name : 'Unknown',
                createdAt: canvas.createdAt,
                updatedAt: canvas.updatedAt,
            },
            requestStatus,
            nextAllowedRequestAt,
            currentUserRole,
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

// ─── DELETE /canvas/:id/leave ─── Delete canvas access (leave canvas)
router.delete('/:id/leave', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const access = await CanvasAccess.findOneAndDelete({ canvasId: id, userId: userId });

        if (!access) {
            return res.status(404).json({ success: false, error: 'Access not found or already left' });
        }

        res.json({ success: true, message: 'Successfully left the canvas' });
    } catch (err) {
        console.error('[Canvas Leave Error]', err);
        res.status(500).json({ success: false, error: 'Failed to leave canvas' });
    }
});

// ─── POST /canvas/request-edit ───
router.post('/request-edit', protect, async (req, res) => {
    try {
        const { canvasId } = req.body;
        const userId = req.user._id;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) return res.status(404).json({ success: false, error: 'Canvas not found' });

        if (canvas.ownerId.toString() === userId.toString()) {
            return res.status(400).json({ success: false, error: 'Owner already has edit access' });
        }

        const access = await CanvasAccess.findOne({ canvasId, userId });
        if (access && access.role === 'EDIT') {
            return res.status(400).json({ success: false, error: 'User already has edit access' });
        }

        let request = await EditRequest.findOne({ canvasId, userId });
        if (!request) {
            request = new EditRequest({ canvasId, userId, status: 'PENDING' });
            await request.save();
        } else {
            if (request.status === 'PENDING') {
                return res.status(400).json({ success: false, error: 'You already have a pending request.' });
            }
            if (request.status === 'REJECTED' && request.nextAllowedRequestAt) {
                const now = new Date();
                if (request.nextAllowedRequestAt > now) {
                    const diffMs = request.nextAllowedRequestAt - now;
                    const diffMins = Math.ceil(diffMs / 60000);
                    return res.status(400).json({
                        success: false,
                        error: `You can request edit access again in ${diffMins} minutes.`,
                        nextAllowedRequestAt: request.nextAllowedRequestAt
                    });
                }
            }

            request.status = 'PENDING';
            request.nextAllowedRequestAt = null; // reset cooldown just in case
            await request.save();
        }

        res.json({
            success: true,
            message: 'Edit request submitted',
            request: {
                _id: request._id,
                userId: req.user._id,
                userName: req.user.name || req.user.email
            }
        });
    } catch (err) {
        console.error('[Request Edit Error]', err);
        res.status(500).json({ success: false, error: 'Failed to request edit access' });
    }
});

// ─── GET /canvas/requests ───
router.get('/requests', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const ownedCanvases = await Canvas.find({ ownerId: userId }).select('_id');
        const canvasIds = ownedCanvases.map(c => c._id);

        const requests = await EditRequest.find({ canvasId: { $in: canvasIds }, status: 'PENDING' })
            .populate('canvasId', 'title')
            .populate('userId', 'email username');

        res.json({ success: true, requests });
    } catch (err) {
        console.error('[Get Requests Error]', err);
        res.status(500).json({ success: false, error: 'Failed to fetch requests' });
    }
});

// ─── POST /canvas/approve-edit ───
router.post('/approve-edit', protect, async (req, res) => {
    try {
        const { requestId, action, expiresInHours } = req.body; // action: 'ACCEPT' or 'REJECT'
        const ownerId = req.user._id;

        const request = await EditRequest.findById(requestId).populate('canvasId');
        if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

        if (request.canvasId.ownerId.toString() !== ownerId.toString()) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (action === 'ACCEPT') {
            request.status = 'ACCEPTED';
            let access = await CanvasAccess.findOne({ canvasId: request.canvasId._id, userId: request.userId });

            let expiresAt = null;
            if (expiresInHours) {
                expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
            }

            if (!access) {
                access = new CanvasAccess({
                    canvasId: request.canvasId._id,
                    userId: request.userId,
                    role: 'EDIT',
                    expiresAt
                });
            } else {
                access.role = 'EDIT';
                access.expiresAt = expiresAt;
            }
            await access.save();
            await request.save();
        } else {
            request.status = 'REJECTED';
            request.nextAllowedRequestAt = new Date(Date.now() + 5 * 60 * 1000);
            await request.save();
        }

        res.json({ success: true, message: 'Request processed' });
    } catch (err) {
        console.error('[Approve Edit Error]', err);
        res.status(500).json({ success: false, error: 'Failed to process request' });
    }
});

// ─── POST /canvas/:id/password ─── Manage room password
router.post('/:id/password', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const canvas = await Canvas.findById(id);
        if (!canvas) return res.status(404).json({ success: false, error: 'Canvas not found' });

        if (canvas.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'Only owner can manage password' });
        }

        canvas.roomPassword = password || null;
        await canvas.save();

        res.json({ success: true, message: 'Password updated', password: canvas.roomPassword });
    } catch (err) {
        console.error('[Update Password Error]', err);
        res.status(500).json({ success: false, error: 'Failed to update password' });
    }
});

export default router;
