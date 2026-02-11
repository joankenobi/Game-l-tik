import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './core/GameEngine';
import { TikTokService } from './services/TikTokService';
import { SocketService } from './services/SocketService';

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialization ---
const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Dependency Injection ---
const gameEngine = new GameEngine(io);
const socketService = new SocketService(io, gameEngine);

// --- Start Server ---
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: TypeScript Strict Mode`);
});
