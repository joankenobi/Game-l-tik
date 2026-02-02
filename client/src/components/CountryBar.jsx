import React from 'react';
import { motion } from 'framer-motion';

const flagMap = {
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Colombia': '🇨🇴',
    'Spain': '🇪🇸',
    'USA': '🇺🇸',
    'Peru': '🇵🇪',
    'Chile': '🇨🇱',
    'Ecuador': '🇪🇨',
};

const CountryBar = ({ country, maxScore, rank }) => {
    const { code, score, contributorCount } = country;
    const flag = flagMap[code] || '🏳️';

    // Calculate percentage, min 10% for visibility
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const widthRaw = Math.max(percentage, 10); // always show a little bit

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="mb-3 relative w-full h-14 bg-gray-800/40 rounded-full backdrop-blur-md overflow-hidden border border-white/10 shadow-lg flex items-center"
        >
            {/* Background Bar Animation */}
            <motion.div
                className={`absolute top-0 left-0 h-full bg-gradient-to-r from-tiktok-teal/80 to-tiktok-red/80 shadow-[0_0_15px_rgba(37,244,238,0.5)]`}
                initial={{ width: '0%' }}
                animate={{ width: `${widthRaw}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Content Layer (on top of bar) */}
            <div className="relative z-10 w-full flex items-center px-4 justify-between text-white font-bold text-lg">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl drop-shadow-md">{rank}.</span>
                    <span className="text-3xl drop-shadow-md">{flag}</span>
                    <span className="text-xl tracking-wide uppercase drop-shadow-lg">{code}</span>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end leading-tight">
                        <span className="text-xs text-gray-300 font-medium">{contributorCount} contributors</span>
                        <motion.span
                            key={score} // Trigger animation on score change
                            initial={{ scale: 1.2, color: '#25F4EE' }}
                            animate={{ scale: 1, color: '#fff' }}
                            className="text-2xl font-black tabular-nums drop-shadow-lg"
                        >
                            {score.toLocaleString()}
                        </motion.span>
                    </div>
                </div>
            </div>

            {/* Shiny effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
        </motion.div>
    );
};

export default CountryBar;
