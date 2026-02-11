import React, { memo } from 'react';
import { motion } from 'framer-motion';

const Podium = memo(({ topCountries, maxScore }) => {
    // Ensure we always have 3 slots even if fewer players
    const first = topCountries[0] || null;
    const second = topCountries[1] || null;
    const third = topCountries[2] || null;

    return (
        <div className="relative -mt-10 z-10 flex items-end justify-center h-[35vh] gap-2 md:gap-4 px-2 pb-6">
            {/* 2nd Place (Left) */}
            <PodiumStep
                country={second}
                rank={2}
                delay={0.2}
                barColor="from-blue-900/60 to-ice-primary/80"
                borderColor="border-ice-accent/30"
                glowColor="shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                height="h-32 md:h-40"
            />

            {/* 1st Place (Center - Big) */}
            <PodiumStep
                country={first}
                rank={1}
                delay={0.1}
                barColor="from-fire-primary/80 to-yellow-500/80"
                borderColor="border-fire-bright/50"
                glowColor="shadow-[0_0_40px_rgba(255,69,0,0.5)]"
                height="h-48 md:h-56"
                isFirst={true}
            />

            {/* 3rd Place (Right) */}
            <PodiumStep
                country={third}
                rank={3}
                delay={0.3}
                barColor="from-orange-900/60 to-orange-700/60"
                borderColor="border-orange-500/30"
                glowColor="shadow-[0_0_20px_rgba(255,140,0,0.2)]"
                height="h-24 md:h-32"
            />
        </div>
    );
});

const PodiumStep = ({ country, rank, delay, barColor, borderColor, glowColor, height, isFirst = false }) => {
    if (!country) {
        // Placeholder for empty slot
        return <div className={`w-[28%] ${height} opacity-0`}></div>;
    }

    const flagMap = {
        'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Colombia': '🇨🇴', 'España': '🇪🇸', 'USA': '🇺🇸',
        'Peru': '🇵🇪', 'Chile': '🇨🇱', 'Ecuador': '🇪🇨', 'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴',
        'Paraguay': '🇵🇾', 'Uruguay': '🇺🇾', 'El Salvador': '🇸🇻', 'Japon': '🇯🇵', 'Brasil': '🇧🇷',
        'Portugal': '🇵🇹', 'Italia': '🇮🇹', 'Alemania': '🇩🇪', 'Francia': '🇫🇷', 'Reino Unido': '🇬🇧',
        'Grecia': '🇬🇷',
    };

    const flag = flagMap[country.code] || '🏳️';

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: 'spring', stiffness: 100 }}
            className={`flex flex-col items-center group relative z-10 w-[30%] ${isFirst ? '-mb-2 z-20 scale-110' : ''}`}
        >
            {/* Crown / Rank Badge */}
            <div className="mb-2 relative">
                {isFirst && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl z-50 animate-float filter drop-shadow-lg">
                        👑
                    </div>
                )}

                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] ${borderColor} ${glowColor} bg-zinc-800 flex items-center justify-center text-4xl shadow-lg relative overflow-hidden`}>
                    <span className="relative z-10">{flag}</span>
                    {isFirst && <div className="absolute inset-0 bg-fire-primary/20 animate-pulse-glow-fire"></div>}
                </div>

                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-900 text-white rounded-full w-6 h-6 flex items-center justify-center font-black border ${borderColor} text-xs shadow-lg`}>
                    {rank}
                </div>
            </div>

            {/* The Bar */}
            <div className={`w-full ${height} bg-gradient-to-t ${barColor} backdrop-blur-md rounded-t-xl border-t border-x ${borderColor} flex flex-col items-center justify-end p-2 relative overflow-hidden shadow-xl`}>
                {/* Internal Flame/Glow Animation for 1st */}
                {isFirst && (
                    <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-red-600/40 via-fire-primary/20 to-transparent animate-flame-wave origin-bottom"></div>
                )}

                <h3 className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-tight mb-1 relative z-10 drop-shadow-md truncate w-full text-center">
                    {country.code}
                </h3>
                <span className="text-sm md:text-xl font-extrabold text-white tabular-nums tracking-tight drop-shadow-md relative z-10">
                    {country.score.toLocaleString()}
                </span>
            </div>
        </motion.div>
    );
};

export default Podium;
