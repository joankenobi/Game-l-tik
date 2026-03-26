import os
import uvicorn
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from game_engine import GameEngine
from tiktok_service import TikTokService

# Initialize Socket.IO server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI(title="TikTok Countries Game Backend (Python)")

# Add CORS middleware to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Core Services
game_engine = GameEngine(sio)
tiktok_service = TikTokService(game_engine, sio)
current_username = "@purrrr022"

# Socket.IO Handlers
@sio.on('connect')
async def handle_connect(sid, environ):
    print(f'Socket connected: {sid}')
    # Send initial config
    await sio.emit('config', {"username": current_username}, to=sid)
    # Initial status
    await sio.emit('status', {"connected": tiktok_service._connected}, to=sid)
    # Current game state
    state = game_engine.get_game_state()
    await sio.emit('gameState', state, to=sid)


@sio.on('disconnect')
async def handle_disconnect(sid):
    print(f'Socket disconnected: {sid}')

@sio.on('joinConfig')
async def handle_join_config(sid, data):
    username = data.get('username')
    if username:
        print(f"Connecting to TikTok user: {username}")
        await tiktok_service.connect(username)

@sio.on('startGame')
async def handle_start_game(sid):
    print("Starting Game Game Engine...")
    await game_engine.start_game()

@sio.on('stopGame')
async def handle_stop_game(sid):
    print("Stopping Game Game Engine...")
    await game_engine.stop_game()

# FastAPI Routes
@app.get("/")
async def root():
    return {"status": "running", "engine": "python-fastapi"}

@app.get("/health")
async def health():
    return {
        "connected_to_tiktok": tiktok_service._connected,
        "game_active": game_engine.game_active,
        "players_count": len(game_engine.players)
    }

# Wrap as standard ASGI app
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)

if __name__ == "__main__":
    # Start on port 3000 to match client's expectation
    uvicorn.run(sio_app, host="0.0.0.0", port=3000)
