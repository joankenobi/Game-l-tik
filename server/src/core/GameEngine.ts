import { Server } from "socket.io";

export interface Player {
    userId: string;
    uniqueId: string;
    nickname: string;
    profilePictureUrl: string;
    countryCode: string;
    contribution: number;
}

export interface Country {
    score: number;
    contributors: Set<string>;
}

export class GameEngine {
    private io: Server;
    private players: Map<string, Player>;
    private countries: Map<string, Country>;
    private gameActive: boolean;
    private gameTimer: number;
    private timerInterval: NodeJS.Timeout | null;
    private stateUpdatePending: boolean;

    constructor(io: Server) {
        this.io = io;
        this.players = new Map<string, Player>();
        this.countries = new Map<string, Country>();
        this.gameActive = false;
        this.gameTimer = 3600;
        this.timerInterval = null;
        this.stateUpdatePending = false;
    }

    public registerPlayer(data: any, countryInput: string): void {
        if (!this.gameActive) return;

        // Standardization Logic (Moved from index.js)
        const countryMap: { [key: string]: string } = {
            'mx': 'Mexico', 'mexico': 'Mexico', 'mex': 'Mexico', '1': 'Mexico',
            'ar': 'Argentina', 'argentina': 'Argentina', '2': 'Argentina',
            'co': 'Colombia', 'colombia': 'Colombia', '3': 'Colombia',
            'es': 'España', 'espana': 'España', 'España': 'España', '4': 'España', 'spain': 'España',
            'us': 'USA', 'usa': 'USA', 'united states': 'USA', '5': 'USA',
            'pe': 'Peru', 'peru': 'Peru', '6': 'Peru',
            'cl': 'Chile', 'chile': 'Chile', '7': 'Chile',
            'ec': 'Ecuador', 'ecuador': 'Ecuador', '8': 'Ecuador',
            've': 'Venezuela', 'venezuela': 'Venezuela', '9': 'Venezuela',
            'bo': 'Bolivia', 'bolivia': 'Bolivia', '10': 'Bolivia',
            'py': 'Paraguay', 'paraguay': 'Paraguay', '11': 'Paraguay',
            'uy': 'Uruguay', 'uruguay': 'Uruguay', '12': 'Uruguay',
            'sv': 'El Salvador', 'elsalvador': 'El Salvador', '13': 'El Salvador',
            'jp': 'Japon', '14': 'Japon',
            'br': 'Brasil', 'brasil': 'Brasil', '15': 'Brasil',
            'pt': 'Portugal', 'portugal': 'Portugal', '16': 'Portugal',
            'it': 'Italia', 'italia': 'Italia', '17': 'Italia',
            'de': 'Alemania', 'alemania': 'Alemania', '18': 'Alemania',
            'fr': 'Francia', 'francia': 'Francia', '19': 'Francia',
            'gb': 'Reino Unido', 'reino unido': 'Reino Unido', '20': 'Reino Unido',
            'gr': 'Grecia', 'grecia': 'Grecia', '21': 'Grecia',
        };

        const countryCode = countryMap[countryInput.toLowerCase()];
        if (!countryCode) return; // Invalid country

        if (!this.players.has(data.userId)) {
            this.players.set(data.userId, {
                userId: data.userId,
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                profilePictureUrl: data.profilePictureUrl,
                countryCode: countryCode,
                contribution: 0
            });

            if (!this.countries.has(countryCode)) {
                this.countries.set(countryCode, { score: 0, contributors: new Set() });
            }
            this.countries.get(countryCode)?.contributors.add(data.userId);

            // console.log(`User ${data.uniqueId} joined ${country}`);
        }
    }

    public addPoints(userId: string, points: number): void {
        if (!this.gameActive) return;

        const player = this.players.get(userId);
        if (player) {
            player.contribution += points;

            const countryData = this.countries.get(player.countryCode);
            if (countryData) {
                countryData.score += points;
                this.stateUpdatePending = true;
            }

            // Emit immediate like/gift event for animations (bypass batching)
            // Logic handled by caller or we can emit here if purely visual
        }
    }

    public startGame(): void {
        this.gameActive = true;
        this.gameTimer = 3600;
        this.players.clear();
        this.countries.clear();
        this.stateUpdatePending = true;

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            if (this.gameTimer > 0) {
                this.gameTimer--;
                if (this.gameTimer % 1 === 0) this.stateUpdatePending = true; // Sync timer
                this.broadcastState();
            } else {
                this.finishGame();
            }
        }, 100);
    }

    private broadcastState(): void {
        if (!this.stateUpdatePending) return;

        const countriesArray = Array.from(this.countries.entries()).map(([code, data]) => ({
            code,
            score: data.score,
            contributorCount: data.contributors.size
        })).sort((a, b) => b.score - a.score);

        this.io.emit('gameState', {
            countries: countriesArray,
            timer: this.gameTimer,
            isActive: this.gameActive
        });

        this.stateUpdatePending = false;
    }

    private finishGame(): void {
        this.gameActive = false;
        if (this.timerInterval) clearInterval(this.timerInterval);

        const winners = Array.from(this.countries.entries())
            .map(([code, data]) => ({ code, score: data.score }))
            .sort((a, b) => b.score - a.score);

        const topContributors = Array.from(this.players.values())
            .sort((a, b) => b.contribution - a.contribution)
            .slice(0, 3);

        this.io.emit('gameOver', {
            winners,
            topContributors
        });
    }

    public isActive(): boolean {
        return this.gameActive;
    }

    public getPlayer(userId: string): Player | undefined {
        return this.players.get(userId);
    }
}
