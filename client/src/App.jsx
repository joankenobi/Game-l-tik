import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import CountryBar from './components/CountryBar';
import Leaderboard from './components/Leaderboard';

// Auto-detect server URL (assuming localhost for dev)
const SOCKET_URL = 'http://localhost:3000';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    countries: [],
    timer: 3600,
    isActive: false
  });
  const [status, setStatus] = useState({ connected: false, roomId: null });
  const [username, setUsername] = useState('@purrrrr02');
  const [gameOverData, setGameOverData] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => console.log('Connected to backend'));

    newSocket.on('status', (data) => setStatus(data));

    newSocket.on('gameState', (data) => {
      setGameState(data);
    });

    newSocket.on('gameOver', (data) => {
      setGameOverData(data);
    });

    newSocket.on('event', (data) => {
      // Show toast/popups for gifts?
      setLastEvent(data);
      setTimeout(() => setLastEvent(null), 3000);
    });

    return () => newSocket.close();
  }, []);

  const connectToTikTok = () => {
    if (socket) socket.emit('joinConfig', { username });
  };

  const startGame = () => {
    if (socket) {
      setGameOverData(null);
      socket.emit('startGame');
    }
  };

  // Derived State
  const maxScore = gameState.countries.length > 0 ? gameState.countries[0].score : 1;

  // Formatting Timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-tiktok-black bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black text-white p-4 font-sans selection:bg-tiktok-teal selection:text-black">

      {/* Header / Controls (Hidden if game active in prod, mostly for control) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm z-50 relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-black/50 border border-white/20 rounded px-3 py-1 outline-none focus:border-tiktok-teal transition"
          />
          <button onClick={connectToTikTok} className="px-4 py-1 bg-tiktok-red rounded hover:opacity-90 transition font-bold">
            Connect TikTok
          </button>
          <span className={`text-xs ${status.connected ? 'text-green-400' : 'text-red-400'}`}>
            {status.connected ? `Connected (${status.roomId})` : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-4xl font-black font-mono tracking-widest text-tiktok-teal drop-shadow-[0_0_10px_rgba(37,244,238,0.5)]">
            {formatTime(gameState.timer)}
          </div>
          <button onClick={startGame} className="px-6 py-2 bg-gradient-to-r from-tiktok-teal to-blue-500 rounded text-black font-bold shadow-lg hover:scale-105 transition transform">
            START GAME
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="max-w-3xl mx-auto relative min-h-[600px]">

        {/* Event Toast (Gift Popup) */}
        <AnimatePresence>
          {lastEvent && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute top-0 right-0 z-50 pointer-events-none"
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2 rounded-lg shadow-xl border-2 border-white transform rotate-2">
                {lastEvent.user} sent {lastEvent.gift}! (+{lastEvent.points})
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bars - Layout Animation */}
        <motion.div layout className="flex flex-col gap-2 mt-4">
          <AnimatePresence>
            {gameState.countries.map((country, index) => (
              <CountryBar
                key={country.code}
                country={country}
                maxScore={maxScore}
                rank={index + 1}
              />
            ))}
          </AnimatePresence>

          {gameState.countries.length === 0 && (
            <div className="text-center text-gray-500 mt-20 text-xl font-light">
              Waiting for players... <br />
              <span className="text-sm">Comment "Mexico", "USA", "Spain" etc. to join!</span>
            </div>
          )}
        </motion.div>

        {/* Leaderboard Overlay */}
        {gameOverData && <Leaderboard topContributors={gameOverData.topContributors} />}

      </div>
    </div>
  );
}

export default App;
