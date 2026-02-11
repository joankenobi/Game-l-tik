import { WebcastPushConnection } from 'tiktok-live-connector';
import { GameEngine } from '../core/GameEngine';
import { Server } from 'socket.io';

export class TikTokService {
    private connection: WebcastPushConnection;
    private gameEngine: GameEngine;
    private io: Server;

    constructor(username: string, gameEngine: GameEngine, io: Server) {
        this.connection = new WebcastPushConnection(username);
        this.gameEngine = gameEngine;
        this.io = io;
        this.setupEvents();
    }

    public async connect(): Promise<void> {
        try {
            const state = await this.connection.connect();
            console.log(`Connected to TikTok Room: ${state.roomId}`);
            this.io.emit('status', { connected: true, roomId: state.roomId });
        } catch (error: any) {
            console.error('Failed to connect to TikTok', error);
            this.io.emit('status', { connected: false, error: error.message || 'Unknown error' });
        }
    }

    public disconnect(): void {
        this.connection.disconnect();
    }

    private setupEvents(): void {
        // Chat: Register Player
        this.connection.on('chat', (data) => {
            if (!this.gameEngine.isActive()) return;
            const msg = data.comment.trim();
            this.gameEngine.registerPlayer(data, msg);
        });

        // Like: Add Points
        this.connection.on('like', (data) => {
            console.log(`❤️  ${data.uniqueId} sent ${data.likeCount} likes out`);
            if (!this.gameEngine.isActive()) return;

            const player = this.gameEngine.getPlayer(data.userId);
            if (player) {
                // Add points (simplified, usually batched)
                this.gameEngine.addPoints(data.userId, data.likeCount);

                console.log(`❤️❤️  ${data.uniqueId} sent ${data.likeCount} likes IN`);

                // Visual Event
                this.io.emit('likeEvent', {
                    username: player.nickname,
                    country: player.countryCode
                });
            }
        });

        // Gift: Add Points
        this.connection.on('gift', (data) => {
            if (!this.gameEngine.isActive()) return;
            if (data.repeatEnd) {
                const player = this.gameEngine.getPlayer(data.userId);
                if (player) {
                    let points = 0;
                    const giftName = data.giftName.toLowerCase();

                    if (giftName.includes('rose')) {
                        points = 10 * data.repeatCount;
                    } else if (giftName.includes('cap') || giftName.includes('tiktok')) {
                        points = 100 * data.repeatCount;
                    } else {
                        points = (data.diamondCount * 1) * data.repeatCount;
                    }

                    if (points > 0) {
                        this.gameEngine.addPoints(data.userId, points);

                        // Visual Event
                        this.io.emit('event', {
                            type: 'gift',
                            user: player.nickname,
                            country: player.countryCode,
                            gift: data.giftName,
                            points
                        });
                    }
                }
            }
        });
    }
}
