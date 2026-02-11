import React, { memo } from 'react';
import { motion } from 'framer-motion';

const Leaderboard = memo(({ topContributors, onPlayAgain }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl z-[100] p-4 md:p-8"
        >
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-fire-primary to-fire-secondary mb-8 drop-shadow-[0_0_15px_rgba(255,100,0,0.5)]">
                CHAMPIONS
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl items-end mb-12">
                {/* 2nd Place */}
                {topContributors[1] && (
                    <WinnerCard player={topContributors[1]} rank={2} color="#C0C0C0" height="h-32 md:h-48" delay={0.2} />
                )}

                {/* 1st Place */}
                {topContributors[0] && (
                    <WinnerCard player={topContributors[0]} rank={1} color="#FFD700" height="h-44 md:h-64" delay={0.4} />
                )}

                {/* 3rd Place */}
                {topContributors[2] && (
                    <WinnerCard player={topContributors[2]} rank={3} color="#cd7f32" height="h-28 md:h-40" delay={0.6} />
                )}
            </div>

            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={onPlayAgain}
                className="px-8 py-3 bg-gradient-to-r from-fire-primary to-fire-secondary rounded-full font-black text-lg text-white shadow-[0_0_20px_rgba(255,69,0,0.5)] border border-white/20 hover:scale-110 active:scale-95 transition-all animate-float"
            >
                PLAY AGAIN
            </motion.button>
        </motion.div>
    );
});

const WinnerCard = memo(({ player, rank, color, height, delay }) => (
    <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, type: "spring" }}
        className={`flex flex-col items-center justify-end ${height} bg-gray-900 rounded-t-2xl border-t-4 p-4 shadow-2xl relative`}
        style={{ borderColor: color }}
    >
        <div className="absolute -top-12">
            <img
                src={player.profilePictureUrl}
                alt={player.nickname}
                className="w-20 h-20 rounded-full border-4 shadow-lg object-cover bg-gray-700"
                style={{ borderColor: color }}
            />
            <div className="absolute -bottom-2 -right-2 bg-gray-800 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold border border-white/20">
                {rank}
            </div>
        </div>

        <div className="text-center mt-8">
            <h3 className="font-bold text-lg truncate w-32">{player.nickname}</h3>
            <p className="text-sm text-gray-400">{player.countryCode}</p>
            <p className="text-2xl font-black mt-2 text-tiktok-teal">{player.contribution}</p>
        </div>
    </motion.div>
));

export default Leaderboard;
