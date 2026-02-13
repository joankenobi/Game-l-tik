import React, { useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import CountryBar from './components/CountryBar';
import Podium from './components/Podium';
import EventTicker from './components/EventTicker';
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
  const [activeLikes, setActiveLikes] = useState([]);
  const [activeGifts, setActiveGifts] = useState([]);
  const [tickerEvents, setTickerEvents] = useState([]); // For the bottom marquee

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

    newSocket.on('likeEvent', (data) => {
      // Spawn multiple hearts based on likeCount for "real-time" feel
      // Use a multiplier or a capped count to avoid performance issues
      const heartsToSpawn = Math.min(data.likeCount || 1, 10);

      for (let i = 0; i < heartsToSpawn; i++) {
        setTimeout(() => {
          const id = Math.random().toString(36).substr(2, 9) + i;
          const newLike = { ...data, id, type: 'like' };
          setActiveLikes(prev => [...prev.slice(-49), newLike]); // Cap list size

          setTimeout(() => {
            setActiveLikes(prev => prev.filter(l => l.id !== id));
          }, 1200);
        }, i * 150); // Stagger the spawn
      }

      // Update ticker occasionally for likes (to avoid spam)
      if (Math.random() > 0.8) {
        setTickerEvents(prev => [...prev.slice(-19), { ...data, id: Date.now(), type: 'like' }]);
      }
    });

    newSocket.on('event', (data) => {
      if (data.type === 'gift') {
        const id = Math.random().toString(36).substr(2, 9);
        const newGift = { ...data, id };
        setActiveGifts(prev => [...prev, newGift]);
        setTickerEvents(prev => [...prev.slice(-19), newGift]);

        setTimeout(() => {
          setActiveGifts(prev => prev.filter(g => g.id !== id));
        }, 4000);
      }
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
  const top3 = gameState.countries.slice(0, 3);
  const restOfCountries = gameState.countries.slice(3, 20);

  // Formatting Timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pre-index events by country
  const likesByCountry = useMemo(() => {
    const map = {};
    activeLikes.forEach(like => {
      if (!map[like.country]) map[like.country] = [];
      map[like.country].push(like);
    });
    return map;
  }, [activeLikes]);

  const giftsByCountry = useMemo(() => {
    const map = {};
    activeGifts.forEach(gift => {
      if (!map[gift.country]) map[gift.country] = [];
      map[gift.country].push(gift);
    });
    return map;
  }, [activeGifts]);

  return (
    <div className="min-h-screen bg-background-dark text-white font-display overflow-hidden relative selection:bg-fire-primary selection:text-white">

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[50%] bg-gradient-to-b from-slate-900 to-transparent opacity-80"></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-fire-primary/20 blur-[100px] rounded-full animate-pulse-glow-fire"></div>
        <div className="absolute bottom-0 w-full h-[300px] bg-gradient-to-t from-black via-slate-900/80 to-transparent"></div>
      </div>

      {/* Header / Timer */}
      <header className="relative z-20 pt-4 px-4 pb-2 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-700">Final Round</span>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-red-600 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-red-500/40 rounded-xl px-5 py-1.5 flex items-center gap-3 shadow-[0_0_25px_rgba(255,0,0,0.15)] relative z-10">
            <span className="material-icons-round text-red-500 text-lg animate-pulse">timer</span>
            <span className="text-3xl font-black tabular-nums tracking-wider text-white text-glow-fire leading-none">
              {formatTime(gameState.timer)}
            </span>
          </div>
        </div>
        {/* Progress/Timer Bar */}
        <div className="w-full max-w-md h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden box-content border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 shadow-[0_0_10px_#FF4500] animate-[shimmer_2s_linear_infinite]"
            style={{ width: '100%' }} // Could be dynamic based on total time
          ></div>
        </div>
      </header>

      {/* Controls (Hidden/Subtle) */}
      {/* Control Panel */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 group">
        <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl flex items-center gap-2 transition-all opacity-40 hover:opacity-100 group-hover:opacity-100">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-zinc-800/50 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-fire-primary w-24 placeholder-zinc-500"
            placeholder="@username"
          />
          <button
            onClick={connectToTikTok}
            className={`text-xs px-3 py-1 rounded font-bold transition border ${status.connected ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-zinc-700 hover:bg-zinc-600 border-white/10 text-zinc-300'}`}
          >
            {status.connected ? 'Connected' : 'Connect'}
          </button>
          <button
            onClick={startGame}
            className="text-xs px-3 py-1 bg-gradient-to-r from-fire-primary to-fire-secondary rounded font-bold text-white shadow-[0_0_10px_rgba(255,69,0,0.4)] hover:scale-105 transition active:scale-95 border border-white/20"
          >
            Start
          </button>
        </div>

        {status.connected && (
          <div className="text-[10px] bg-green-900/40 text-green-400 px-3 py-1 rounded-full border border-green-500/20 backdrop-blur-sm shadow-lg animate-fade-in">
            Room: {status.roomId}
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="relative z-10 flex flex-col h-[85vh]">
        {/* Top 3 Podium */}
        <div className="flex-shrink-0">
          <Podium topCountries={top3} maxScore={maxScore} />
        </div>

        {/* Scrollable Leaderboard for the rest */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 bg-background-dark/50 backdrop-blur-sm rounded-t-3xl border-t border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] mx-auto w-full max-w-md pb-24">
          <div className="sticky top-0 z-20 bg-background-dark/90 backdrop-blur-md px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <span className="material-icons-round text-sm">leaderboard</span> Leaderboard
            </h2>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">Top 20</span>
          </div>

          <div className="p-2">
            <AnimatePresence>
              {restOfCountries.map((country, index) => (
                <CountryBar
                  key={country.code}
                  country={country}
                  maxScore={maxScore}
                  rank={index + 4} // Starting from 4th place
                  likes={likesByCountry[country.code] || []}
                  gifts={giftsByCountry[country.code] || []}
                />
              ))}
            </AnimatePresence>
            {gameState.countries.length === 0 && (
              <div className="text-center p-10 text-zinc-500 text-sm">
                Write your country USA, Argentina, Peru and play sending likes...
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer Ticker */}
      <EventTicker events={tickerEvents} />

      {/* Global Likes Layer (For non-registered users) */}
      <div className="fixed inset-0 pointer-events-none z-[40]">
        <AnimatePresence>
          {activeLikes.filter(l => l.country === 'USA').map((like) => (
            <motion.div
              key={like.id}
              initial={{ opacity: 0, scale: 0, y: '100vh', x: `${Math.random() * 80 + 10}vw` }}
              animate={{
                opacity: [0, 1, 0],
                y: '-10vh',
                x: `${Math.random() * 20 - 10 + 50}vw`,
                scale: [0.5, 1.5, 1],
                rotate: Math.random() * 360
              }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute"
            >
              <div className="flex flex-col items-center">
                <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">❤️</span>
                <span className="text-[10px] font-bold text-white/60 bg-black/30 px-1 rounded backdrop-blur-sm">
                  {like.username}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Over Overlay */}
      {gameOverData && <Leaderboard topContributors={gameOverData.topContributors} onPlayAgain={startGame} />}

    </div>
  );
}

export default App;
