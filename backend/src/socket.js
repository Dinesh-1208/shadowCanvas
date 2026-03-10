import { Server } from "socket.io";

const activeCanvasUsers = {}; // roomCode -> Map of userId -> { userId, userName, color }

export const initSocket = (server) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ];
    if (process.env.FRONTEND_URL) {
        allowedOrigins.push(process.env.FRONTEND_URL);
    }

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        },
    });

    io.on("connection", (socket) => {
        console.log(`[Socket] User connected: ${socket.id}`);

        socket.on("join-room", (roomCode) => {
            const normalizedRoom = roomCode.toUpperCase();
            socket.join(normalizedRoom);
            socket.data = socket.data || {};
            socket.data.roomCode = normalizedRoom;
            console.log(`[Socket] User ${socket.id} joined room: ${normalizedRoom}`);
        });

        socket.on("user_joined_canvas", (data) => {
            const { roomCode, userId, userName, color } = data;
            if (!roomCode || !userId) return;
            const normalizedRoom = roomCode.toUpperCase();
            
            socket.data = socket.data || {};
            socket.data.roomCode = normalizedRoom;
            socket.data.userId = userId;

            if (!activeCanvasUsers[normalizedRoom]) {
                activeCanvasUsers[normalizedRoom] = {};
            }
            
            activeCanvasUsers[normalizedRoom][userId] = { userId, userName, color };
            
            io.to(normalizedRoom).emit("canvas_users_update", Object.values(activeCanvasUsers[normalizedRoom]));
        });

        socket.on("canvas-update", (data) => {
            // data: { roomCode, eventType, eventData }
            const { roomCode, eventType, eventData } = data;
            const normalizedRoom = roomCode.toUpperCase();

            // Broadcast to everyone else in the room
            socket.to(normalizedRoom).emit("canvas-update", {
                eventType,
                eventData,
                senderId: socket.id
            });
        });

        socket.on("cursor_move", (data) => {
            const { roomCode, canvasId, userId, userName, cursorX, cursorY, role } = data;

            if (role === 'VIEW') {
                return;
            }

            if (roomCode) {
                const normalizedRoom = roomCode.toUpperCase();
                socket.data = socket.data || {};
                socket.data.roomCode = normalizedRoom;
                socket.data.userId = userId;

                socket.to(normalizedRoom).emit("cursor_update", {
                    canvasId,
                    userId,
                    userName,
                    cursorX,
                    cursorY
                });
            }
        });

        socket.on("cursor_idle", (data) => {
            const { roomCode, userId } = data;
            if (roomCode) {
                socket.to(roomCode.toUpperCase()).emit("cursor_idle", { userId });
            }
        });

        socket.on("leave_canvas", () => {
            if (socket.data?.roomCode && socket.data?.userId) {
                const roomCode = socket.data.roomCode;
                const userId = socket.data.userId;
                socket.to(roomCode).emit("cursor_remove", { userId });

                if (activeCanvasUsers[roomCode] && activeCanvasUsers[roomCode][userId]) {
                    delete activeCanvasUsers[roomCode][userId];
                    io.to(roomCode).emit("canvas_users_update", Object.values(activeCanvasUsers[roomCode]));
                }
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            if (socket.data?.roomCode && socket.data?.userId) {
                const roomCode = socket.data.roomCode;
                const userId = socket.data.userId;
                socket.to(roomCode).emit("cursor_remove", { userId });

                if (activeCanvasUsers[roomCode] && activeCanvasUsers[roomCode][userId]) {
                    delete activeCanvasUsers[roomCode][userId];
                    io.to(roomCode).emit("canvas_users_update", Object.values(activeCanvasUsers[roomCode]));
                }
            }
        });

        socket.on("edit-request", (data) => {
            const { roomCode, ...rest } = data;
            if (roomCode) {
                socket.to(roomCode.toUpperCase()).emit("edit-request", rest);
            }
        });

        socket.on("edit-request-resolved", (data) => {
            const { roomCode, action, userId } = data;
            if (roomCode) {
                socket.to(roomCode.toUpperCase()).emit("edit-request-resolved", { action, userId });
            }
        });
    });

    return io;
};
