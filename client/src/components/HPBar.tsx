import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

function loadHP(): number {
    return Number(localStorage.getItem("player_hp") || "50");
}

export function HPBar() {
    const [hp, setHp] = useState({ current: loadHP(), max: 100 });

    // Listen for HP changes from Inventory (potion-heal)
    useEffect(() => {
        const handler = () => {
            setHp(prev => ({ ...prev, current: loadHP() }));
        };
        window.addEventListener("hp-changed", handler);
        return () => window.removeEventListener("hp-changed", handler);
    }, []);

    // Persist HP to localStorage when it changes
    useEffect(() => {
        localStorage.setItem("player_hp", String(hp.current));
    }, [hp.current]);

    // Passive HP regeneration: +5 HP every 30 seconds (simulates completing dailies)
    useEffect(() => {
        const interval = setInterval(() => {
            setHp(prev => {
                if (prev.current >= prev.max) return prev;
                const newHP = Math.min(prev.max, prev.current + 2);
                localStorage.setItem("player_hp", String(newHP));
                return { ...prev, current: newHP };
            });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const percentage = (hp.current / hp.max) * 100;

    const getColor = () => {
        if (percentage <= 20) return "bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)]";
        if (percentage <= 50) return "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]";
        return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]";
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Heart className="w-4 h-4 fill-red-500/20 text-red-500" />
                    <span className="font-bold">HP</span>
                </div>
                <span className={percentage <= 20 ? "text-red-400 animate-pulse font-bold" : "text-zinc-400 font-mono"}>
                    {hp.current} / {hp.max}
                </span>
            </div>

            <div className="h-4 w-full rounded-full bg-zinc-900/50 overflow-hidden border border-zinc-700/50 backdrop-blur-sm relative">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.5)_5px,rgba(0,0,0,0.5)_10px)]" />

                <motion.div
                    className={`h-full rounded-full relative z-10 ${getColor()}`}
                    initial={{ width: "100%" }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                </motion.div>
            </div>
        </div>
    );
}
