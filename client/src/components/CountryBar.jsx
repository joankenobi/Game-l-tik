import React, { memo } from 'react';
import heartImg from '../assets/corazon tap.png';
import { motion, AnimatePresence } from 'framer-motion';

const flagMap = {
    'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'España': '🇪🇸', 'USA': '🇺🇸',
    'Peru': '🇵🇪', 'Chile': '🇨🇱', 'Ecuador': '🇪🇨', 'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴',
    'Paraguay': '🇵🇾', 'Uruguay': '🇺🇾', 'El Salvador': '🇸🇻', 'Japon': '🇯🇵', 'Brasil': '🇧🇷',
    'Portugal': '🇵🇹', 'Italia': '🇮🇹', 'Alemania': '🇩🇪', 'Francia': '🇫🇷', 'Reino Unido': '🇬🇧',
    'Grecia': '🇬🇷',
};

const CountryBar = memo(({ country, maxScore, rank, likes = [], gifts = [] }) => {
    const { code, score, contributorCount } = country;
    const flag = flagMap[code] || '🏳️';

    // Calculate percentage, min 10% for visibility
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-rank p-2 rounded-xl flex items-center gap-3 relative overflow-hidden mb-2 border border-white/5 bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 backdrop-blur-md"
        >
            {/* Rank Number */}
            <div className="font-black text-white/30 text-sm w-6 text-center">{rank}</div>

            {/* Flag Avatar */}
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-lg bg-zinc-800 shadow-sm relative z-10 shrink-0">
                {flag}
            </div>

            {/* Info & Bar */}
            <div className="flex-1 z-10 min-w-0">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-200 truncate">{code}</span>
                    <span className="font-bold text-xs text-ice-accent tabular-nums">
                        {score.toLocaleString()}
                    </span>
                </div>

                <div className="h-1.5 w-full bg-zinc-800/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: "spring", stiffness: 50 }}
                        className="h-full bg-gradient-to-r from-blue-900 to-ice-primary rounded-full shadow-[0_0_5px_#00FFFF]"
                    />
                </div>
            </div>

            {/* Floating Likes Layer */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                <AnimatePresence>
                    {likes.map((like) => (
                        <motion.div
                            key={like.id}
                            initial={{ opacity: 0, y: 10, x: Math.random() * 200 + 50, scale: 0.5 }}
                            animate={{
                                opacity: [0, 1, 0],
                                y: -40 - Math.random() * 30,
                                x: (Math.random() - 0.5) * 50 + 150,
                                scale: [0.5, 1.2, 0.8],
                                rotate: (Math.random() - 0.5) * 60
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute right-0 top-1/2 z-50 pointer-events-none"
                        >
                            <img src={heartImg} alt="heart" className="w-6 h-6 drop-shadow-lg" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Gift Animation Layer */}
            <div className="absolute inset-0 overflow-visible pointer-events-none">
                <AnimatePresence>
                    {gifts.map((gift) => (
                        <motion.div
                            key={gift.id}
                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                            animate={{ opacity: 1, scale: 1.2, y: -30 }}
                            exit={{ opacity: 0, scale: 0.5, y: -50 }}
                            className="absolute right-4 top-0 z-[60] flex flex-col items-center"
                        >
                            <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">🎁</span>
                            <span className="text-[10px] font-bold text-yellow-400 bg-black/50 px-1 rounded shadow-sm">
                                +{gift.points}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Flash Effect on Score Update (Optional) */}
            <AnimatePresence>
                {gifts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-white z-0 mix-blend-overlay"
                    />
                )}
            </AnimatePresence>

        </motion.div>
    );
});

export default CountryBar;
