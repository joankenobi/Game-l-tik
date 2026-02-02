require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

// --- Game State ---
const PLAYERS = new Map(); // userId -> { userId, secUid, uniqueId, nickname, profilePictureUrl, countryCode, contribution }
const COUNTRIES = new Map(); // countryCode -> { score, contributors: Set<userId> }
let TIKTOK_USERNAME = "@purrrrr02"; // Default, can be changed via socket
let tiktokConnection = null;
let gameActive = false;
let gameTimer = 3600; // 1 hour in seconds
let timerInterval = null;

// Helper: Standardize Country (Simple version for demo)
// You can expand this list or use a library
const COUNTRY_MAP = {
    'mx': 'Mexico', 'mexico': 'Mexico', 'mex': 'Mexico', '1': 'Mexico',
    'ar': 'Argentina', 'argentina': 'Argentina', '2': 'Argentina',
    'co': 'Colombia', 'colombia': 'Colombia', '3': 'Colombia',
    'es': 'España', 'espana': 'España', 'España': 'España', '4': 'España','spain': 'España',
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
    // Add more as needed
};

// --- Optimization: Batching ---
let stateUpdatePending = false;
const BATCH_INTERVAL_MS = 100; // Update frontend max 10 times/second

function broadcastState() {
    if (!stateUpdatePending) return;

    // Convert Maps to Arrays for JSON serialization
    const countriesArray = Array.from(COUNTRIES.entries()).map(([code, data]) => ({
        code,
        score: data.score,
        contributorCount: data.contributors.size
    })).sort((a, b) => b.score - a.score);

    io.emit('gameState', {
        countries: countriesArray,
        timer: gameTimer,
        isActive: gameActive
    });

    stateUpdatePending = false;
}

setInterval(broadcastState, BATCH_INTERVAL_MS);


// --- TikTok Logic ---
function connectToTikTok(username) {
    if (tiktokConnection) {
        tiktokConnection.disconnect();
    }

    tiktokConnection = new WebcastPushConnection(username);

    tiktokConnection.connect().then(state => {
        console.log(`Connected to ${state.roomId}`);
        io.emit('status', { connected: true, roomId: state.roomId });
    }).catch(err => {
        console.error('Failed to connect', err);
        io.emit('status', { connected: false, error: err.message });
    });

    // Chat: Join Country
    tiktokConnection.on('chat', (data) => {
        if (!gameActive) return;

        const msg = data.comment.toLowerCase().trim();
        const country = COUNTRY_MAP[msg];

        if (country) {
            // Register Player
            if (!PLAYERS.has(data.userId)) {
                PLAYERS.set(data.userId, {
                    userId: data.userId,
                    uniqueId: data.uniqueId,
                    nickname: data.nickname,
                    profilePictureUrl: data.profilePictureUrl,
                    countryCode: country,
                    contribution: 0
                });

                // Init Country if needed
                if (!COUNTRIES.has(country)) {
                    COUNTRIES.set(country, { score: 0, contributors: new Set() });
                }
                COUNTRIES.get(country).contributors.add(data.userId); // Add to set

                // console.log(`User ${data.uniqueId} joined ${country}`);
            }
        }
    });

    // Like: +1 Point
    tiktokConnection.on('like', (data) => {
        if (!gameActive) return;
        const player = PLAYERS.get(data.userId);
        if (player) {
            const points = data.likeCount; // Usually sent in batches by TikTok
            // Update Country
            const countryData = COUNTRIES.get(player.countryCode);
            if (countryData) {
                countryData.score += points;
                stateUpdatePending = true;
            }
            // Update Player
            player.contribution += points;
        }
    });

    // Gift: +10 (Rose) / +100 (TikTok Cap)
    tiktokConnection.on('gift', (data) => {
        if (!gameActive) return;
        if (data.repeatEnd) { // Handle series gifts only at end or calculate diff? usually repeatEnd is safer for total count
            // Note: TikTok gift logic can be complex with streaks. 
            // Simplified: Use repeatCount if repeatEnd is true.

            const player = PLAYERS.get(data.userId);
            if (player) {
                let points = 0;
                // Check Gift ID or Name. 
                // Rose ID often 5655. TikTok Cap ??
                // Using name for readability, but ID is better.
                const giftName = data.giftName.toLowerCase();

                if (giftName.includes('rose')) {
                    points = 10 * data.repeatCount;
                } else if (giftName.includes('cap') || giftName.includes('tiktok')) {
                    // Assuming 'cap' means TikTok Cap. Verify ID in prod.
                    points = 100 * data.repeatCount;
                } else {
                    // Default fallback or ignore others?
                    // Let's give 1 point per coin cost as fallback if available, or just ignore.
                    points = (data.diamondCount * 1) * data.repeatCount;
                }

                if (points > 0) {
                    const countryData = COUNTRIES.get(player.countryCode);
                    if (countryData) {
                        countryData.score += points;
                        stateUpdatePending = true;
                    }
                    player.contribution += points;

                    // Emit high value event purely for visual flair (fireworks etc)
                    io.emit('event', { type: 'gift', user: player.nickname, country: player.countryCode, gift: data.giftName, points });
                }
            }
        }
    });
}

// --- Socket Handlers ---
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.emit('config', { username: TIKTOK_USERNAME });

    socket.on('joinConfig', (data) => {
        TIKTOK_USERNAME = data.username;
        connectToTikTok(TIKTOK_USERNAME);
    });

    socket.on('startGame', () => {
        gameActive = true;
        gameTimer = 3600;
        // Reset scores? Only if requested. Assuming yes for new game.
        COUNTRIES.clear();
        PLAYERS.clear();
        stateUpdatePending = true;

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (gameTimer > 0) {
                gameTimer--;
                if (gameTimer % 5 === 0) stateUpdatePending = true; // Sync timer every 5s via state, client can interpolate
            } else {
                gameActive = false;
                clearInterval(timerInterval);
                finishGame();
            }
        }, 1000);
    });
});

function finishGame() {
    console.log("Game Finished");
    // Sort winners
    const winners = Array.from(COUNTRIES.entries())
        .map(([code, data]) => ({ code, score: data.score }))
        .sort((a, b) => b.score - a.score);

    // Get top contributors globally or per country? 
    // Prompt says: "who contributed most, 1st, 2nd, 3rd". Implicitly global.
    const topContributors = Array.from(PLAYERS.values())
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3);

    io.emit('gameOver', {
        winners,
        topContributors
    });
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
