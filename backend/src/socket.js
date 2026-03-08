import { Server } from "socket.io";

export const initSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
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
            const { roomCode, canvasId, userId, userName, cursorX, cursorY } = data;
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

        socket.on("leave_canvas", () => {
            if (socket.data?.roomCode && socket.data?.userId) {
                socket.to(socket.data.roomCode).emit("cursor_remove", { userId: socket.data.userId });
            }
        });

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
            if (socket.data?.roomCode && socket.data?.userId) {
                socket.to(socket.data.roomCode).emit("cursor_remove", { userId: socket.data.userId });
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
