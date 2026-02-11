import { Player, Country } from '../interfaces/coreInterfaces';

class GameEngine {
    io: any;
    players: Map<string, Player>;
    countries: Map<string, Country>;
    gameActive: boolean;
    gameTimer: number;
    timerInterval: any;
    constructor(io:any) {
        this.io = io;
        this.players  = new Map<string, Player>();
        this.countries = new Map<string, Country>();
        this.gameActive = false;
        this.gameTimer = 3600;
        this.timerInterval = null;
    }

    registerPlayer(data: any,country: string){
        /*
        Registra un jugador en el juego
        */
        if (!this.players.has(data.userId)) {
            this.players.set(data.userId, {
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                countryCode: country,
                contribution: 0
            });
        }
    }

    addPoints(userId: string, points: number){
        /*
        Agrega puntos a un jugador
        */
        const player = this.players.get(userId);
        if (player) {
            player.contribution += points;
            this.io.emit('gameState', {
                countries: Array.from(this.countries.entries()).map(([code, data]) => ({
                    code,
                    score: data.score,
                    contributorCount: data.contributors.size
                })).sort((a, b) => b.score - a.score),
                timer: this.gameTimer,
                isActive: this.gameActive
            });
        }
    }

    startTick() {
        this.gameActive = true;
        this.timerInterval = setInterval(() => {
            this.gameTimer--;
            this.io.emit('gameState', {
                countries: Array.from(this.countries.entries()).map(([code, data]) => ({
                    code,
                    score: data.score,
                    contributorCount: data.contributors.size
                })).sort((a, b) => b.score - a.score),
                timer: this.gameTimer,
                isActive: this.gameActive
            });
            if (this.gameTimer <= 0) {
                this.stopTick();
            }
        }, 1000);
    }

    stopTick() {
        this.gameActive = false;
        clearInterval(this.timerInterval);
    }
}
