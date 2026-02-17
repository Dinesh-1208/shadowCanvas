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

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        });
    });

    return io;
};
