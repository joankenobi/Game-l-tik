import { Server, Socket } from "socket.io";
import { GameEngine } from "../core/GameEngine";
import { TikTokService } from "./TikTokService";

export class SocketService {
    private io: Server;
    private gameEngine: GameEngine;
    private tiktokService: TikTokService | null;
    private currentUsername: string;

    constructor(io: Server, gameEngine: GameEngine) {
        this.io = io;
        this.gameEngine = gameEngine;
        this.tiktokService = null;
        this.currentUsername = "@purrrr022"; // Default

        this.setupHandlers();
    }

    private setupHandlers(): void {
        this.io.on('connection', (socket: Socket) => {
            console.log('Client connected');

            // Send initial config
            socket.emit('config', { username: this.currentUsername });

            // Handle TikTok Connection Request
            socket.on('joinConfig', (data: { username: string }) => {
                this.currentUsername = data.username;
                if (this.tiktokService) {
                    this.tiktokService.disconnect();
                }
                this.tiktokService = new TikTokService(this.currentUsername, this.gameEngine, this.io);
                this.tiktokService.connect();
            });

            // Handle Start Game
            socket.on('startGame', () => {
                console.log('Starting Game...');
                this.gameEngine.startGame();
            });
        });
    }
}