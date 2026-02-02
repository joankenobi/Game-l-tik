import React from 'react';
import { motion } from 'framer-motion';

const Leaderboard = ({ topContributors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl z-50 p-8"
        >
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-tiktok-teal to-tiktok-red mb-8 drop-shadow-2xl">
                CHAMPIONS
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl items-end">
                {/* 2nd Place */}
                {topContributors[1] && (
                    <WinnerCard player={topContributors[1]} rank={2} color="silver" height="h-48" delay={0.2} />
                )}

                {/* 1st Place */}
                {topContributors[0] && (
                    <WinnerCard player={topContributors[0]} rank={1} color="#FFD700" height="h-64" delay={0.4} />
                )}

                {/* 3rd Place */}
                {topContributors[2] && (
                    <WinnerCard player={topContributors[2]} rank={3} color="#cd7f32" height="h-40" delay={0.6} />
                )}
            </div>
        </motion.div>
    );
};

const WinnerCard = ({ player, rank, color, height, delay }) => (
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
);

export default Leaderboard;
