import { AnimatePresence, motion } from "framer-motion";
import { Crown, Medal, Trophy, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

const rankColors: Record<string, string> = {
    Thorium: "text-purple-400",
    Diamante: "text-blue-400",
    Platina: "text-cyan-400",
    Ouro: "text-yellow-500",
    Prata: "text-slate-400",
    Ferro: "text-gray-500",
};

const positionIcons = [
    <Crown className="w-4 h-4 text-yellow-400" />,
    <Medal className="w-4 h-4 text-slate-300" />,
    <Medal className="w-4 h-4 text-amber-700" />,
];

export function BattleFeed() {
    const { data: leaderboard = [] } = trpc.profile.getLeaderboard.useQuery(undefined, {
        refetchInterval: 30000, // refresh every 30s
    });

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[360px] overflow-hidden rounded-xl border border-primary/20 bg-background/95 backdrop-blur-md p-4 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
            <h4 className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-primary">
                <Trophy className="w-3.5 h-3.5" />
                Ranking da Guilda
            </h4>

            {leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Carregando ranking...</p>
            ) : (
                <div className="space-y-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {leaderboard.map((player, i) => (
                            <motion.div
                                key={player.userId}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex items-center gap-3 py-2 px-2 rounded-lg text-sm transition-colors ${i === 0
                                        ? "bg-yellow-500/10 border border-yellow-500/20"
                                        : i < 3
                                            ? "bg-card/50"
                                            : "hover:bg-card/30"
                                    }`}
                            >
                                {/* Position */}
                                <div className="w-6 flex justify-center shrink-0">
                                    {i < 3 ? (
                                        positionIcons[i]
                                    ) : (
                                        <span className="text-xs text-muted-foreground font-mono">{i + 1}º</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
                                    {player.avatarUrl ? (
                                        <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Name + Rank */}
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-xs truncate block">
                                        {player.name || "Herói"}
                                    </span>
                                    <span className={`text-[10px] ${rankColors[player.rank] || "text-gray-500"}`}>
                                        {player.rank}
                                    </span>
                                </div>

                                {/* Level + XP */}
                                <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-primary">Lvl {player.currentLevel}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{player.totalXp} XP</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
